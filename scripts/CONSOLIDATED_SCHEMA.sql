-- ============================================================================
-- TORSOR PLATFORM - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Date: December 3, 2025
-- 
-- This file represents the complete database schema for the Torsor platform.
-- Run this on a fresh database, or use individual migration scripts for updates.
--
-- Migration files consolidated:
-- - add-assessment-questions-table.sql
-- - add-audit-logging.sql  
-- - add-client-context-table.sql
-- - add-delivery-management.sql
-- - add-destination-discovery-framework.sql
-- - add-document-embeddings.sql
-- - add-extracted-metrics.sql
-- - add-hidden-value-audit-shared.sql
-- - add-knowledge-base.sql
-- - add-llm-caching.sql
-- - add-performance-indexes.sql
-- - add-phase-activities.sql
-- - add-service-lines-schema.sql
-- - add-service-workflow-tiers.sql
-- - add-shared-documents-support.sql
-- - add-skip-value-analysis.sql
-- ============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: pgvector must be enabled in Supabase Dashboard > Database > Extensions
-- CREATE EXTENSION IF NOT EXISTS "pgvector";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Practices (accounting firms)
CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Practice members (team + clients)
CREATE TABLE IF NOT EXISTS practice_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  role text,
  member_type text DEFAULT 'team' CHECK (member_type IN ('team', 'client')),
  program_status text DEFAULT 'active',
  skip_value_analysis boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CLIENT ASSESSMENT TABLES
-- =============================================================================

-- Client assessments (Parts 1, 2, 3)
CREATE TABLE IF NOT EXISTS client_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('part1', 'part2', 'part3')),
  responses jsonb NOT NULL DEFAULT '{}',
  completion_percentage int DEFAULT 0,
  fit_profile jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client roadmaps (generated analysis)
CREATE TABLE IF NOT EXISTS client_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  roadmap_data jsonb NOT NULL DEFAULT '{}',
  value_analysis jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client context (advisor notes, documents)
CREATE TABLE IF NOT EXISTS client_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  context_type text NOT NULL CHECK (context_type IN ('note', 'priority', 'transcript', 'document')),
  content text,
  file_url text,
  priority_level int DEFAULT 50,
  applies_to text[] DEFAULT '{}',
  is_shared boolean DEFAULT false,
  data_source_type text,
  shared_with_clients uuid[],
  processed boolean DEFAULT false,
  vectorized boolean DEFAULT false,
  extracted_metrics jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Document embeddings (for RAG)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid REFERENCES client_context(id) ON DELETE CASCADE,
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- SERVICE LINE TABLES
-- =============================================================================

-- Service lines
CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT true,
  requires_discovery boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Client service line enrollments
CREATE TABLE IF NOT EXISTS client_service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  hidden_value_audit_unlocked_at timestamptz,
  hidden_value_audit_completed_at timestamptz,
  UNIQUE(client_id, service_line_id)
);

-- Service line assessments
CREATE TABLE IF NOT EXISTS service_line_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  value_proposition jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Client invitations
CREATE TABLE IF NOT EXISTS client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  company text,
  service_line_ids uuid[] DEFAULT '{}',
  include_discovery boolean DEFAULT true,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- ASSESSMENT QUESTIONS (Editable)
-- =============================================================================

CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_code text NOT NULL,
  section text NOT NULL,
  question_key text NOT NULL,
  question_text text NOT NULL,
  question_type text DEFAULT 'text',
  options jsonb,
  display_order int DEFAULT 0,
  is_required boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_line_code, section, question_key)
);

CREATE TABLE IF NOT EXISTS assessment_question_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE,
  old_text text,
  new_text text,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now()
);

-- =============================================================================
-- DELIVERY MANAGEMENT TABLES
-- =============================================================================

-- Service deliverables
CREATE TABLE IF NOT EXISTS service_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text,
  estimated_hours numeric(5,2),
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Service roles
CREATE TABLE IF NOT EXISTS service_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_lead boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service role skills
CREATE TABLE IF NOT EXISTS service_role_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES service_roles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  min_level int DEFAULT 3,
  is_essential boolean DEFAULT true,
  UNIQUE(role_id, skill_name)
);

-- Delivery teams
CREATE TABLE IF NOT EXISTS delivery_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Team member assignments
CREATE TABLE IF NOT EXISTS team_member_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES delivery_teams(id) ON DELETE CASCADE,
  member_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
  role_id uuid REFERENCES service_roles(id),
  allocation_percentage int DEFAULT 100,
  is_lead boolean DEFAULT false,
  UNIQUE(team_id, member_id)
);

-- Service workflow phases
CREATE TABLE IF NOT EXISTS service_workflow_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  phase_order int NOT NULL,
  estimated_hours numeric(5,2),
  is_recurring boolean DEFAULT false,
  frequency text,
  created_at timestamptz DEFAULT now()
);

-- Service phase activities
CREATE TABLE IF NOT EXISTS service_phase_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES service_workflow_phases(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  activity_order int DEFAULT 0,
  estimated_minutes int,
  created_at timestamptz DEFAULT now()
);

-- Service activity skills
CREATE TABLE IF NOT EXISTS service_activity_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES service_phase_activities(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  min_level int DEFAULT 3,
  UNIQUE(activity_id, skill_name)
);

