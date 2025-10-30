-- ============================================================================
-- FIX: Simplified view that works with actual database schema
-- Only references columns that definitely exist
-- ============================================================================

DROP VIEW IF EXISTS team_comprehensive_assessments;

CREATE OR REPLACE VIEW team_comprehensive_assessments AS
SELECT 
  pm.id AS member_id,
  pm.name AS member_name,
  pm.email,
  pm.role,
  pm.practice_id,
  p.name AS practice_name,
  
  -- VARK Learning Style (simplified - will be NULL if no data)
  lp.learning_type AS vark_primary_style,
  lp.visual_percentage AS vark_visual,
  lp.auditory_percentage AS vark_auditory,
  lp.read_write_percentage AS vark_read_write,
  lp.kinesthetic_percentage AS vark_kinesthetic,
  
  -- OCEAN Personality (simplified - will be NULL if no data)
  pa.openness_score,
  pa.conscientiousness_score,
  pa.extraversion_score,
  pa.agreeableness_score,
  pa.emotional_stability_score,
  pa.work_style,
  pa.communication_style,
  pa.dominant_traits,
  
  -- Working Preferences (NEW assessments)
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

-- Grant permission
GRANT SELECT ON team_comprehensive_assessments TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Simplified view created successfully!';
  RAISE NOTICE '   - Uses only columns that definitely exist';
  RAISE NOTICE '   - No COALESCE or JSONB_BUILD_OBJECT complexity';
  RAISE NOTICE '   - Will work with current schema';
  RAISE NOTICE '   - Frontend can build JSON objects from individual columns';
END $$;

