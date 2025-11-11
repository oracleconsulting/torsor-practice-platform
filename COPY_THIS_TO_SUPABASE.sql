# 🚨 QUICK FIX - Run This in Supabase SQL Editor

**Problem:** Tables don't exist yet, so profiles can't load.

**Solution:** Copy everything below the line and run it in Supabase SQL Editor.

---

## COPY FROM HERE ↓


-- =====================================================
-- ROLE DEFINITIONS & RESPONSIBILITIES SYSTEM
-- =====================================================
-- Allows admins to define role requirements and match against team member assessments
-- Created: November 4, 2025

-- =====================================================
-- 1. ROLE DEFINITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  
  -- Basic Info
  role_title VARCHAR(100) NOT NULL,
  role_category VARCHAR(50), -- 'technical', 'advisory', 'hybrid', 'leadership'
  seniority_level VARCHAR(50), -- 'Junior', 'Senior', 'Assistant Manager', 'Manager', 'Director', 'Partner'
  department VARCHAR(100), -- 'Audit', 'Tax', 'Advisory', 'Corporate Finance'
  
  -- Role Description
  description TEXT,
  key_responsibilities TEXT[], -- Array of responsibility strings
  
  -- Required Competencies (0-100 scale for each)
  -- Belbin Requirements
  required_belbin_roles JSONB, -- {"Plant": "required", "Coordinator": "preferred", "Specialist": "optional"}
  
  -- EQ Requirements
  min_eq_self_awareness INTEGER DEFAULT 50,
  min_eq_self_management INTEGER DEFAULT 50,
  min_eq_social_awareness INTEGER DEFAULT 50,
  min_eq_relationship_management INTEGER DEFAULT 50,
  
  -- Motivational Requirements
  required_achievement INTEGER DEFAULT 50, -- 0-100
  required_affiliation INTEGER DEFAULT 50,
  required_autonomy INTEGER DEFAULT 50,
  required_influence INTEGER DEFAULT 50,
  
  -- Communication & Work Style
  preferred_communication_style VARCHAR(50), -- 'sync', 'async', 'hybrid'
  preferred_work_environment VARCHAR(50), -- 'office', 'remote', 'hybrid'
  client_facing BOOLEAN DEFAULT false,
  
  -- Conflict Style
  preferred_conflict_styles VARCHAR(50)[], -- ['Collaborating', 'Compromising']
  
  -- Skill Requirements (links to skills table)
  required_skills JSONB, -- [{"skill_name": "Financial Analysis", "min_level": 3, "importance": "critical"}]
  
  -- VARK Learning
  training_delivery_preference VARCHAR(50), -- 'visual', 'auditory', 'reading', 'kinesthetic', 'multimodal'
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique role titles per practice
  UNIQUE(practice_id, role_title, seniority_level)
);

CREATE INDEX idx_role_definitions_practice ON role_definitions(practice_id);
CREATE INDEX idx_role_definitions_category ON role_definitions(role_category);
CREATE INDEX idx_role_definitions_active ON role_definitions(is_active);

COMMENT ON TABLE role_definitions IS 'Defines role requirements and competencies for matching against team member assessments';

-- =====================================================
-- 2. MEMBER ROLE ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS member_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  role_definition_id UUID REFERENCES role_definitions(id) ON DELETE CASCADE,
  
  -- Assignment Details
  assigned_date DATE DEFAULT CURRENT_DATE,
  target_proficiency_date DATE, -- When they should be fully proficient
  
  -- Suitability Score (calculated)
  suitability_score INTEGER, -- 0-100, calculated from assessments vs role requirements
  last_calculated TIMESTAMPTZ,
  
  -- Status
  assignment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'training', 'completed', 'reassigned'
  
  -- Notes
  assignment_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(practice_member_id, role_definition_id)
);

CREATE INDEX idx_member_role_assignments_member ON member_role_assignments(practice_member_id);
CREATE INDEX idx_member_role_assignments_role ON member_role_assignments(role_definition_id);
CREATE INDEX idx_member_role_assignments_status ON member_role_assignments(assignment_status);

COMMENT ON TABLE member_role_assignments IS 'Tracks which roles are assigned to team members and their fit scores';

