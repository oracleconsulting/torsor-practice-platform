-- ============================================================================
-- COMPREHENSIVE ASSESSMENT SYSTEM - DATABASE SCHEMA
-- Adds 5 new professional assessment types to Torsor Practice Platform
-- ============================================================================

-- ============================================================================
-- 1. WORKING PREFERENCES ASSESSMENT
-- Captures how individuals prefer to work, communicate, and collaborate
-- ============================================================================

CREATE TABLE IF NOT EXISTS working_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Assessment answers (JSONB for flexibility)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Calculated profile dimensions
  communication_style TEXT NOT NULL CHECK (communication_style IN ('high_sync', 'balanced', 'async_preferred')),
  work_style TEXT NOT NULL CHECK (work_style IN ('structured', 'flexible', 'autonomous')),
  environment TEXT NOT NULL CHECK (environment IN ('quiet_focused', 'social_collaborative', 'flexible_adaptive')),
  feedback_preference TEXT NOT NULL CHECK (feedback_preference IN ('frequent_direct', 'regular_balanced', 'autonomous_minimal')),
  collaboration_preference TEXT NOT NULL CHECK (collaboration_preference IN ('independent', 'collaborative', 'mixed')),
  time_management TEXT NOT NULL CHECK (time_management IN ('early_planner', 'steady_executor', 'deadline_driven')),
  
  -- Detailed preferences (JSONB for full profile data)
  preferences_data JSONB NOT NULL DEFAULT '{}',
  
  -- Summary
  summary TEXT,
  
  -- Timestamps
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one assessment per person
  UNIQUE(practice_member_id)
);

