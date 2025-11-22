-- =============================================
-- UNIFIED MEMBER ASSESSMENT VIEW
-- Centralizes all assessment data in one place
-- =============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_member_assessment_overview CASCADE;

-- Create comprehensive assessment overview
CREATE VIEW v_member_assessment_overview AS
SELECT 
  -- Member Info
  pm.id as member_id,
  pm.name,
  pm.role,
  pm.email,
  pm.practice_id,
  
  -- VARK Learning Style
  lp.primary_style as vark_style,
  lp.visual_score,
  lp.auditory_score,
  lp.reading_score,
  lp.kinesthetic_score,
  lp.id IS NOT NULL as vark_complete,
  lp.completed_at as vark_completed_at,
  
  -- OCEAN Personality
  pa.openness,
  pa.conscientiousness,
  pa.extraversion,
  pa.agreeableness,
  pa.neuroticism,
  pa.id IS NOT NULL as ocean_complete,
  pa.completed_at as ocean_completed_at,
  
  -- Belbin Team Roles
  ba.primary_role as belbin_primary,
  ba.secondary_role as belbin_secondary,
  ba.id IS NOT NULL as belbin_complete,
  ba.completed_at as belbin_completed_at,
  
  -- Emotional Intelligence
  eq.overall_eq,
  eq.eq_level,
  eq.self_awareness_score,
  eq.self_management_score,
  eq.social_awareness_score,
  eq.relationship_management_score,
  eq.id IS NOT NULL as eq_complete,
  eq.completed_at as eq_completed_at,
  
  -- Motivational Drivers
  md.primary_driver,
  md.achievement_score,
  md.affiliation_score,
  md.autonomy_score,
  md.influence_score,
  md.id IS NOT NULL as motivational_complete,
  md.completed_at as motivational_completed_at,
  
  -- Conflict Style
  cs.primary_style as conflict_style,
  cs.competing_score,
  cs.collaborating_score,
  cs.compromising_score,
  cs.avoiding_score,
  cs.accommodating_score,
  cs.id IS NOT NULL as conflict_complete,
  cs.completed_at as conflict_completed_at,
  
  -- Working Preferences
  wp.communication_style,
  wp.work_style,
  wp.environment as work_environment,
  wp.id IS NOT NULL as working_prefs_complete,
  wp.completed_at as working_prefs_completed_at,
  
  -- Overall Completion Metrics
  (
    CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN ba.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN eq.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN md.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN wp.id IS NOT NULL THEN 1 ELSE 0 END
  ) as assessments_completed,
  
  ROUND(
    (
      CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN ba.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN eq.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN md.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN wp.id IS NOT NULL THEN 1 ELSE 0 END
    )::numeric / 7 * 100
  ) as completion_percentage

FROM practice_members pm
LEFT JOIN learning_preferences lp ON lp.team_member_id = pm.id
LEFT JOIN personality_assessments pa ON pa.team_member_id = pm.id
LEFT JOIN belbin_assessments ba ON ba.practice_member_id = pm.id
LEFT JOIN eq_assessments eq ON eq.practice_member_id = pm.id
LEFT JOIN motivational_drivers md ON md.practice_member_id = pm.id
LEFT JOIN conflict_style_assessments cs ON cs.practice_member_id = pm.id
LEFT JOIN working_preferences wp ON wp.practice_member_id = pm.id
WHERE 
  pm.is_active = TRUE 
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)
ORDER BY pm.name;

-- Grant access
GRANT SELECT ON v_member_assessment_overview TO authenticated;

-- Add comment
COMMENT ON VIEW v_member_assessment_overview IS 
'Unified view of all team member assessments. Simplifies data access by joining all assessment tables.';

