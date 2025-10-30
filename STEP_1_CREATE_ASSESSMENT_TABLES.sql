-- ============================================================================
-- STEP 1: CREATE ASSESSMENT TABLES
-- Run this first to create all 5 new assessment tables
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. WORKING PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  communication_style TEXT NOT NULL CHECK (communication_style IN ('high_sync', 'balanced', 'async_preferred')),
  work_style TEXT NOT NULL CHECK (work_style IN ('structured', 'flexible', 'autonomous')),
  environment TEXT NOT NULL CHECK (environment IN ('quiet_focused', 'social_collaborative', 'flexible_adaptive')),
  feedback_preference TEXT NOT NULL CHECK (feedback_preference IN ('frequent_direct', 'regular_balanced', 'autonomous_minimal')),
  collaboration_preference TEXT NOT NULL CHECK (collaboration_preference IN ('independent', 'collaborative', 'mixed')),
  time_management TEXT NOT NULL CHECK (time_management IN ('early_planner', 'steady_executor', 'deadline_driven')),
  
  preferences_data JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

CREATE INDEX IF NOT EXISTS idx_working_prefs_member ON working_preferences(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_working_prefs_practice ON working_preferences(practice_id);
CREATE INDEX IF NOT EXISTS idx_working_prefs_comm_style ON working_preferences(communication_style);
CREATE INDEX IF NOT EXISTS idx_working_prefs_collab ON working_preferences(collaboration_preference);

-- ============================================================================
-- 2. BELBIN ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS belbin_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  primary_role TEXT NOT NULL CHECK (primary_role IN (
    'plant', 'monitor_evaluator', 'specialist', 
    'coordinator', 'teamworker', 'resource_investigator',
    'shaper', 'implementer', 'completer_finisher'
  )),
  secondary_role TEXT CHECK (secondary_role IN (
    'plant', 'monitor_evaluator', 'specialist', 
    'coordinator', 'teamworker', 'resource_investigator',
    'shaper', 'implementer', 'completer_finisher'
  )),
  
  role_scores JSONB NOT NULL DEFAULT '{}',
  domain_scores JSONB NOT NULL DEFAULT '{}',
  
  summary TEXT,
  strengths TEXT[],
  allowable_weaknesses TEXT[],
  ideal_team_contributions TEXT,
  
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

CREATE INDEX IF NOT EXISTS idx_belbin_member ON belbin_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_belbin_practice ON belbin_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_belbin_primary_role ON belbin_assessments(primary_role);
CREATE INDEX IF NOT EXISTS idx_belbin_secondary_role ON belbin_assessments(secondary_role);

-- ============================================================================
-- 3. MOTIVATIONAL DRIVERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS motivational_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  primary_driver TEXT NOT NULL CHECK (primary_driver IN (
    'achievement', 'affiliation', 'power_influence', 
    'autonomy', 'security', 'variety'
  )),
  secondary_driver TEXT CHECK (secondary_driver IN (
    'achievement', 'affiliation', 'power_influence', 
    'autonomy', 'security', 'variety'
  )),
  
  driver_scores JSONB NOT NULL DEFAULT '{}',
  motivation_intensity TEXT NOT NULL CHECK (motivation_intensity IN ('low', 'moderate', 'high')),
  
  summary TEXT,
  what_motivates TEXT[],
  what_demotivates TEXT[],
  ideal_role_characteristics TEXT[],
  retention_risks TEXT[],
  
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

CREATE INDEX IF NOT EXISTS idx_motiv_member ON motivational_drivers(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_motiv_practice ON motivational_drivers(practice_id);
CREATE INDEX IF NOT EXISTS idx_motiv_primary ON motivational_drivers(primary_driver);
CREATE INDEX IF NOT EXISTS idx_motiv_intensity ON motivational_drivers(motivation_intensity);

-- ============================================================================
-- 4. EQ ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS eq_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  self_awareness_score INTEGER NOT NULL CHECK (self_awareness_score >= 0 AND self_awareness_score <= 100),
  self_management_score INTEGER NOT NULL CHECK (self_management_score >= 0 AND self_management_score <= 100),
  social_awareness_score INTEGER NOT NULL CHECK (social_awareness_score >= 0 AND social_awareness_score <= 100),
  relationship_management_score INTEGER NOT NULL CHECK (relationship_management_score >= 0 AND relationship_management_score <= 100),
  
  overall_eq INTEGER NOT NULL CHECK (overall_eq >= 0 AND overall_eq <= 100),
  eq_level TEXT NOT NULL CHECK (eq_level IN ('developing', 'competent', 'strong', 'exceptional')),
  
  summary TEXT,
  strengths TEXT[],
  development_areas TEXT[],
  workplace_implications JSONB NOT NULL DEFAULT '{}',
  growth_recommendations TEXT[],
  
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

CREATE INDEX IF NOT EXISTS idx_eq_member ON eq_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_eq_practice ON eq_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_eq_overall ON eq_assessments(overall_eq);
CREATE INDEX IF NOT EXISTS idx_eq_level ON eq_assessments(eq_level);
CREATE INDEX IF NOT EXISTS idx_eq_self_mgmt ON eq_assessments(self_management_score);

-- ============================================================================
-- 5. CONFLICT STYLE ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conflict_style_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  primary_style TEXT NOT NULL CHECK (primary_style IN (
    'competing', 'collaborating', 'compromising', 
    'avoiding', 'accommodating'
  )),
  secondary_style TEXT CHECK (secondary_style IN (
    'competing', 'collaborating', 'compromising', 
    'avoiding', 'accommodating'
  )),
  
  style_scores JSONB NOT NULL DEFAULT '{}',
  
  assertiveness_level TEXT NOT NULL CHECK (assertiveness_level IN ('low', 'moderate', 'high')),
  cooperativeness_level TEXT NOT NULL CHECK (cooperativeness_level IN ('low', 'moderate', 'high')),
  flexibility_score INTEGER NOT NULL CHECK (flexibility_score >= 0 AND flexibility_score <= 100),
  
  summary TEXT,
  when_effective TEXT[],
  when_ineffective TEXT[],
  growth_recommendations TEXT[],
  
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

CREATE INDEX IF NOT EXISTS idx_conflict_member ON conflict_style_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_conflict_practice ON conflict_style_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_conflict_primary ON conflict_style_assessments(primary_style);
CREATE INDEX IF NOT EXISTS idx_conflict_flexibility ON conflict_style_assessments(flexibility_score);
CREATE INDEX IF NOT EXISTS idx_conflict_assertive ON conflict_style_assessments(assertiveness_level);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ STEP 1 COMPLETE: All 5 assessment tables created!';
  RAISE NOTICE '   - working_preferences ✓';
  RAISE NOTICE '   - belbin_assessments ✓';
  RAISE NOTICE '   - motivational_drivers ✓';
  RAISE NOTICE '   - eq_assessments ✓';
  RAISE NOTICE '   - conflict_style_assessments ✓';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT: Run STEP_2_ADD_TRIGGERS_AND_RLS.sql';
END $$;

