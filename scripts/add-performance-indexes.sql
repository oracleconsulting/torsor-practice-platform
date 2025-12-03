-- ============================================================================
-- PERFORMANCE INDEXES - P0 Priority
-- ============================================================================
-- Run immediately for 30-50% query performance improvement
-- From: December 3, 2025 Architecture Assessment
-- ============================================================================

-- Skill assessments - most frequently queried
CREATE INDEX IF NOT EXISTS idx_skill_assessments_member 
  ON skill_assessments(member_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill 
  ON skill_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_composite 
  ON skill_assessments(member_id, skill_id, current_level);

-- Practice members - team queries
CREATE INDEX IF NOT EXISTS idx_practice_members_practice_type 
  ON practice_members(practice_id, member_type);
CREATE INDEX IF NOT EXISTS idx_practice_members_user 
  ON practice_members(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_email 
  ON practice_members(email);

-- Client assessments - frequent filtering
CREATE INDEX IF NOT EXISTS idx_client_assessments_client 
  ON client_assessments(client_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_client_assessments_practice 
  ON client_assessments(practice_id, status);
CREATE INDEX IF NOT EXISTS idx_client_assessments_status 
  ON client_assessments(status) WHERE status != 'completed';

-- Client roadmaps - active lookup
CREATE INDEX IF NOT EXISTS idx_client_roadmaps_active 
  ON client_roadmaps(client_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_roadmaps_practice 
  ON client_roadmaps(practice_id, is_active);

-- Client tasks - task lists
CREATE INDEX IF NOT EXISTS idx_client_tasks_client 
  ON client_tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_roadmap 
  ON client_tasks(roadmap_id, week_number);

-- Client context - document lookups
CREATE INDEX IF NOT EXISTS idx_client_context_client 
  ON client_context(client_id, context_type);
CREATE INDEX IF NOT EXISTS idx_client_context_processed 
  ON client_context(processed) WHERE processed = false;

-- Document embeddings - vector search optimization
CREATE INDEX IF NOT EXISTS idx_embeddings_client 
  ON document_embeddings(client_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_context 
  ON document_embeddings(context_id);

-- Assessment questions - frequent lookups
CREATE INDEX IF NOT EXISTS idx_assessment_questions_service 
  ON assessment_questions(service_line_code, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_active 
  ON assessment_questions(is_active) WHERE is_active = true;

-- Service lines
CREATE INDEX IF NOT EXISTS idx_service_lines_code 
  ON service_lines(code);
CREATE INDEX IF NOT EXISTS idx_client_service_lines_client 
  ON client_service_lines(client_id);

-- Delivery teams
CREATE INDEX IF NOT EXISTS idx_delivery_teams_service 
  ON delivery_teams(service_line_code, status);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team 
  ON team_member_assignments(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_assignments_member 
  ON team_member_assignments(member_id);

-- Workflow phases
CREATE INDEX IF NOT EXISTS idx_workflow_phases_service 
  ON service_workflow_phases(service_line_code, display_order);

-- Phase activities  
CREATE INDEX IF NOT EXISTS idx_phase_activities_phase 
  ON phase_activities(phase_id, display_order);

-- Activity skill mappings
CREATE INDEX IF NOT EXISTS idx_activity_skills_activity 
  ON activity_skill_mappings(activity_id);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token 
  ON client_invitations(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_email 
  ON client_invitations(email);

-- Analyze tables after creating indexes
ANALYZE skill_assessments;
ANALYZE practice_members;
ANALYZE client_assessments;
ANALYZE client_roadmaps;
ANALYZE client_tasks;
ANALYZE client_context;
ANALYZE assessment_questions;
ANALYZE service_lines;

-- Report on index usage (run after some queries)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