-- Indexes for working_preferences
CREATE INDEX IF NOT EXISTS idx_working_prefs_member ON working_preferences(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_working_prefs_practice ON working_preferences(practice_id);
CREATE INDEX IF NOT EXISTS idx_working_prefs_comm_style ON working_preferences(communication_style);
CREATE INDEX IF NOT EXISTS idx_working_prefs_collab ON working_preferences(collaboration_preference);

-- ============================================================================
-- 2. BELBIN TEAM ROLES ASSESSMENT
-- Identifies preferred team roles (9 roles across action/people/thought domains)
-- ============================================================================

CREATE TABLE IF NOT EXISTS belbin_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Assessment answers (JSONB: question_id -> selected_role)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Primary and secondary roles
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
  
  -- Scores for all 9 roles (0-27 max score)
  role_scores JSONB NOT NULL DEFAULT '{}',
  
  -- Domain scores (thought-oriented, people-oriented, action-oriented)
  domain_scores JSONB NOT NULL DEFAULT '{}',
  
  -- Profile summary
  summary TEXT,
  strengths TEXT[],
  allowable_weaknesses TEXT[],
  ideal_team_contributions TEXT,
  
  -- Timestamps
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

-- Indexes for belbin_assessments
CREATE INDEX IF NOT EXISTS idx_belbin_member ON belbin_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_belbin_practice ON belbin_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_belbin_primary_role ON belbin_assessments(primary_role);
CREATE INDEX IF NOT EXISTS idx_belbin_secondary_role ON belbin_assessments(secondary_role);

-- ============================================================================
-- 3. MOTIVATIONAL DRIVERS ASSESSMENT
-- Identifies what motivates individuals (achievement, affiliation, power, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS motivational_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Assessment answers (JSONB: question_id -> selected_driver)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Primary and secondary motivational drivers
  primary_driver TEXT NOT NULL CHECK (primary_driver IN (
    'achievement', 'affiliation', 'power_influence', 
    'autonomy', 'security', 'variety'
  )),
  secondary_driver TEXT CHECK (secondary_driver IN (
    'achievement', 'affiliation', 'power_influence', 
    'autonomy', 'security', 'variety'
  )),
  
  -- Scores for all 6 drivers (0-30 max score)
  driver_scores JSONB NOT NULL DEFAULT '{}',
  
  -- Motivation intensity (how focused vs. balanced)
  motivation_intensity TEXT NOT NULL CHECK (motivation_intensity IN ('low', 'moderate', 'high')),
  
  -- Profile details
  summary TEXT,
  what_motivates TEXT[],
  what_demotivates TEXT[],
  ideal_role_characteristics TEXT[],
  retention_risks TEXT[],
  
  -- Timestamps
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

-- Indexes for motivational_drivers
CREATE INDEX IF NOT EXISTS idx_motiv_member ON motivational_drivers(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_motiv_practice ON motivational_drivers(practice_id);
CREATE INDEX IF NOT EXISTS idx_motiv_primary ON motivational_drivers(primary_driver);
CREATE INDEX IF NOT EXISTS idx_motiv_intensity ON motivational_drivers(motivation_intensity);

-- ============================================================================
-- 4. EMOTIONAL INTELLIGENCE (EQ) ASSESSMENT
-- Measures 4 EQ domains: self-awareness, self-management, social awareness, relationship management
-- ============================================================================

CREATE TABLE IF NOT EXISTS eq_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Assessment answers (JSONB: question_id -> rating 1-5)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Domain scores (0-100 percentages)
  self_awareness_score INTEGER NOT NULL CHECK (self_awareness_score >= 0 AND self_awareness_score <= 100),
  self_management_score INTEGER NOT NULL CHECK (self_management_score >= 0 AND self_management_score <= 100),
  social_awareness_score INTEGER NOT NULL CHECK (social_awareness_score >= 0 AND social_awareness_score <= 100),
  relationship_management_score INTEGER NOT NULL CHECK (relationship_management_score >= 0 AND relationship_management_score <= 100),
  
  -- Overall EQ score (0-100)
  overall_eq INTEGER NOT NULL CHECK (overall_eq >= 0 AND overall_eq <= 100),
  
  -- EQ level
  eq_level TEXT NOT NULL CHECK (eq_level IN ('developing', 'competent', 'strong', 'exceptional')),
  
  -- Profile details
  summary TEXT,
  strengths TEXT[],
  development_areas TEXT[],
  
  -- Workplace implications (JSONB)
  workplace_implications JSONB NOT NULL DEFAULT '{}',
  
  -- Growth recommendations
  growth_recommendations TEXT[],
  
  -- Timestamps
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

-- Indexes for eq_assessments
CREATE INDEX IF NOT EXISTS idx_eq_member ON eq_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_eq_practice ON eq_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_eq_overall ON eq_assessments(overall_eq);
CREATE INDEX IF NOT EXISTS idx_eq_level ON eq_assessments(eq_level);
CREATE INDEX IF NOT EXISTS idx_eq_self_mgmt ON eq_assessments(self_management_score);

-- ============================================================================
-- 5. CONFLICT STYLE ASSESSMENT (Thomas-Kilmann)
-- Identifies preferred conflict-handling modes
-- ============================================================================

CREATE TABLE IF NOT EXISTS conflict_style_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Assessment answers (JSONB: question_id -> selected_style)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Primary and secondary conflict styles
  primary_style TEXT NOT NULL CHECK (primary_style IN (
    'competing', 'collaborating', 'compromising', 
    'avoiding', 'accommodating'
  )),
  secondary_style TEXT CHECK (secondary_style IN (
    'competing', 'collaborating', 'compromising', 
    'avoiding', 'accommodating'
  )),
  
  -- Scores for all 5 styles (0-30 max score)
  style_scores JSONB NOT NULL DEFAULT '{}',
  
  -- Assertiveness and cooperativeness levels
  assertiveness_level TEXT NOT NULL CHECK (assertiveness_level IN ('low', 'moderate', 'high')),
  cooperativeness_level TEXT NOT NULL CHECK (cooperativeness_level IN ('low', 'moderate', 'high')),
  
  -- Flexibility score (0-100: how balanced across styles)
  flexibility_score INTEGER NOT NULL CHECK (flexibility_score >= 0 AND flexibility_score <= 100),
  
  -- Profile details
  summary TEXT,
  when_effective TEXT[],
  when_ineffective TEXT[],
  growth_recommendations TEXT[],
  
  -- Timestamps
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(practice_member_id)
);

-- Indexes for conflict_style_assessments
CREATE INDEX IF NOT EXISTS idx_conflict_member ON conflict_style_assessments(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_conflict_practice ON conflict_style_assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_conflict_primary ON conflict_style_assessments(primary_style);
CREATE INDEX IF NOT EXISTS idx_conflict_flexibility ON conflict_style_assessments(flexibility_score);
CREATE INDEX IF NOT EXISTS idx_conflict_assertive ON conflict_style_assessments(assertiveness_level);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Working Preferences
CREATE OR REPLACE FUNCTION update_working_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_working_preferences_updated_at
  BEFORE UPDATE ON working_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_working_preferences_updated_at();

-- Belbin Assessments
CREATE OR REPLACE FUNCTION update_belbin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_belbin_updated_at
  BEFORE UPDATE ON belbin_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_belbin_updated_at();

-- Motivational Drivers
CREATE OR REPLACE FUNCTION update_motivational_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_motivational_drivers_updated_at
  BEFORE UPDATE ON motivational_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_motivational_drivers_updated_at();

-- EQ Assessments
CREATE OR REPLACE FUNCTION update_eq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_eq_updated_at
  BEFORE UPDATE ON eq_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_eq_updated_at();

-- Conflict Style Assessments
CREATE OR REPLACE FUNCTION update_conflict_style_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conflict_style_updated_at
  BEFORE UPDATE ON conflict_style_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_conflict_style_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE working_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE belbin_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivational_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE eq_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_style_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: WORKING PREFERENCES
-- ============================================================================

-- Members can view their own working preferences
CREATE POLICY working_prefs_member_view ON working_preferences
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all working preferences in their practice
CREATE POLICY working_prefs_admin_view ON working_preferences
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Members can insert/update their own working preferences
CREATE POLICY working_prefs_member_manage ON working_preferences
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: BELBIN ASSESSMENTS
-- ============================================================================

CREATE POLICY belbin_member_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY belbin_admin_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY belbin_member_manage ON belbin_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: MOTIVATIONAL DRIVERS
-- ============================================================================

CREATE POLICY motiv_member_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY motiv_admin_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY motiv_member_manage ON motivational_drivers
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: EQ ASSESSMENTS
-- ============================================================================

CREATE POLICY eq_member_view ON eq_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY eq_admin_view ON eq_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY eq_member_manage ON eq_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: CONFLICT STYLE ASSESSMENTS
-- ============================================================================

CREATE POLICY conflict_member_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY conflict_admin_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY conflict_member_manage ON conflict_style_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPREHENSIVE ASSESSMENT VIEW
-- Combines all assessment data for team overview
-- ============================================================================

CREATE OR REPLACE VIEW team_comprehensive_assessments AS
SELECT 
  pm.id AS member_id,
  pm.name AS member_name,
  pm.email,
  pm.role,
  pm.practice_id,
  p.name AS practice_name,
  
  -- VARK Learning Style
  lp.primary_style AS vark_primary_style,
  lp.scores AS vark_scores,
  
  -- OCEAN Personality
  pa.profile AS personality_profile,
  pa.work_style,
  pa.communication_style AS personality_communication,
  pa.traits AS personality_traits,
  
  -- Working Preferences
  wp.communication_style AS work_communication,
  wp.work_style AS work_approach,
  wp.environment AS work_environment,
  wp.collaboration_preference,
  wp.feedback_preference,
  wp.time_management,
  
  -- Belbin Team Role
  ba.primary_role AS belbin_primary,
  ba.secondary_role AS belbin_secondary,
  ba.role_scores AS belbin_scores,
  
  -- Motivational Drivers
  md.primary_driver AS motivation_primary,
  md.secondary_driver AS motivation_secondary,
  md.motivation_intensity,
  md.driver_scores AS motivation_scores,
  
  -- Emotional Intelligence
  eq.overall_eq,
  eq.eq_level,
  eq.self_awareness_score,
  eq.self_management_score,
  eq.social_awareness_score,
  eq.relationship_management_score,
  
  -- Conflict Style
  cs.primary_style AS conflict_primary,
  cs.secondary_style AS conflict_secondary,
  cs.flexibility_score AS conflict_flexibility,
  cs.assertiveness_level,
  cs.cooperativeness_level,
  
  -- Assessment completion tracking
  (lp.id IS NOT NULL) AS vark_completed,
  (pa.id IS NOT NULL) AS ocean_completed,
  (wp.id IS NOT NULL) AS working_prefs_completed,
  (ba.id IS NOT NULL) AS belbin_completed,
  (md.id IS NOT NULL) AS motivation_completed,
  (eq.id IS NOT NULL) AS eq_completed,
  (cs.id IS NOT NULL) AS conflict_completed,
  
  -- Overall completion percentage
  (
    (CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN wp.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN ba.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN md.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN eq.id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END) * 100 / 7
  ) AS completion_percentage

FROM practice_members pm
JOIN practices p ON pm.practice_id = p.id
LEFT JOIN learning_preferences lp ON pm.id = lp.practice_member_id
LEFT JOIN personality_assessments pa ON pm.id = pa.practice_member_id
LEFT JOIN working_preferences wp ON pm.id = wp.practice_member_id
LEFT JOIN belbin_assessments ba ON pm.id = ba.practice_member_id
LEFT JOIN motivational_drivers md ON pm.id = md.practice_member_id
LEFT JOIN eq_assessments eq ON pm.id = eq.practice_member_id
LEFT JOIN conflict_style_assessments cs ON pm.id = cs.practice_member_id

WHERE pm.is_active = TRUE
ORDER BY pm.name;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON working_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON belbin_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON motivational_drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON eq_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conflict_style_assessments TO authenticated;
GRANT SELECT ON team_comprehensive_assessments TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Comprehensive Assessment System database schema created successfully!';
  RAISE NOTICE '   - Working Preferences table created';
  RAISE NOTICE '   - Belbin Team Roles table created';
  RAISE NOTICE '   - Motivational Drivers table created';
  RAISE NOTICE '   - Emotional Intelligence table created';
  RAISE NOTICE '   - Conflict Style table created';
  RAISE NOTICE '   - All RLS policies configured';
  RAISE NOTICE '   - Team comprehensive assessments view created';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total assessment types now available: 7';
  RAISE NOTICE '   1. VARK Learning Styles (already existed)';
  RAISE NOTICE '   2. OCEAN Personality (already existed)';
  RAISE NOTICE '   3. Working Preferences (NEW)';
  RAISE NOTICE '   4. Belbin Team Roles (NEW)';
  RAISE NOTICE '   5. Motivational Drivers (NEW)';
  RAISE NOTICE '   6. Emotional Intelligence (NEW)';
  RAISE NOTICE '   7. Conflict Style (NEW)';
END $$;

