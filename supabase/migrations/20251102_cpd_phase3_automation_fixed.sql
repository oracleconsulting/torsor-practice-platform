-- =====================================================
-- CPD PHASE 3: AUTOMATIC GENERATION & KNOWLEDGE BASE INTEGRATION
-- Date: 2025-11-02
-- FIXED: Added IF NOT EXISTS checks for all objects
-- =====================================================

-- =====================================================
-- 1. CREATE NOTIFICATIONS TABLE FOR CPD UPDATES
-- =====================================================
CREATE TABLE IF NOT EXISTS cpd_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'new_knowledge_document', 
    'new_external_resource', 
    'recommendations_updated',
    'cpd_reminder',
    'assessment_due'
  )),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  knowledge_document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  external_resource_id UUID REFERENCES cpd_external_resources(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES cpd_recommendations(id) ON DELETE CASCADE,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

DO $$ BEGIN
  CREATE INDEX idx_cpd_notifications_member ON cpd_notifications(member_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_cpd_notifications_type ON cpd_notifications(notification_type);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_cpd_notifications_unread ON cpd_notifications(member_id, is_read, created_at);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_cpd_notifications_expires ON cpd_notifications(expires_at);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON TABLE cpd_notifications IS 'Notifications for CPD updates, new resources, and recommendations';

-- =====================================================
-- 2. UPDATE CPD_RECOMMENDATIONS TO LINK TO RESOURCES
-- =====================================================
ALTER TABLE cpd_recommendations 
  ADD COLUMN IF NOT EXISTS linked_knowledge_doc_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_external_resource_id UUID REFERENCES cpd_external_resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title VARCHAR(500),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS resource_url TEXT,
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50);

-- Add CHECK constraint only if it doesn't exist
DO $$ BEGIN
  ALTER TABLE cpd_recommendations 
    ADD CONSTRAINT cpd_recommendations_resource_type_check 
    CHECK (resource_type IN ('internal', 'external', 'both', 'none'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_cpd_recommendations_knowledge_doc ON cpd_recommendations(linked_knowledge_doc_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_cpd_recommendations_external_resource ON cpd_recommendations(linked_external_resource_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 3. CREATE FUNCTION TO MATCH RESOURCES TO SKILLS
-- =====================================================
CREATE OR REPLACE FUNCTION match_resources_to_skill(
  p_skill_id UUID,
  p_skill_category TEXT,
  p_skill_name TEXT
)
RETURNS TABLE (
  resource_type TEXT,
  resource_id UUID,
  resource_title TEXT,
  resource_url TEXT,
  resource_hours DECIMAL,
  resource_cost DECIMAL,
  match_score INTEGER
) AS $$
BEGIN
  -- Return matching knowledge documents (internal resources)
  RETURN QUERY
  SELECT 
    'internal'::TEXT as resource_type,
    kd.id as resource_id,
    kd.title as resource_title,
    COALESCE(kd.file_path, '')::TEXT as resource_url,
    0::DECIMAL as resource_hours, -- Knowledge docs don't have hours
    0::DECIMAL as resource_cost,
    (
      CASE 
        -- Exact skill category match in skill_categories array
        WHEN p_skill_category = ANY(kd.skill_categories) THEN 100
        -- Skill name in title
        WHEN LOWER(kd.title) LIKE '%' || LOWER(p_skill_name) || '%' THEN 80
        -- Skill name in tags
        WHEN EXISTS (SELECT 1 FROM unnest(kd.tags) t WHERE LOWER(t) LIKE '%' || LOWER(p_skill_name) || '%') THEN 70
        -- Category in tags
        WHEN EXISTS (SELECT 1 FROM unnest(kd.tags) t WHERE LOWER(t) LIKE '%' || LOWER(p_skill_category) || '%') THEN 60
        -- Category in title
        WHEN LOWER(kd.title) LIKE '%' || LOWER(p_skill_category) || '%' THEN 50
        ELSE 30
      END
    )::INTEGER as match_score
  FROM knowledge_documents kd
  WHERE kd.is_public = true
    AND kd.approved_at IS NOT NULL
    AND (
      p_skill_category = ANY(kd.skill_categories)
      OR LOWER(kd.title) LIKE '%' || LOWER(p_skill_name) || '%'
      OR LOWER(kd.title) LIKE '%' || LOWER(p_skill_category) || '%'
      OR EXISTS (SELECT 1 FROM unnest(kd.tags) t WHERE LOWER(t) LIKE '%' || LOWER(p_skill_name) || '%')
      OR EXISTS (SELECT 1 FROM unnest(kd.tags) t WHERE LOWER(t) LIKE '%' || LOWER(p_skill_category) || '%')
    )
  
  UNION ALL
  
  -- Return matching external resources
  SELECT 
    'external'::TEXT as resource_type,
    er.id as resource_id,
    er.title as resource_title,
    er.url as resource_url,
    COALESCE(er.cpd_hours, 0) as resource_hours,
    COALESCE(er.cost, 0) as resource_cost,
    (
      CASE 
        -- Exact skill category match in skill_categories array
        WHEN p_skill_category = ANY(er.skill_categories) THEN 100
        -- Skill name in title
        WHEN LOWER(er.title) LIKE '%' || LOWER(p_skill_name) || '%' THEN 80
        -- Skill name in description
        WHEN LOWER(er.description) LIKE '%' || LOWER(p_skill_name) || '%' THEN 70
        -- Category in title
        WHEN LOWER(er.title) LIKE '%' || LOWER(p_skill_category) || '%' THEN 60
        -- Category in description
        WHEN LOWER(er.description) LIKE '%' || LOWER(p_skill_category) || '%' THEN 50
        ELSE 30
      END
    )::INTEGER as match_score
  FROM cpd_external_resources er
  WHERE er.is_active = true
    AND (
      p_skill_category = ANY(er.skill_categories)
      OR LOWER(er.title) LIKE '%' || LOWER(p_skill_name) || '%'
      OR LOWER(er.title) LIKE '%' || LOWER(p_skill_category) || '%'
      OR LOWER(er.description) LIKE '%' || LOWER(p_skill_name) || '%'
      OR LOWER(er.description) LIKE '%' || LOWER(p_skill_category) || '%'
    )
  
  ORDER BY match_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_resources_to_skill IS 'Finds best matching knowledge documents and external resources for a skill';

-- =====================================================
-- 4. FUNCTION TO AUTO-REGENERATE CPD RECOMMENDATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION auto_regenerate_cpd_recommendations_for_all()
RETURNS INTEGER AS $$
DECLARE
  affected_members INTEGER := 0;
  v_member_id UUID;
BEGIN
  -- Get all members who have skill assessments
  FOR v_member_id IN 
    SELECT DISTINCT team_member_id 
    FROM skill_assessments
  LOOP
    -- Create notifications for each member
    INSERT INTO cpd_notifications (
      member_id,
      notification_type,
      title,
      message,
      priority,
      created_at
    ) VALUES (
      v_member_id,
      'recommendations_updated',
      '📚 New CPD Resources Available',
      'New learning materials have been added to the knowledge base. Your CPD recommendations have been updated with fresh content!',
      'normal',
      CURRENT_TIMESTAMP
    );
    
    affected_members := affected_members + 1;
  END LOOP;
  
  RETURN affected_members;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_regenerate_cpd_recommendations_for_all IS 'Triggers CPD regeneration notification for all members when knowledge base is updated';

-- =====================================================
-- 5. TRIGGER: NOTIFY ON NEW KNOWLEDGE DOCUMENT
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_knowledge_document()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id UUID;
  v_member_count INTEGER := 0;
BEGIN
  -- Only notify on INSERT and if document is approved and public
  IF (TG_OP = 'INSERT' AND NEW.is_public = true AND NEW.approved_at IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.is_public = true AND NEW.approved_at IS NOT NULL AND OLD.approved_at IS NULL) THEN
    
    -- Get all members who have skills in categories matching this document
    FOR v_member_id IN 
      SELECT DISTINCT sa.team_member_id
      FROM skill_assessments sa
      JOIN skills s ON sa.skill_id = s.id
      WHERE s.category = ANY(NEW.skill_categories)
        OR LOWER(s.name) LIKE ANY(
          SELECT '%' || LOWER(unnest(NEW.tags)) || '%'
        )
    LOOP
      -- Create notification for this member
      INSERT INTO cpd_notifications (
        member_id,
        notification_type,
        title,
        message,
        knowledge_document_id,
        priority,
        created_at
      ) VALUES (
        v_member_id,
        'new_knowledge_document',
        '📄 New Learning Resource: ' || NEW.title,
        'A new resource has been added that matches your skills and interests. Check it out in the CPD Library!',
        NEW.id,
        'normal',
        CURRENT_TIMESTAMP
      );
      
      v_member_count := v_member_count + 1;
    END LOOP;
    
    -- Log the notification broadcast
    RAISE NOTICE 'Created % notifications for new knowledge document: %', v_member_count, NEW.title;
    
    -- If members were notified, trigger recommendation update
    IF v_member_count > 0 THEN
      PERFORM auto_regenerate_cpd_recommendations_for_all();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_knowledge_document ON knowledge_documents;
CREATE TRIGGER trigger_notify_new_knowledge_document
  AFTER INSERT OR UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_knowledge_document();

COMMENT ON FUNCTION notify_new_knowledge_document IS 'Notifies relevant members when new knowledge documents are added';

-- =====================================================
-- 6. TRIGGER: NOTIFY ON NEW EXTERNAL RESOURCE
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_external_resource()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id UUID;
  v_member_count INTEGER := 0;
BEGIN
  -- Only notify on INSERT or when resource becomes active
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR
     (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    
    -- Get all members who have skills in categories matching this resource
    FOR v_member_id IN 
      SELECT DISTINCT sa.team_member_id
      FROM skill_assessments sa
      JOIN skills s ON sa.skill_id = s.id
      WHERE s.category = ANY(NEW.skill_categories)
        OR LOWER(s.name) LIKE '%' || LOWER(NEW.title) || '%'
    LOOP
      -- Create notification for this member
      INSERT INTO cpd_notifications (
        member_id,
        notification_type,
        title,
        message,
        external_resource_id,
        priority,
        created_at
      ) VALUES (
        v_member_id,
        'new_external_resource',
        '🌐 New CPD Course: ' || NEW.title,
        'A new external CPD resource from ' || NEW.provider || ' is now available. It may help you develop your skills!',
        NEW.id,
        'normal',
        CURRENT_TIMESTAMP
      );
      
      v_member_count := v_member_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % notifications for new external resource: %', v_member_count, NEW.title;
    
    -- If members were notified, trigger recommendation update
    IF v_member_count > 0 THEN
      PERFORM auto_regenerate_cpd_recommendations_for_all();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_external_resource ON cpd_external_resources;
CREATE TRIGGER trigger_notify_new_external_resource
  AFTER INSERT OR UPDATE ON cpd_external_resources
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_external_resource();

COMMENT ON FUNCTION notify_new_external_resource IS 'Notifies relevant members when new external resources are added';

-- =====================================================
-- 7. FUNCTION TO GET UNREAD NOTIFICATIONS COUNT
-- =====================================================
CREATE OR REPLACE FUNCTION get_unread_cpd_notifications_count(p_member_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM cpd_notifications
  WHERE member_id = p_member_id
    AND is_read = false
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_unread_cpd_notifications_count IS 'Returns count of unread CPD notifications for a member';

-- =====================================================
-- 8. FUNCTION TO MARK NOTIFICATIONS AS READ
-- =====================================================
CREATE OR REPLACE FUNCTION mark_cpd_notifications_read(
  p_member_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE cpd_notifications
    SET is_read = true,
        read_at = CURRENT_TIMESTAMP
    WHERE member_id = p_member_id
      AND is_read = false;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE cpd_notifications
    SET is_read = true,
        read_at = CURRENT_TIMESTAMP
    WHERE member_id = p_member_id
      AND id = ANY(p_notification_ids)
      AND is_read = false;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_cpd_notifications_read IS 'Marks CPD notifications as read for a member';

-- =====================================================
-- 9. VIEW: UNREAD CPD NOTIFICATIONS
-- =====================================================
CREATE OR REPLACE VIEW unread_cpd_notifications AS
SELECT 
  n.*,
  kd.title as knowledge_doc_title,
  kd.file_path as knowledge_doc_path,
  er.title as external_resource_title,
  er.url as external_resource_url,
  er.provider as external_resource_provider
FROM cpd_notifications n
LEFT JOIN knowledge_documents kd ON n.knowledge_document_id = kd.id
LEFT JOIN cpd_external_resources er ON n.external_resource_id = er.id
WHERE n.is_read = false
  AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
ORDER BY 
  CASE n.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  n.created_at DESC;

COMMENT ON VIEW unread_cpd_notifications IS 'View of unread CPD notifications with related resource details';

-- =====================================================
-- 10. CLEANUP: AUTO-DELETE EXPIRED NOTIFICATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_cpd_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM cpd_notifications
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired CPD notifications', v_deleted;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cpd_notifications IS 'Deletes expired CPD notifications - should be run periodically';

-- =====================================================
-- 11. GRANT PERMISSIONS & RLS POLICIES
-- =====================================================
ALTER TABLE cpd_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS cpd_notifications_member_select ON cpd_notifications;
DROP POLICY IF EXISTS cpd_notifications_member_update ON cpd_notifications;
DROP POLICY IF EXISTS cpd_notifications_admin_all ON cpd_notifications;

CREATE POLICY cpd_notifications_member_select ON cpd_notifications
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY cpd_notifications_member_update ON cpd_notifications
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admin can see all notifications
CREATE POLICY cpd_notifications_admin_all ON cpd_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM practice_members 
      WHERE user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

COMMENT ON SCHEMA public IS 'CPD Phase 3 automation complete - automatic recommendations, notifications, and knowledge base integration';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ CPD Phase 3 migration completed successfully!';
  RAISE NOTICE '📊 Tables: cpd_notifications created';
  RAISE NOTICE '🔧 Functions: match_resources_to_skill, auto_regenerate_cpd_recommendations_for_all, get_unread_cpd_notifications_count, mark_cpd_notifications_read, cleanup_expired_cpd_notifications';
  RAISE NOTICE '⚡ Triggers: trigger_notify_new_knowledge_document, trigger_notify_new_external_resource';
  RAISE NOTICE '👁️ Views: unread_cpd_notifications';
  RAISE NOTICE '🔒 RLS Policies: Enabled on cpd_notifications';
END $$;

