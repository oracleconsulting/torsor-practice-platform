-- =============================================================================
-- 365 CLIENT PORTAL SCHEMA
-- =============================================================================
-- 
-- Version: 1.0.0
-- Date: 2025-11-27
-- 
-- DESIGN PRINCIPLES:
-- ✓ Minimal tables (10 vs Oracle Method's 30+)
-- ✓ JSONB for flexible data (no schema migrations for new fields)
-- ✓ Single source of truth (no duplication)
-- ✓ RLS built-in from the start
-- ✓ Proper foreign keys and cascades
-- ✓ Optimized indexes
--
-- WHAT WE ELIMINATED (from Oracle Method Portal):
-- ✗ user_profiles (duplicate of auth.users)
-- ✗ dashboard_setup (embed in client settings)
-- ✗ onboarding_progress (embed in assessment)
-- ✗ validation_sessions (embed in assessment)
-- ✗ sprint_progress (embed in tasks)
-- ✗ sprint_reflections (unnecessary complexity)
-- ✗ subscription_tiers, user_subscriptions (not needed for 365)
-- ✗ partners, partner_services, user_partner_subscriptions (not needed)
-- ✗ kpi_definitions, kpi_values, revenue_sharing (overkill)
-- ✗ cyber_assessments (specific feature, not core)
-- ✗ Separate client_intake, client_intake_part2, client_intake_part3 (unified)
-- ✗ Separate assessment_progress table (embed in assessments)
--
-- =============================================================================


-- =============================================================================
-- EXTENSION SETUP
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- 1. EXTEND PRACTICE_MEMBERS FOR CLIENTS
-- =============================================================================
-- Instead of creating separate client tables, we extend the existing
-- practice_members table to support clients. This keeps team + client
-- management unified.

-- Add client-specific columns to existing practice_members
-- Note: is_active may already exist; we ensure it's present for partial indexes
ALTER TABLE practice_members 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) DEFAULT 'team' 
    CHECK (member_type IN ('team', 'client', 'advisor')),
  ADD COLUMN IF NOT EXISTS client_company TEXT,
  ADD COLUMN IF NOT EXISTS client_industry TEXT,
  ADD COLUMN IF NOT EXISTS client_stage VARCHAR(20)
    CHECK (client_stage IN ('startup', 'growth', 'mature', 'exit-planning')),
  ADD COLUMN IF NOT EXISTS program_enrolled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS program_status VARCHAR(20) DEFAULT 'active'
    CHECK (program_status IN ('invited', 'active', 'paused', 'completed', 'churned')),
  ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID REFERENCES practice_members(id),
  ADD COLUMN IF NOT EXISTS last_portal_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "notifications": {"email_reminders": true, "weekly_digest": true},
    "timezone": "Europe/London",
    "dashboard": {}
  }'::jsonb;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_practice_members_type 
  ON practice_members(practice_id, member_type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_practice_members_clients
  ON practice_members(practice_id, program_status) WHERE member_type = 'client';


-- =============================================================================
-- 2. CLIENT ASSESSMENTS (UNIFIED)
-- =============================================================================
-- Single table for ALL assessment types (Part 1, 2, 3)
-- This replaces: client_intake, client_intake_part2, client_intake_part3

CREATE TABLE client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Assessment type (part1, part2, part3)
  assessment_type VARCHAR(10) NOT NULL CHECK (assessment_type IN ('part1', 'part2', 'part3')),
  
  -- All responses stored as JSONB - flexible, no schema changes needed
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Progress tracking (embedded, not a separate table)
  current_section INTEGER DEFAULT 0,
  total_sections INTEGER DEFAULT 1,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'reviewed')),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES practice_members(id),
  
  -- Analytics
  time_spent_seconds INTEGER DEFAULT 0,
  device_info JSONB,
  
  -- Standard timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One assessment per type per client
  UNIQUE(client_id, assessment_type)
);

-- Indexes
CREATE INDEX idx_assessments_client ON client_assessments(client_id);
CREATE INDEX idx_assessments_practice_status ON client_assessments(practice_id, status);
CREATE INDEX idx_assessments_type ON client_assessments(assessment_type, status);
CREATE INDEX idx_assessments_incomplete ON client_assessments(client_id, status) 
  WHERE status != 'completed';


