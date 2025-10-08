-- =====================================================
-- FULL INVITATION MANAGEMENT SYSTEM
-- Professional grade with tracking, reminders, bulk import
-- =====================================================

-- ============================================
-- 1. INVITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Invitee details
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(255),
  personal_message TEXT,
  
  -- Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invite_code VARCHAR(32) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  last_reminded_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_opened BOOLEAN DEFAULT false,
  email_clicked BOOLEAN DEFAULT false,
  
  -- Reminders
  reminders_sent INT DEFAULT 0,
  
  CONSTRAINT unique_email_per_practice UNIQUE(practice_id, email)
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
CREATE INDEX idx_invitations_practice ON invitations(practice_id);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);

COMMENT ON TABLE invitations IS 'Team member invitations with full tracking';

-- ============================================
-- 2. INVITATION EVENTS LOG
-- ============================================

CREATE TABLE IF NOT EXISTS invitation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'sent', 'opened', 'clicked', 'accepted', 
    'expired', 'revoked', 'resent', 'reminded'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitation_events_invitation ON invitation_events(invitation_id);
CREATE INDEX idx_invitation_events_type ON invitation_events(event_type);
CREATE INDEX idx_invitation_events_created ON invitation_events(created_at DESC);

COMMENT ON TABLE invitation_events IS 'Audit log of all invitation activities';

-- ============================================
-- 3. BULK IMPORT BATCHES
-- ============================================

CREATE TABLE IF NOT EXISTS invitation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Batch details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Counts
  total_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  accepted_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- File info
  filename VARCHAR(255),
  file_data JSONB,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invitation_batches_practice ON invitation_batches(practice_id);
CREATE INDEX idx_invitation_batches_status ON invitation_batches(status);

COMMENT ON TABLE invitation_batches IS 'Bulk invitation import batches';

-- Link invitations to batches
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES invitation_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_batch ON invitations(batch_id);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_batches ENABLE ROW LEVEL SECURITY;

-- Practice admins can manage invitations
CREATE POLICY "Practice admins can view invitations"
ON invitations FOR SELECT
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() 
    AND permissions->>'can_manage_team' = 'true'
  )
);

CREATE POLICY "Practice admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() 
    AND permissions->>'can_manage_team' = 'true'
  )
);

CREATE POLICY "Practice admins can update invitations"
ON invitations FOR UPDATE
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() 
    AND permissions->>'can_manage_team' = 'true'
  )
);

-- Invitees can view their own invitation (by code)
CREATE POLICY "Users can view own invitation by code"
ON invitations FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invite_code IN (
    SELECT unnest(string_to_array(current_setting('request.headers', true)::json->>'x-invite-code', ','))
  )
);

-- Events are viewable by practice admins
CREATE POLICY "Practice admins can view invitation events"
ON invitation_events FOR SELECT
USING (
  invitation_id IN (
    SELECT id FROM invitations 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
      AND permissions->>'can_manage_team' = 'true'
    )
  )
);

-- Batches are viewable by practice admins
CREATE POLICY "Practice admins can view batches"
ON invitation_batches FOR SELECT
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() 
    AND permissions->>'can_manage_team' = 'true'
  )
);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
    
  -- Log expiry events
  INSERT INTO invitation_events (invitation_id, event_type)
  SELECT id, 'expired'
  FROM invitations
  WHERE status = 'expired'
    AND NOT EXISTS (
      SELECT 1 FROM invitation_events 
      WHERE invitation_id = invitations.id 
      AND event_type = 'expired'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending reminders
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
  invitation_id UUID,
  email VARCHAR,
  name VARCHAR,
  invite_code VARCHAR,
  days_remaining INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.name,
    i.invite_code,
    EXTRACT(day FROM (i.expires_at - NOW()))::INT as days_remaining
  FROM invitations i
  WHERE i.status = 'pending'
    AND i.expires_at > NOW()
    AND (
      -- First reminder at 48h (if not reminded in last 24h)
      (i.expires_at - NOW() < INTERVAL '5 days' AND (i.last_reminded_at IS NULL OR i.last_reminded_at < NOW() - INTERVAL '24 hours'))
      OR
      -- Second reminder at 24h (if not reminded in last 12h)
      (i.expires_at - NOW() < INTERVAL '2 days' AND (i.last_reminded_at IS NULL OR i.last_reminded_at < NOW() - INTERVAL '12 hours'))
    )
  ORDER BY i.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark invitation as accepted
CREATE OR REPLACE FUNCTION accept_invitation(p_invite_code VARCHAR, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
  v_practice_id UUID;
  v_email VARCHAR;
BEGIN
  -- Get invitation details
  SELECT id, practice_id, email
  INTO v_invitation_id, v_practice_id, v_email
  FROM invitations
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_user_id
  WHERE id = v_invitation_id;
  
  -- Log event
  INSERT INTO invitation_events (invitation_id, event_type, event_data)
  VALUES (v_invitation_id, 'accepted', jsonb_build_object('user_id', p_user_id));
  
  -- Create practice member if doesn't exist
  INSERT INTO practice_members (practice_id, user_id, permissions)
  VALUES (v_practice_id, p_user_id, jsonb_build_object('can_view_skills', true, 'can_edit_own', true))
  ON CONFLICT (practice_id, user_id) DO NOTHING;
  
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke invitation
CREATE OR REPLACE FUNCTION revoke_invitation(p_invitation_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE invitations
  SET status = 'revoked'
  WHERE id = p_invitation_id
    AND status = 'pending';
    
  IF FOUND THEN
    INSERT INTO invitation_events (invitation_id, event_type, event_data)
    VALUES (p_invitation_id, 'revoked', jsonb_build_object('revoked_by', p_user_id));
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-create event on invitation creation
CREATE OR REPLACE FUNCTION log_invitation_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invitation_events (invitation_id, event_type, event_data)
  VALUES (NEW.id, 'created', jsonb_build_object(
    'email', NEW.email,
    'name', NEW.name,
    'created_by', NEW.created_by
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitation_created_trigger
AFTER INSERT ON invitations
FOR EACH ROW
EXECUTE FUNCTION log_invitation_created();

-- Update batch counts on invitation status change
CREATE OR REPLACE FUNCTION update_batch_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE invitation_batches
    SET 
      sent_count = (SELECT COUNT(*) FROM invitations WHERE batch_id = NEW.batch_id AND email_sent = true),
      accepted_count = (SELECT COUNT(*) FROM invitations WHERE batch_id = NEW.batch_id AND status = 'accepted'),
      failed_count = (SELECT COUNT(*) FROM invitations WHERE batch_id = NEW.batch_id AND status = 'expired' OR status = 'revoked')
    WHERE id = NEW.batch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_counts_trigger
AFTER UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION update_batch_counts();

-- ============================================
-- 7. INITIAL DATA / SEED
-- ============================================

-- Run expiry check on startup
SELECT expire_old_invitations();

-- ============================================
-- 8. SUMMARY
-- ============================================

SELECT 
  '✅ Full Invitation System Created!' as status,
  (SELECT COUNT(*) FROM invitations) as current_invitations,
  (SELECT COUNT(*) FROM invitation_events) as logged_events,
  (SELECT COUNT(*) FROM invitation_batches) as batches;

COMMENT ON DATABASE postgres IS 'Invitation system includes: tracking, reminders, bulk import, events log, RLS policies';

