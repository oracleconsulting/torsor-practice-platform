-- ============================================================================
-- STEP 2: ADD TRIGGERS, RLS POLICIES, AND VIEWS
-- Run this AFTER Step 1 (creating tables)
-- ============================================================================

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

DROP TRIGGER IF EXISTS trigger_working_preferences_updated_at ON working_preferences;
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

DROP TRIGGER IF EXISTS trigger_belbin_updated_at ON belbin_assessments;
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

DROP TRIGGER IF EXISTS trigger_motivational_drivers_updated_at ON motivational_drivers;
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

DROP TRIGGER IF EXISTS trigger_eq_updated_at ON eq_assessments;
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

DROP TRIGGER IF EXISTS trigger_conflict_style_updated_at ON conflict_style_assessments;
CREATE TRIGGER trigger_conflict_style_updated_at
  BEFORE UPDATE ON conflict_style_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_conflict_style_updated_at();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE working_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE belbin_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivational_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE eq_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_style_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: WORKING PREFERENCES
-- ============================================================================

DROP POLICY IF EXISTS working_prefs_member_view ON working_preferences;
CREATE POLICY working_prefs_member_view ON working_preferences
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS working_prefs_admin_view ON working_preferences;
CREATE POLICY working_prefs_admin_view ON working_preferences
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

DROP POLICY IF EXISTS working_prefs_member_manage ON working_preferences;
CREATE POLICY working_prefs_member_manage ON working_preferences
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: BELBIN ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS belbin_member_view ON belbin_assessments;
CREATE POLICY belbin_member_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS belbin_admin_view ON belbin_assessments;
CREATE POLICY belbin_admin_view ON belbin_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

DROP POLICY IF EXISTS belbin_member_manage ON belbin_assessments;
CREATE POLICY belbin_member_manage ON belbin_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: MOTIVATIONAL DRIVERS
-- ============================================================================

DROP POLICY IF EXISTS motiv_member_view ON motivational_drivers;
CREATE POLICY motiv_member_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS motiv_admin_view ON motivational_drivers;
CREATE POLICY motiv_admin_view ON motivational_drivers
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

DROP POLICY IF EXISTS motiv_member_manage ON motivational_drivers;
CREATE POLICY motiv_member_manage ON motivational_drivers
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: EQ ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS eq_member_view ON eq_assessments;
CREATE POLICY eq_member_view ON eq_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS eq_admin_view ON eq_assessments;
CREATE POLICY eq_admin_view ON eq_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

DROP POLICY IF EXISTS eq_member_manage ON eq_assessments;
CREATE POLICY eq_member_manage ON eq_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: CONFLICT STYLE ASSESSMENTS
-- ============================================================================

DROP POLICY IF EXISTS conflict_member_view ON conflict_style_assessments;
CREATE POLICY conflict_member_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS conflict_admin_view ON conflict_style_assessments;
CREATE POLICY conflict_admin_view ON conflict_style_assessments
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() 
        AND permission_role IN ('partner', 'admin')
    )
  );

DROP POLICY IF EXISTS conflict_member_manage ON conflict_style_assessments;
CREATE POLICY conflict_member_manage ON conflict_style_assessments
  FOR ALL
  USING (
    practice_member_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPREHENSIVE ASSESSMENT VIEW
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
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
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
  RAISE NOTICE '✅ STEP 2 COMPLETE: Triggers, RLS, and Views configured!';
  RAISE NOTICE '   - 5 auto-update triggers added ✓';
  RAISE NOTICE '   - 15 RLS policies created (3 per table) ✓';
  RAISE NOTICE '   - team_comprehensive_assessments view created ✓';
  RAISE NOTICE '   - Permissions granted to authenticated users ✓';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '   Total assessment types available: 7';
  RAISE NOTICE '   - VARK (existing)';
  RAISE NOTICE '   - OCEAN (existing)';
  RAISE NOTICE '   - Working Preferences (NEW)';
  RAISE NOTICE '   - Belbin Team Roles (NEW)';
  RAISE NOTICE '   - Motivational Drivers (NEW)';
  RAISE NOTICE '   - Emotional Intelligence (NEW)';
  RAISE NOTICE '   - Conflict Style (NEW)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT: Build UI components to take assessments!';
END $$;