-- =============================================================================
-- 3. CLIENT ROADMAPS (WITH VERSIONING)
-- =============================================================================
-- Stores LLM-generated roadmaps with full version history

CREATE TABLE client_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Generated content (all in one JSONB)
  roadmap_data JSONB NOT NULL,
  -- Structure: { summary, priorities[], weeks[], successMetrics[] }
  
  -- Additional AI outputs
  fit_assessment JSONB,  -- Part 1 analysis
  value_analysis JSONB,  -- Part 3 analysis
  
  -- Generation metadata
  llm_model TEXT,
  prompt_version TEXT,
  generation_cost_cents INTEGER,  -- Store as cents to avoid float issues
  generation_duration_ms INTEGER,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES client_roadmaps(id),
  superseded_at TIMESTAMP WITH TIME ZONE,
  
  -- Manual edits
  manually_edited BOOLEAN DEFAULT FALSE,
  edited_by UUID REFERENCES practice_members(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  edit_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one active roadmap per client
CREATE UNIQUE INDEX idx_roadmaps_active_unique 
  ON client_roadmaps(client_id) WHERE is_active = TRUE;
CREATE INDEX idx_roadmaps_client ON client_roadmaps(client_id);
CREATE INDEX idx_roadmaps_practice ON client_roadmaps(practice_id);


-- =============================================================================
-- 4. CLIENT TASKS
-- =============================================================================
-- Tasks extracted from roadmaps, with completion tracking

CREATE TABLE client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES client_roadmaps(id) ON DELETE SET NULL,
  
  -- Task details
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 13),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'Financial', 'Operations', 'Team', 'Marketing', 'Product', 'Systems', 'Personal'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  estimated_hours DECIMAL(4,1),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'deferred')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Attachments (stored as references to storage)
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ filename, storage_path, mime_type, size_bytes, uploaded_at }]
  
  -- Scheduling
  due_date DATE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Ordering within week
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_client_week ON client_tasks(client_id, week_number);
CREATE INDEX idx_tasks_status ON client_tasks(client_id, status);
CREATE INDEX idx_tasks_due ON client_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_roadmap ON client_tasks(roadmap_id);


-- =============================================================================
-- 5. CHAT THREADS
-- =============================================================================
-- Simple chat system with threads and messages

CREATE TABLE client_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Thread metadata
  title TEXT,  -- Auto-generated from first message or manual
  thread_type TEXT DEFAULT 'general' 
    CHECK (thread_type IN ('general', 'task_help', 'roadmap_question', 'escalated')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  escalated_to UUID REFERENCES practice_members(id),
  escalated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Context snapshot for AI (captures client state when thread started)
  context_snapshot JSONB,
  
  -- Message count (denormalized for performance)
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_client ON client_chat_threads(client_id, status);
CREATE INDEX idx_chat_threads_practice ON client_chat_threads(practice_id, status);
CREATE INDEX idx_chat_threads_escalated ON client_chat_threads(escalated_to, status) 
  WHERE status = 'escalated';


-- =============================================================================
-- 6. CHAT MESSAGES
-- =============================================================================

CREATE TABLE client_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES client_chat_threads(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'advisor')),
  content TEXT NOT NULL,
  
  -- For AI messages
  llm_model TEXT,
  tokens_used INTEGER,
  generation_cost_cents INTEGER,
  
  -- For advisor messages
  sent_by UUID REFERENCES practice_members(id),
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata (e.g., referenced tasks, flagged for review)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_thread ON client_chat_messages(thread_id, created_at);


-- =============================================================================
-- 7. CLIENT APPOINTMENTS
-- =============================================================================

CREATE TABLE client_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES practice_members(id),
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'Europe/London',
  
  -- Type and status
  appointment_type TEXT DEFAULT 'check_in' 
    CHECK (appointment_type IN ('initial', 'check_in', 'quarterly_review', 'ad_hoc', 'escalation')),
  status TEXT DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  
  -- External integration
  external_id TEXT,  -- Calendly/Cal.com ID
  video_link TEXT,
  
  -- Content
  agenda JSONB,  -- AI-generated or manual
  notes TEXT,  -- Post-meeting notes
  action_items JSONB,  -- Tasks created from meeting
  
  -- Tracking
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_client ON client_appointments(client_id, scheduled_at);
CREATE INDEX idx_appointments_advisor ON client_appointments(advisor_id, scheduled_at);
CREATE INDEX idx_appointments_upcoming ON client_appointments(scheduled_at) 
  WHERE status IN ('scheduled', 'confirmed');


