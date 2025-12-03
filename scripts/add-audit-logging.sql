-- ============================================================================
-- AUDIT LOGGING - P1 Priority (SOC 2 Readiness)
-- ============================================================================
-- Critical for enterprise customers and compliance
-- From: December 3, 2025 Architecture Assessment
-- ============================================================================

-- Create audit log table (partitioned by month for performance)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid(),
  practice_id uuid,
  user_id uuid,
  user_email text,
  action text NOT NULL,           -- 'create', 'update', 'delete', 'view', 'login', 'logout'
  resource_type text NOT NULL,    -- Table name or resource type
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE IF NOT EXISTS audit_log_2024_12 PARTITION OF audit_log
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_01 PARTITION OF audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_02 PARTITION OF audit_log
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_03 PARTITION OF audit_log
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_practice ON audit_log(practice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, created_at DESC);

-- RLS: Team members can view their practice's audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team sees practice audit log" ON audit_log;
CREATE POLICY "Team sees practice audit log" ON audit_log
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Audit trigger function
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS trigger AS $$
DECLARE
  v_practice_id uuid;
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- Get user info
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email 
  FROM auth.users WHERE id = v_user_id;
  
  -- Get practice_id from the record if available
  IF TG_OP = 'DELETE' THEN
    v_practice_id := CASE 
      WHEN TG_TABLE_NAME = 'practice_members' THEN OLD.practice_id
      WHEN TG_TABLE_NAME = 'client_assessments' THEN OLD.practice_id
      WHEN TG_TABLE_NAME = 'client_roadmaps' THEN OLD.practice_id
      ELSE NULL
    END;
  ELSE
    v_practice_id := CASE 
      WHEN TG_TABLE_NAME = 'practice_members' THEN NEW.practice_id
      WHEN TG_TABLE_NAME = 'client_assessments' THEN NEW.practice_id
      WHEN TG_TABLE_NAME = 'client_roadmaps' THEN NEW.practice_id
      ELSE NULL
    END;
  END IF;

  INSERT INTO audit_log (
    practice_id,
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    v_practice_id,
    v_user_id,
    v_user_email,
    LOWER(TG_OP),
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_practice_members ON practice_members;
CREATE TRIGGER audit_practice_members
  AFTER INSERT OR UPDATE OR DELETE ON practice_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_client_assessments ON client_assessments;
CREATE TRIGGER audit_client_assessments
  AFTER INSERT OR UPDATE OR DELETE ON client_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_client_roadmaps ON client_roadmaps;
CREATE TRIGGER audit_client_roadmaps
  AFTER INSERT OR UPDATE OR DELETE ON client_roadmaps
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_client_context ON client_context;
CREATE TRIGGER audit_client_context
  AFTER INSERT OR UPDATE OR DELETE ON client_context
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_assessment_questions ON assessment_questions;
CREATE TRIGGER audit_assessment_questions
  AFTER INSERT OR UPDATE OR DELETE ON assessment_questions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to log custom events (for Edge Functions)
CREATE OR REPLACE FUNCTION log_custom_audit(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_details jsonb DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_practice_id uuid;
BEGIN
  -- Get practice_id from user's membership
  SELECT practice_id INTO v_practice_id
  FROM practice_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  INSERT INTO audit_log (
    practice_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    v_practice_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit summary view
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  practice_id,
  DATE(created_at) as date,
  action,
  resource_type,
  COUNT(*) as event_count
FROM audit_log
WHERE created_at > now() - interval '30 days'
GROUP BY practice_id, DATE(created_at), action, resource_type
ORDER BY date DESC, event_count DESC;

-- Function to auto-create future partitions (run monthly via cron)
CREATE OR REPLACE FUNCTION create_audit_partition() RETURNS void AS $$
DECLARE
  next_month date := date_trunc('month', now()) + interval '1 month';
  partition_name text := 'audit_log_' || to_char(next_month, 'YYYY_MM');
  end_date date := next_month + interval '1 month';
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month,
    end_date
  );
END;
$$ LANGUAGE plpgsql;

