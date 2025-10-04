-- Migration: 365 Alignment Programme Enhancements
-- Date: 2025-10-04
-- Description: Add tables for client mapping, notifications, analytics, transcripts, and Calendly integration

-- ============================================================================
-- 1. CLIENT MAPPING TABLE
-- Maps TORSOR practice clients to Oracle Method Portal users
-- ============================================================================
CREATE TABLE IF NOT EXISTS oracle_client_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL, -- TORSOR practice
  torsor_client_id UUID NOT NULL, -- TORSOR client
  oracle_group_id UUID NOT NULL, -- Oracle Method Portal group_id
  client_email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  mapping_status VARCHAR(50) DEFAULT 'active' CHECK (mapping_status IN ('active', 'inactive', 'pending')),
  mapped_by UUID, -- User who created the mapping
  mapped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(torsor_client_id, oracle_group_id)
);

CREATE INDEX idx_oracle_client_mapping_practice ON oracle_client_mapping(practice_id);
CREATE INDEX idx_oracle_client_mapping_torsor_client ON oracle_client_mapping(torsor_client_id);
CREATE INDEX idx_oracle_client_mapping_oracle_group ON oracle_client_mapping(oracle_group_id);

COMMENT ON TABLE oracle_client_mapping IS 'Maps TORSOR clients to Oracle Method Portal users';

-- ============================================================================
-- 2. MILESTONE NOTIFICATIONS TABLE
-- Track and alert on client milestone achievements
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'milestone_completed', 'week_completed', 'sprint_completed', 
    'task_overdue', 'progress_stalled', 'roadmap_updated', 'call_scheduled'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  related_entity_type VARCHAR(50), -- 'task', 'week', 'sprint', 'milestone'
  related_entity_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alignment_notifications_practice ON alignment_notifications(practice_id);
CREATE INDEX idx_alignment_notifications_group ON alignment_notifications(oracle_group_id);
CREATE INDEX idx_alignment_notifications_read ON alignment_notifications(is_read);
CREATE INDEX idx_alignment_notifications_created ON alignment_notifications(created_at DESC);

COMMENT ON TABLE alignment_notifications IS 'Notifications for accountants about client progress milestones';

-- ============================================================================
-- 3. ANALYTICS DATA TABLE
-- Store aggregated analytics for dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Progress metrics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Time metrics
  current_week INTEGER DEFAULT 0,
  weeks_on_track INTEGER DEFAULT 0,
  weeks_behind INTEGER DEFAULT 0,
  average_completion_time_days DECIMAL(5,2),
  
  -- Engagement metrics
  tasks_completed_this_week INTEGER DEFAULT 0,
  notes_added_this_week INTEGER DEFAULT 0,
  calls_this_week INTEGER DEFAULT 0,
  
  -- Trend data
  weekly_velocity DECIMAL(5,2), -- Tasks completed per week
  momentum_score DECIMAL(5,2), -- Acceleration/deceleration
  
  -- Bottleneck detection
  blocked_tasks INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  stalled_weeks INTEGER DEFAULT 0,
  
  -- Prediction
  estimated_completion_date DATE,
  confidence_score DECIMAL(5,2),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(oracle_group_id, analysis_date)
);

CREATE INDEX idx_alignment_analytics_practice ON alignment_analytics(practice_id);
CREATE INDEX idx_alignment_analytics_group ON alignment_analytics(oracle_group_id);
CREATE INDEX idx_alignment_analytics_date ON alignment_analytics(analysis_date DESC);

COMMENT ON TABLE alignment_analytics IS 'Daily analytics snapshots for client progress tracking';