-- =====================================================
-- 3. INDIVIDUAL ASSESSMENT PROFILES TABLE
-- =====================================================
-- Stores computed strengths, weaknesses, and recommendations for each member
CREATE TABLE IF NOT EXISTS individual_assessment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE UNIQUE,
  
  -- Computed Strengths (from assessments)
  top_strengths JSONB, -- [{"area": "Client Relationship Building", "score": 85, "evidence": "High EQ + Coordinator Belbin"}]
  
  -- Development Areas
  development_areas JSONB, -- [{"area": "Technical Analysis", "current": 55, "target": 70, "priority": "high"}]
  
  -- Personality Summary
  personality_summary TEXT,
  
  -- Work Style Insights
  optimal_work_conditions JSONB, -- {"communication": "sync", "environment": "hybrid", "autonomy": "high"}
  
  -- Team Contribution
  team_contribution_style TEXT,
  
  -- Role Suitability Scores (from role-fit analyzer)
  advisory_score INTEGER,
  technical_score INTEGER,
  hybrid_score INTEGER,
  leadership_score INTEGER,
  
  -- Current Role Match
  current_role_match_score INTEGER, -- How well they fit their assigned role
  current_role_gaps JSONB, -- Specific gaps vs current role requirements
  
  -- Recommendations
  recommended_roles TEXT[], -- Suggested role titles based on profile
  training_priorities JSONB, -- [{"skill": "Advanced Excel", "urgency": "high", "estimated_time": "3 months"}]
  
  -- Career Path
  career_trajectory VARCHAR(50), -- 'technical_specialist', 'people_manager', 'hybrid_leader'
  next_role_readiness INTEGER, -- 0-100 score for promotion readiness
  
  -- Metadata
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  calculation_version VARCHAR(20) DEFAULT '1.0',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_individual_profiles_member ON individual_assessment_profiles(practice_member_id);
CREATE INDEX idx_individual_profiles_calculated ON individual_assessment_profiles(last_calculated);

COMMENT ON TABLE individual_assessment_profiles IS 'Comprehensive individual assessment profiles with strengths, gaps, and recommendations';

-- =====================================================
-- 4. ROLE COMPETENCY GAP ANALYSIS TABLE
-- =====================================================
-- Tracks specific gaps between member assessments and role requirements
CREATE TABLE IF NOT EXISTS role_competency_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  role_definition_id UUID REFERENCES role_definitions(id) ON DELETE CASCADE,
  
  -- Gap Details
  competency_type VARCHAR(50), -- 'belbin', 'eq', 'skill', 'motivation', 'communication'
  competency_name VARCHAR(100),
  
  required_level INTEGER, -- What role requires (0-100)
  current_level INTEGER, -- What member has (0-100)
  gap_size INTEGER, -- Difference (can be negative if exceeds requirement)
  
  -- Gap Severity
  severity VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  is_blocking BOOLEAN DEFAULT false, -- Prevents role assignment
  
  -- Remediation
  recommended_action TEXT,
  estimated_time_to_close VARCHAR(50), -- '3 months', '6 months', '1 year'
  
  -- Status
  gap_status VARCHAR(50) DEFAULT 'identified', -- 'identified', 'in_progress', 'closed'
  progress_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_gaps_member ON role_competency_gaps(practice_member_id);
CREATE INDEX idx_role_gaps_role ON role_competency_gaps(role_definition_id);
CREATE INDEX idx_role_gaps_severity ON role_competency_gaps(severity);
CREATE INDEX idx_role_gaps_status ON role_competency_gaps(gap_status);

COMMENT ON TABLE role_competency_gaps IS 'Detailed gap analysis between member capabilities and role requirements';

-- =====================================================
-- 5. SEED DEFAULT ROLE DEFINITIONS
-- =====================================================
-- Insert common accountancy roles as starting templates

-- Only insert if practices table exists and we have data
DO $$
DECLARE
  default_practice_id UUID;
