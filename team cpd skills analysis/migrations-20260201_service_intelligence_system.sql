-- =============================================================================
-- SERVICE INTELLIGENCE SYSTEM
-- =============================================================================
-- Enables creation of new services from identified opportunities
-- with skill mapping and automatic detection triggers
-- =============================================================================

-- 1. Add workflow columns to services table for draft/approval
-- =============================================================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'active';
-- Values: 'draft', 'pending_review', 'approved', 'active', 'archived'

ALTER TABLE services ADD COLUMN IF NOT EXISTS originated_from TEXT DEFAULT 'manual';
-- Values: 'manual', 'opportunity', 'service_concept'

ALTER TABLE services ADD COLUMN IF NOT EXISTS source_opportunity_id UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS source_concept_id UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_by_user_id UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_by_user_id UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE services ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 2. Service Skill Requirements
-- Maps services to the 111 assessed skills
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_skill_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Importance level
  importance TEXT NOT NULL DEFAULT 'required',
  -- 'critical' = must have, blocks delivery without it
  -- 'required' = strongly needed for quality delivery  
  -- 'beneficial' = improves delivery quality
  -- 'nice_to_have' = minor benefit
  
  -- Proficiency requirements
  minimum_level INTEGER NOT NULL DEFAULT 3 CHECK (minimum_level BETWEEN 1 AND 5),
  ideal_level INTEGER NOT NULL DEFAULT 4 CHECK (ideal_level BETWEEN 1 AND 5),
  
  -- Who should typically perform this
  recommended_seniority TEXT[] DEFAULT '{}',
  -- e.g., ['Partner', 'Director', 'Manager']
  
  -- AI-generated rationale
  rationale TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(service_id, skill_id)
);

-- 3. Service Opportunity Triggers
-- Conditions that indicate a client needs this service
-- Used by future assessments to auto-detect opportunities
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_opportunity_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Trigger identification
  trigger_code TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger type determines how to evaluate
  trigger_type TEXT NOT NULL,
  -- 'metric_threshold' = numeric comparison on a metric
  -- 'hva_response' = specific HVA answer pattern
  -- 'financial_ratio' = calculated financial ratio
  -- 'combination' = multiple conditions combined
  -- 'text_pattern' = text contains keywords/patterns
  
  -- The actual trigger configuration (JSONB for flexibility)
  trigger_config JSONB NOT NULL,
  -- Examples:
  -- metric_threshold: {"metric": "client_concentration_top3", "operator": ">", "value": 60}
  -- hva_response: {"field": "succession_your_role", "values": ["Need to hire", "No successor"]}
  -- financial_ratio: {"ratio": "debt_to_equity", "operator": ">", "value": 2}
  -- combination: {"all": [...], "any": [...]}
  -- text_pattern: {"field": "business_description", "contains": ["legacy", "manual"]}
  
  -- Scoring
  weight DECIMAL(3,2) DEFAULT 1.00 CHECK (weight BETWEEN 0 AND 1),
  -- How strongly this trigger indicates need for the service
  
  severity_when_triggered TEXT DEFAULT 'medium',
  -- 'critical', 'high', 'medium', 'low'
  
  -- Sample talking point when trigger fires
  talking_point TEXT,
  
  -- Is this trigger actively being used?
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_llm_model TEXT, -- e.g., 'claude-opus-4.5'
  
  UNIQUE(service_id, trigger_code)
);

-- 4. Service Creation Requests
-- Tracks the draft/review workflow for AI-generated services
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_creation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source of the request
  source_type TEXT NOT NULL, -- 'opportunity', 'service_concept', 'manual'
  source_opportunity_id UUID,
  source_concept_id UUID,
  source_engagement_id UUID,
  source_client_id UUID,
  
  -- AI-generated service proposal
  proposed_service JSONB NOT NULL,
  -- Contains: name, description, deliverables, pricing_suggestion, etc.
  
  -- AI-generated skill mappings
  proposed_skills JSONB NOT NULL,
  -- Array of: { skill_id, skill_name, importance, minimum_level, ideal_level, rationale }
  
  -- AI-generated triggers
  proposed_triggers JSONB NOT NULL,
  -- Array of: { trigger_code, trigger_name, trigger_type, trigger_config, weight, talking_point }
  
  -- AI reasoning
  ai_reasoning TEXT,
  llm_model TEXT,
  
  -- Workflow status
  status TEXT NOT NULL DEFAULT 'pending_review',
  -- 'pending_review', 'approved', 'rejected', 'needs_modification'
  
  -- Review details
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- If approved, link to created service
  created_service_id UUID REFERENCES services(id),
  
  -- Metadata
  requested_by UUID,
  requested_at TIMESTAMPTZ DEFAULT now(),
  practice_id UUID
);

-- 5. Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_service_skill_reqs_service 
  ON service_skill_requirements(service_id);
  
CREATE INDEX IF NOT EXISTS idx_service_skill_reqs_skill 
  ON service_skill_requirements(skill_id);
  
CREATE INDEX IF NOT EXISTS idx_service_triggers_service 
  ON service_opportunity_triggers(service_id);
  
CREATE INDEX IF NOT EXISTS idx_service_triggers_active 
  ON service_opportunity_triggers(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_creation_status 
  ON service_creation_requests(status);

CREATE INDEX IF NOT EXISTS idx_services_workflow_status 
  ON services(workflow_status);

-- 6. RLS Policies
-- =============================================================================
ALTER TABLE service_skill_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_opportunity_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_creation_requests ENABLE ROW LEVEL SECURITY;

-- Service skill requirements - readable by all authenticated
CREATE POLICY "service_skill_requirements_read" ON service_skill_requirements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_skill_requirements_write" ON service_skill_requirements
  FOR ALL TO service_role USING (true);

-- Service opportunity triggers - readable by all authenticated
CREATE POLICY "service_opportunity_triggers_read" ON service_opportunity_triggers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_opportunity_triggers_write" ON service_opportunity_triggers
  FOR ALL TO service_role USING (true);

-- Service creation requests - practice-based access
CREATE POLICY "service_creation_requests_read" ON service_creation_requests
  FOR SELECT TO authenticated 
  USING (practice_id IS NULL OR practice_id IN (
    SELECT practice_id FROM practice_members WHERE id = auth.uid()
  ));

CREATE POLICY "service_creation_requests_write" ON service_creation_requests
  FOR ALL TO service_role USING (true);

-- 7. Update services constraint for new workflow statuses
-- =============================================================================
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_workflow_status_check;
ALTER TABLE services ADD CONSTRAINT services_workflow_status_check 
  CHECK (workflow_status IN ('draft', 'pending_review', 'approved', 'active', 'archived'));

-- 8. Comments for documentation
-- =============================================================================
COMMENT ON TABLE service_skill_requirements IS 
  'Maps services to required skills from the 111 assessed skills. Used for capacity planning and team allocation.';

COMMENT ON TABLE service_opportunity_triggers IS 
  'Conditions that indicate a client needs a service. Used by assessments to auto-detect opportunities.';

COMMENT ON TABLE service_creation_requests IS 
  'Tracks AI-generated service proposals through the draft/review/approval workflow.';

COMMENT ON COLUMN service_opportunity_triggers.trigger_config IS 
  'JSONB configuration. Examples:
   metric_threshold: {"metric": "client_concentration_top3", "operator": ">", "value": 60}
   hva_response: {"field": "succession_your_role", "values": ["Need to hire"]}
   combination: {"all": [trigger1, trigger2], "any": [trigger3]}';