-- =============================================================================
-- KNOWLEDGE BASE TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  embedding vector(1536),
  usage_count int DEFAULT 0,
  is_approved boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  original_output text NOT NULL,
  corrected_output text NOT NULL,
  correction_type text,
  context jsonb,
  applied_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- LLM CACHING TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS llm_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  model text NOT NULL,
  response jsonb NOT NULL,
  tokens_used int,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  hit_count int DEFAULT 0,
  last_hit_at timestamptz
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 0,
  window_start bigint DEFAULT extract(epoch from now()) * 1000,
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- AUDIT LOG (Partitioned)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid(),
  practice_id uuid,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE IF NOT EXISTS audit_log_2024_12 PARTITION OF audit_log FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_01 PARTITION OF audit_log FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_02 PARTITION OF audit_log FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_03 PARTITION OF audit_log FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_04 PARTITION OF audit_log FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_05 PARTITION OF audit_log FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS audit_log_2025_06 PARTITION OF audit_log FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_members_practice ON practice_members(practice_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON practice_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_type ON practice_members(member_type);
CREATE INDEX IF NOT EXISTS idx_assessments_client ON client_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_assessments_practice ON client_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_client ON client_roadmaps(client_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_practice ON client_roadmaps(practice_id);
CREATE INDEX IF NOT EXISTS idx_context_client ON client_context(client_id);
CREATE INDEX IF NOT EXISTS idx_context_practice ON client_context(practice_id);
CREATE INDEX IF NOT EXISTS idx_cache_hash ON llm_response_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON llm_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_practice ON audit_log(practice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Team can see their practice data
CREATE POLICY "Team sees practice" ON practices FOR SELECT USING (
  id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team sees members" ON practice_members FOR ALL USING (
  practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team')
);

CREATE POLICY "Team sees assessments" ON client_assessments FOR ALL USING (
  practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team')
);

CREATE POLICY "Client sees own assessments" ON client_assessments FOR SELECT USING (
  client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
);

CREATE POLICY "Team sees roadmaps" ON client_roadmaps FOR ALL USING (
  practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team')
);

CREATE POLICY "Client sees own roadmap" ON client_roadmaps FOR SELECT USING (
  client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
);

CREATE POLICY "Service lines public read" ON service_lines FOR SELECT USING (true);

CREATE POLICY "Assessment questions public read" ON assessment_questions FOR SELECT USING (is_active = true);

CREATE POLICY "Service role cache" ON llm_response_cache FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Team sees audit log" ON audit_log FOR SELECT USING (
  practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'team')
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM llm_response_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_key text, p_max_requests int, p_window_seconds int) 
RETURNS boolean AS $$
DECLARE
  v_current record;
  v_now bigint := extract(epoch from now()) * 1000;
  v_window_start bigint;
BEGIN
  SELECT * INTO v_current FROM rate_limits WHERE key = p_key;
  v_window_start := v_now - (p_window_seconds * 1000);
  
  IF v_current IS NULL OR v_current.window_start < v_window_start THEN
    INSERT INTO rate_limits (key, count, window_start) VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = v_now;
    RETURN true;
  END IF;
  
  IF v_current.count >= p_max_requests THEN RETURN false; END IF;
  
  UPDATE rate_limits SET count = count + 1, updated_at = now() WHERE key = p_key;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Search document chunks (RAG)
CREATE OR REPLACE FUNCTION search_document_chunks(
  p_query_embedding vector(1536),
  p_client_id uuid,
  p_limit int DEFAULT 5
) RETURNS TABLE (chunk_text text, similarity float) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.chunk_text,
    1 - (de.embedding <=> p_query_embedding) as similarity
  FROM document_embeddings de
  WHERE de.client_id = p_client_id
  ORDER BY de.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS trigger AS $$
DECLARE
  v_practice_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    v_practice_id := OLD.practice_id;
  ELSE
    v_practice_id := NEW.practice_id;
  END IF;

  INSERT INTO audit_log (practice_id, user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (
    v_practice_id,
    v_user_id,
    LOWER(TG_OP),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_practice_members AFTER INSERT OR UPDATE OR DELETE ON practice_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_client_assessments AFTER INSERT OR UPDATE OR DELETE ON client_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_client_roadmaps AFTER INSERT OR UPDATE OR DELETE ON client_roadmaps
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- =============================================================================
-- SEED DATA: Service Lines
-- =============================================================================

INSERT INTO service_lines (code, name, description, category, requires_discovery) VALUES
  ('365_alignment', '365 Alignment Program', 'Comprehensive business transformation', 'Advisory', false),
  ('management_accounts', 'Management Accounts', 'Monthly financial reporting', 'Compliance', false),
  ('systems_audit', 'Systems Audit', 'Tech stack optimization', 'Technology', false),
  ('fractional_exec', 'Fractional CFO/COO', 'Strategic executive support', 'Advisory', false),
  ('hidden_value_audit', 'Hidden Value Audit', 'Business value discovery', 'Advisory', false),
  ('tax_planning', 'Proactive Tax Planning', 'Tax optimization strategies', 'Compliance', false),
  ('group_structure', 'Group Structure Review', 'Corporate restructuring', 'Advisory', false),
  ('exit_planning', 'Exit Strategy Planning', 'Business sale preparation', 'Advisory', false),
  ('growth_funding', 'Growth & Funding Support', 'Investment and scaling', 'Advisory', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- END OF CONSOLIDATED SCHEMA
-- ============================================================================