-- =============================================================================
-- 8. ACTIVITY LOG
-- =============================================================================
-- Lightweight activity tracking for engagement analytics

CREATE TABLE client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Activity type enum
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'assessment_started', 'assessment_completed', 'task_completed',
    'chat_message', 'document_viewed', 'appointment_booked', 'roadmap_viewed'
  )),
  
  -- Flexible activity data
  activity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Session info
  session_id UUID,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition-friendly index (for future partitioning by month)
CREATE INDEX idx_activity_client_date ON client_activity_log(client_id, created_at DESC);
CREATE INDEX idx_activity_practice_date ON client_activity_log(practice_id, created_at DESC);
CREATE INDEX idx_activity_type ON client_activity_log(activity_type, created_at DESC);


-- =============================================================================
-- 9. LLM USAGE LOG
-- =============================================================================
-- Track all LLM calls for cost management and debugging

CREATE TABLE llm_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  client_id UUID REFERENCES practice_members(id) ON DELETE SET NULL,
  
  -- Request details
  task_type TEXT NOT NULL CHECK (task_type IN (
    'fit_assessment', 'roadmap_generation', 'value_analysis',
    'chat_completion', 'meeting_agenda', 'task_breakdown', 
    'document_summary', 'quarterly_review', 'pdf_generation'
  )),
  model TEXT NOT NULL,
  prompt_version TEXT,
  
  -- Usage
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_cents INTEGER,  -- Store in cents
  duration_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_practice ON llm_usage_log(practice_id, created_at DESC);
CREATE INDEX idx_llm_usage_task ON llm_usage_log(task_type, created_at DESC);


-- =============================================================================
-- MATERIALIZED VIEW: CLIENT ENGAGEMENT METRICS
-- =============================================================================
-- Pre-computed metrics for dashboard performance
-- Refresh daily via cron job

CREATE MATERIALIZED VIEW client_engagement_summary AS
SELECT 
  pm.id as client_id,
  pm.practice_id,
  pm.name,
  pm.client_company,
  pm.program_status,
  pm.program_enrolled_at,
  pm.last_portal_login,
  
  -- Assessment progress
  (SELECT COUNT(*) FROM client_assessments ca 
   WHERE ca.client_id = pm.id AND ca.status = 'completed') as assessments_completed,
  (SELECT MAX(completed_at) FROM client_assessments ca 
   WHERE ca.client_id = pm.id) as last_assessment_at,
  
  -- Roadmap status
  (SELECT COUNT(*) FROM client_roadmaps cr 
   WHERE cr.client_id = pm.id AND cr.is_active = TRUE) as has_active_roadmap,
  
  -- Task metrics
  (SELECT COUNT(*) FROM client_tasks ct 
   WHERE ct.client_id = pm.id AND ct.status = 'completed') as tasks_completed,
  (SELECT COUNT(*) FROM client_tasks ct 
   WHERE ct.client_id = pm.id AND ct.status = 'pending') as tasks_pending,
  
  -- Activity metrics (last 30 days)
  (SELECT COUNT(*) FROM client_activity_log cal 
   WHERE cal.client_id = pm.id 
   AND cal.created_at > NOW() - INTERVAL '30 days') as activities_30d,
  (SELECT COUNT(*) FROM client_activity_log cal 
   WHERE cal.client_id = pm.id 
   AND cal.activity_type = 'login'
   AND cal.created_at > NOW() - INTERVAL '30 days') as logins_30d,
  
  -- Engagement score (simple algorithm)
  CASE 
    WHEN pm.last_portal_login IS NULL THEN 0
    WHEN pm.last_portal_login > NOW() - INTERVAL '7 days' THEN 100
    WHEN pm.last_portal_login > NOW() - INTERVAL '14 days' THEN 75
    WHEN pm.last_portal_login > NOW() - INTERVAL '30 days' THEN 50
    ELSE 25
  END as engagement_score,
  
  NOW() as computed_at

FROM practice_members pm
WHERE pm.member_type = 'client' AND pm.is_active = TRUE;