BEGIN
  -- Get the first practice (or you can specify your practice ID)
  SELECT id INTO default_practice_id FROM practices LIMIT 1;
  
  IF default_practice_id IS NOT NULL THEN
    
    -- Junior Auditor
    INSERT INTO role_definitions (
      practice_id, role_title, role_category, seniority_level, department,
      description, key_responsibilities,
      required_belbin_roles,
      min_eq_self_awareness, min_eq_self_management, min_eq_social_awareness, min_eq_relationship_management,
      required_achievement, required_affiliation, required_autonomy, required_influence,
      preferred_communication_style, client_facing,
      required_skills
    ) VALUES (
      default_practice_id,
      'Audit Junior',
      'technical',
      'Junior',
      'Audit',
      'Entry-level audit position focusing on technical skills and learning',
      ARRAY[
        'Perform detailed testing of client records',
        'Prepare working papers and audit documentation',
        'Assist senior auditors with fieldwork',
        'Learn audit methodologies and standards',
        'Develop technical accounting knowledge'
      ],
      '{"Implementer": "preferred", "Specialist": "preferred", "Completer-Finisher": "optional"}'::jsonb,
      55, 60, 50, 50, -- EQ: Need self-management most
      70, 40, 50, 30, -- High achievement, low influence
      'hybrid',
      false, -- Not client-facing yet
      '[
        {"skill_name": "Attention to Detail", "min_level": 3, "importance": "critical"},
        {"skill_name": "Technical Accounting", "min_level": 2, "importance": "critical"},
        {"skill_name": "Excel Skills", "min_level": 3, "importance": "high"}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- Senior Auditor
    INSERT INTO role_definitions (
      practice_id, role_title, role_category, seniority_level, department,
      description, key_responsibilities,
      required_belbin_roles,
      min_eq_self_awareness, min_eq_self_management, min_eq_social_awareness, min_eq_relationship_management,
      required_achievement, required_affiliation, required_autonomy, required_influence,
      preferred_communication_style, client_facing,
      required_skills
    ) VALUES (
      default_practice_id,
      'Audit Senior',
      'technical',
      'Senior',
      'Audit',
      'Experienced auditor leading fieldwork and managing junior staff',
      ARRAY[
        'Lead audit fieldwork and testing',
        'Review junior staff work',
        'Communicate with client finance teams',
        'Identify and escalate audit risks',
        'Coach and develop junior team members'
      ],
      '{"Coordinator": "preferred", "Specialist": "required", "Completer-Finisher": "preferred"}'::jsonb,
      65, 70, 65, 60, -- Higher EQ requirements
      75, 55, 60, 50, -- Balanced drivers
      'sync',
      true, -- Client-facing
      '[
        {"skill_name": "Attention to Detail", "min_level": 4, "importance": "critical"},
        {"skill_name": "Technical Accounting", "min_level": 4, "importance": "critical"},
        {"skill_name": "Client Communication", "min_level": 3, "importance": "high"},
        {"skill_name": "Team Leadership", "min_level": 2, "importance": "medium"}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- Audit Manager
    INSERT INTO role_definitions (
      practice_id, role_title, role_category, seniority_level, department,
      description, key_responsibilities,
      required_belbin_roles,
      min_eq_self_awareness, min_eq_self_management, min_eq_social_awareness, min_eq_relationship_management,
      required_achievement, required_affiliation, required_autonomy, required_influence,
      preferred_communication_style, client_facing,
      required_skills
    ) VALUES (
      default_practice_id,
      'Audit Manager',
      'hybrid',
      'Manager',
      'Audit',
      'Senior manager overseeing multiple engagements and client relationships',
      ARRAY[
        'Manage multiple audit engagements simultaneously',
        'Build and maintain key client relationships',
        'Review and approve audit work',
        'Develop team members and conduct reviews',
        'Identify business development opportunities',
        'Manage engagement budgets and profitability'
      ],
      '{"Coordinator": "required", "Resource Investigator": "preferred", "Specialist": "preferred"}'::jsonb,
      75, 75, 75, 80, -- High EQ across all areas
      70, 65, 60, 70, -- Balanced with high influence
      'sync',
      true,
      '[
        {"skill_name": "Client Relationship Building", "min_level": 4, "importance": "critical"},
        {"skill_name": "Technical Accounting", "min_level": 4, "importance": "critical"},
        {"skill_name": "Team Leadership", "min_level": 4, "importance": "critical"},
        {"skill_name": "Project Management", "min_level": 3, "importance": "high"},
        {"skill_name": "Business Development", "min_level": 3, "importance": "medium"}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- Tax Advisor
    INSERT INTO role_definitions (
      practice_id, role_title, role_category, seniority_level, department,
      description, key_responsibilities,
      required_belbin_roles,
      min_eq_self_awareness, min_eq_self_management, min_eq_social_awareness, min_eq_relationship_management,
      required_achievement, required_affiliation, required_autonomy, required_influence,
      preferred_communication_style, client_facing,
      required_skills
    ) VALUES (
      default_practice_id,
      'Tax Advisor',
      'advisory',
      'Senior',
      'Tax',
      'Client-facing tax advisory role requiring strong communication and technical knowledge',
      ARRAY[
        'Provide tax planning advice to clients',
        'Build trusted advisor relationships',
        'Translate complex tax rules into plain English',
        'Identify tax opportunities and risks',
        'Collaborate with audit and corporate finance teams'
      ],
      '{"Resource Investigator": "required", "Specialist": "preferred", "Plant": "optional"}'::jsonb,
      70, 65, 75, 80, -- Very high relationship management
      65, 70, 55, 75, -- High affiliation and influence
      'sync',
      true,
      '[
        {"skill_name": "Client Communication", "min_level": 4, "importance": "critical"},
        {"skill_name": "Tax Technical Knowledge", "min_level": 4, "importance": "critical"},
        {"skill_name": "Problem Solving", "min_level": 4, "importance": "high"},
        {"skill_name": "Commercial Awareness", "min_level": 3, "importance": "high"}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- Corporate Finance Analyst
    INSERT INTO role_definitions (
      practice_id, role_title, role_category, seniority_level, department,
      description, key_responsibilities,
      required_belbin_roles,
      min_eq_self_awareness, min_eq_self_management, min_eq_social_awareness, min_eq_relationship_management,
      required_achievement, required_affiliation, required_autonomy, required_influence,
      preferred_communication_style, client_facing,
      required_skills
    ) VALUES (
      default_practice_id,
      'Corporate Finance Analyst',
      'technical',
      'Senior',
      'Corporate Finance',
      'Analytical role focused on valuations, modeling, and deal support',
      ARRAY[
        'Build financial models for valuations and forecasts',
        'Conduct due diligence on transactions',
        'Prepare reports and presentations',
        'Analyze financial data and identify trends',
        'Support deal teams with analysis'
      ],
      '{"Specialist": "required", "Plant": "preferred", "Monitor Evaluator": "preferred"}'::jsonb,
      65, 70, 55, 55, -- Lower social requirements, high self-management
      80, 40, 70, 50, -- Very high achievement and autonomy
      'async',
      false, -- Less client-facing
      '[
        {"skill_name": "Financial Modeling", "min_level": 4, "importance": "critical"},
        {"skill_name": "Advanced Financial Analysis", "min_level": 4, "importance": "critical"},
        {"skill_name": "Excel Skills", "min_level": 5, "importance": "critical"},
        {"skill_name": "Attention to Detail", "min_level": 4, "importance": "high"}
      ]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Default role definitions seeded successfully';
  ELSE
    RAISE NOTICE 'No practice found - skipping role definitions seed';
  END IF;
END $$;

-- =====================================================
-- 6. RLS POLICIES (Temporarily disabled for testing)
-- =====================================================

-- Enable RLS
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_assessment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_competency_gaps ENABLE ROW LEVEL SECURITY;

-- Temporarily allow all operations for testing
CREATE POLICY "Allow all for role_definitions" ON role_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for member_role_assignments" ON member_role_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for individual_assessment_profiles" ON individual_assessment_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for role_competency_gaps" ON role_competency_gaps FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_role_definitions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_role_definitions_timestamp BEFORE UPDATE ON role_definitions
  FOR EACH ROW EXECUTE FUNCTION update_role_definitions_timestamp();

CREATE TRIGGER update_member_role_assignments_timestamp BEFORE UPDATE ON member_role_assignments
  FOR EACH ROW EXECUTE FUNCTION update_role_definitions_timestamp();

CREATE TRIGGER update_individual_profiles_timestamp BEFORE UPDATE ON individual_assessment_profiles
  FOR EACH ROW EXECUTE FUNCTION update_role_definitions_timestamp();

CREATE TRIGGER update_role_gaps_timestamp BEFORE UPDATE ON role_competency_gaps
  FOR EACH ROW EXECUTE FUNCTION update_role_definitions_timestamp();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created:
-- 1. role_definitions - Role requirements and competencies
-- 2. member_role_assignments - Who has which role
-- 3. individual_assessment_profiles - Computed profiles
-- 4. role_competency_gaps - Specific gaps vs roles
--
-- Features enabled:
-- - Role definition and management
-- - Member-to-role assignments
-- - Automated suitability scoring
-- - Gap analysis and tracking
-- - Career trajectory planning
-- =====================================================