-- ============================================================================
-- 4. CALL TRANSCRIPTS TABLE
-- Store call recordings and transcripts for transparency and learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  call_type VARCHAR(50) NOT NULL CHECK (call_type IN (
    'onboarding', 'weekly_checkin', 'milestone_review', 'problem_solving', 
    'sprint_planning', 'sprint_retrospective', 'ad_hoc'
  )),
  call_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  
  -- Participants
  accountant_name VARCHAR(255),
  accountant_id UUID,
  client_name VARCHAR(255),
  other_participants TEXT[],
  
  -- Content
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  key_points TEXT[],
  action_items JSONB DEFAULT '[]',
  
  -- Categorization for learning module
  topics TEXT[], -- 'financial planning', 'team issues', 'marketing', etc.
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'concerned', 'urgent'
  
  -- Sprint integration
  related_sprint_number INTEGER,
  related_week_number INTEGER,
  tasks_created INTEGER DEFAULT 0,
  tasks_updated INTEGER DEFAULT 0,
  
  -- Privacy
  is_confidential BOOLEAN DEFAULT FALSE,
  retention_date DATE, -- Auto-delete after this date if set
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_transcripts_practice ON alignment_call_transcripts(practice_id);
CREATE INDEX idx_call_transcripts_group ON alignment_call_transcripts(oracle_group_id);
CREATE INDEX idx_call_transcripts_date ON alignment_call_transcripts(call_date DESC);
CREATE INDEX idx_call_transcripts_type ON alignment_call_transcripts(call_type);

COMMENT ON TABLE alignment_call_transcripts IS 'Call recordings and transcripts for transparency and learning';

-- ============================================================================
-- 5. CALENDLY INTEGRATION TABLE
-- Store Calendly links for client booking
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_calendly_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  
  -- Calendly settings
  calendly_link TEXT NOT NULL, -- e.g., https://calendly.com/accountant/30min
  event_type VARCHAR(100), -- '30min', '60min', 'sprint-review', etc.
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Customization
  custom_message TEXT,
  meeting_types JSONB DEFAULT '[]', -- ['Weekly Check-in', 'Problem Solving', 'Sprint Review']
  
  -- Integration
  webhook_url TEXT,
  auto_create_transcript BOOLEAN DEFAULT FALSE,
  auto_add_to_sprint_notes BOOLEAN DEFAULT TRUE,
  
  -- Analytics
  total_bookings INTEGER DEFAULT 0,
  last_booking_date TIMESTAMP WITH TIME ZONE,
  
  configured_by UUID,
  configured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(oracle_group_id)
);

CREATE INDEX idx_calendly_config_practice ON alignment_calendly_config(practice_id);
CREATE INDEX idx_calendly_config_group ON alignment_calendly_config(oracle_group_id);

COMMENT ON TABLE alignment_calendly_config IS 'Calendly integration for client meeting scheduling';

-- ============================================================================
-- 6. BULK ACTIONS LOG
-- Track bulk operations for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_bulk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'bulk_complete', 'bulk_uncomplete', 'bulk_delete', 'bulk_add_notes', 'bulk_assign'
  )),
  performed_by UUID NOT NULL,
  task_ids TEXT[] NOT NULL,
  tasks_affected INTEGER NOT NULL,
  changes_made JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bulk_actions_practice ON alignment_bulk_actions(practice_id);
CREATE INDEX idx_bulk_actions_group ON alignment_bulk_actions(oracle_group_id);
CREATE INDEX idx_bulk_actions_date ON alignment_bulk_actions(created_at DESC);

COMMENT ON TABLE alignment_bulk_actions IS 'Audit log for bulk operations on tasks';

-- ============================================================================
-- 7. EXPORT HISTORY TABLE
-- Track report exports for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS alignment_export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  oracle_group_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('pdf', 'excel', 'csv', 'json')),
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'progress_report', 'analytics_summary', 'task_list', 'transcript_collection', 'full_roadmap'
  )),
  file_url TEXT,
  file_size_bytes INTEGER,
  exported_by UUID NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_export_history_practice ON alignment_export_history(practice_id);
CREATE INDEX idx_export_history_group ON alignment_export_history(oracle_group_id);
CREATE INDEX idx_export_history_date ON alignment_export_history(created_at DESC);

COMMENT ON TABLE alignment_export_history IS 'History of exported reports and downloads';

-- ============================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_oracle_client_mapping_updated_at
    BEFORE UPDATE ON oracle_client_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alignment_analytics_updated_at
    BEFORE UPDATE ON alignment_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_transcripts_updated_at
    BEFORE UPDATE ON alignment_call_transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendly_config_updated_at
    BEFORE UPDATE ON alignment_calendly_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification on milestone completion