CREATE UNIQUE INDEX idx_engagement_summary_client 
  ON client_engagement_summary(client_id);
CREATE INDEX idx_engagement_summary_practice 
  ON client_engagement_summary(practice_id, engagement_score DESC);


-- =============================================================================
-- TRIGGERS: AUTO-UPDATE TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON client_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON client_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON client_chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON client_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- TRIGGERS: CHAT MESSAGE COUNT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_chat_threads
  SET 
    message_count = message_count + 1,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_message_count
  AFTER INSERT ON client_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_message_count();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_log ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- RLS POLICIES: CLIENTS SEE OWN DATA
-- =============================================================================

-- Helper function to check if user is a client
CREATE OR REPLACE FUNCTION is_client_member(check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM practice_members 
    WHERE id = check_client_id 
    AND user_id = auth.uid()
    AND member_type = 'client'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is team member of practice
CREATE OR REPLACE FUNCTION is_team_member_of_practice(check_practice_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM practice_members 
    WHERE practice_id = check_practice_id 
    AND user_id = auth.uid()
    AND member_type = 'team'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clients see own assessments
CREATE POLICY "clients_own_assessments" ON client_assessments
  FOR ALL USING (is_client_member(client_id));

-- Team sees practice assessments  
CREATE POLICY "team_practice_assessments" ON client_assessments
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- Clients see own roadmaps
CREATE POLICY "clients_own_roadmaps" ON client_roadmaps
  FOR ALL USING (is_client_member(client_id));

-- Team sees practice roadmaps
CREATE POLICY "team_practice_roadmaps" ON client_roadmaps
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- Clients see own tasks
CREATE POLICY "clients_own_tasks" ON client_tasks
  FOR ALL USING (is_client_member(client_id));

-- Team sees practice tasks
CREATE POLICY "team_practice_tasks" ON client_tasks
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- Clients see own chat threads
CREATE POLICY "clients_own_threads" ON client_chat_threads
  FOR ALL USING (is_client_member(client_id));

-- Team sees practice chat threads
CREATE POLICY "team_practice_threads" ON client_chat_threads
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- Chat messages inherit from threads
CREATE POLICY "clients_thread_messages" ON client_chat_messages
  FOR ALL USING (
    thread_id IN (SELECT id FROM client_chat_threads WHERE is_client_member(client_id))
  );

CREATE POLICY "team_thread_messages" ON client_chat_messages
  FOR ALL USING (
    thread_id IN (SELECT id FROM client_chat_threads WHERE is_team_member_of_practice(practice_id))
  );

-- Clients see own appointments
CREATE POLICY "clients_own_appointments" ON client_appointments
  FOR ALL USING (is_client_member(client_id));

-- Team sees practice appointments
CREATE POLICY "team_practice_appointments" ON client_appointments
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- Activity log: clients see own, team sees practice
CREATE POLICY "clients_own_activity" ON client_activity_log
  FOR SELECT USING (is_client_member(client_id));

CREATE POLICY "team_practice_activity" ON client_activity_log
  FOR ALL USING (is_team_member_of_practice(practice_id));

-- LLM usage: team only
CREATE POLICY "team_llm_usage" ON llm_usage_log
  FOR SELECT USING (is_team_member_of_practice(practice_id));


-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE client_assessments IS 'Unified assessment storage for Part 1, 2, 3. Replaces client_intake, client_intake_part2, client_intake_part3';
COMMENT ON TABLE client_roadmaps IS 'LLM-generated roadmaps with version history';
COMMENT ON TABLE client_tasks IS 'Tasks extracted from roadmaps, with completion tracking';
COMMENT ON TABLE client_chat_threads IS 'AI chat threads with escalation support';
COMMENT ON TABLE client_chat_messages IS 'Individual messages within threads';
COMMENT ON TABLE client_appointments IS 'Scheduled meetings with clients';
COMMENT ON TABLE client_activity_log IS 'Lightweight engagement tracking';
COMMENT ON TABLE llm_usage_log IS 'LLM cost and usage tracking';

COMMENT ON MATERIALIZED VIEW client_engagement_summary IS 
  'Pre-computed client metrics. Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY client_engagement_summary;';


-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_versions (version, description) VALUES 
  ('1.0.0', '365 Client Portal - Initial clean schema');


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