-- NOTE: This trigger will be created ONLY if sprint_progress table exists
-- The sprint_progress table should be created by the Oracle Method Portal migrations
DO $$
BEGIN
    -- Check if sprint_progress table exists before creating trigger
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sprint_progress'
    ) THEN
        -- Create the function
        CREATE OR REPLACE FUNCTION create_milestone_notification()
        RETURNS TRIGGER AS $func$
        DECLARE
            client_mapping RECORD;
            week_tasks_total INTEGER;
            week_tasks_completed INTEGER;
        BEGIN
            -- Check if this completion triggers a milestone
            IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
                
                -- Get client mapping
                SELECT * INTO client_mapping 
                FROM oracle_client_mapping 
                WHERE oracle_group_id = NEW.group_id::text::uuid 
                LIMIT 1;
                
                IF client_mapping IS NOT NULL THEN
                    -- Check if week is complete
                    SELECT 
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE completed = TRUE) as completed
                    INTO week_tasks_total, week_tasks_completed
                    FROM sprint_progress 
                    WHERE group_id = NEW.group_id 
                    AND week_number = NEW.week_number;
                    
                    -- If week just completed
                    IF week_tasks_completed = week_tasks_total THEN
                        INSERT INTO alignment_notifications (
                            practice_id, oracle_group_id, notification_type,
                            title, message, priority, related_entity_type, related_entity_id
                        ) VALUES (
                            client_mapping.practice_id,
                            client_mapping.oracle_group_id,
                            'week_completed',
                            'Week ' || NEW.week_number || ' Completed! 🎉',
                            'Your client has completed all tasks for Week ' || NEW.week_number || '. Great progress!',
                            'normal',
                            'week',
                            NEW.week_number::text
                        );
                    END IF;
                END IF;
            END IF;
            
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS trigger_milestone_notification ON sprint_progress;
        
        -- Create the trigger
        CREATE TRIGGER trigger_milestone_notification
            AFTER INSERT OR UPDATE ON sprint_progress
            FOR EACH ROW
            EXECUTE FUNCTION create_milestone_notification();
            
        RAISE NOTICE 'Milestone notification trigger created successfully';
    ELSE
        RAISE NOTICE 'sprint_progress table does not exist yet - skipping trigger creation. Run this migration after Oracle Method Portal setup.';
    END IF;
END $$;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE oracle_client_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_calendly_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_bulk_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_export_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be refined based on auth requirements)
-- For now, allow authenticated users to access their practice data

-- Oracle client mapping
CREATE POLICY "Users can view their practice client mappings"
    ON oracle_client_mapping FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert client mappings"
    ON oracle_client_mapping FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Notifications
CREATE POLICY "Users can view their notifications"
    ON alignment_notifications FOR SELECT
    USING (auth.role() = 'authenticated');

-- Analytics
CREATE POLICY "Users can view analytics"
    ON alignment_analytics FOR SELECT
    USING (auth.role() = 'authenticated');

-- Call transcripts
CREATE POLICY "Users can view their call transcripts"
    ON alignment_call_transcripts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert call transcripts"
    ON alignment_call_transcripts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Calendly config
CREATE POLICY "Users can view their Calendly config"
    ON alignment_calendly_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their Calendly config"
    ON alignment_calendly_config FOR ALL
    USING (auth.role() = 'authenticated');

-- Bulk actions
CREATE POLICY "Users can view bulk actions"
    ON alignment_bulk_actions FOR SELECT
    USING (auth.role() = 'authenticated');

-- Export history
CREATE POLICY "Users can view export history"
    ON alignment_export_history FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- 10. INITIAL DATA / EXAMPLES
-- ============================================================================

-- Example notification types documentation
COMMENT ON COLUMN alignment_notifications.notification_type IS 
'Types: milestone_completed, week_completed, sprint_completed, task_overdue, progress_stalled, roadmap_updated, call_scheduled';

-- Example call types documentation
COMMENT ON COLUMN alignment_call_transcripts.call_type IS 
'Types: onboarding, weekly_checkin, milestone_review, problem_solving, sprint_planning, sprint_retrospective, ad_hoc';

-- Grant necessary permissions
GRANT ALL ON oracle_client_mapping TO authenticated;
GRANT ALL ON alignment_notifications TO authenticated;
GRANT ALL ON alignment_analytics TO authenticated;
GRANT ALL ON alignment_call_transcripts TO authenticated;
GRANT ALL ON alignment_calendly_config TO authenticated;
GRANT ALL ON alignment_bulk_actions TO authenticated;
GRANT ALL ON alignment_export_history TO authenticated;

