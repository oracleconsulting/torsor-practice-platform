-- =====================================================
-- COMPREHENSIVE TEAM ASSESSMENT DATA EXPORT
-- Query #1: ALL ASSESSMENTS FOR ALL TEAM MEMBERS
-- =====================================================

-- Main member data with all assessments
SELECT 
  pm.id as member_id,
  pm.name,
  pm.email,
  pm.role as system_role,
  pm.permission_role,
  pm.is_mentor,
  pm.mentor_capacity,
  pm.reporting_to,
  pm.reports_to_id,
  pm.is_test_account,
  pm.is_active,
  pm.onboarding_completed,
  pm.created_at as member_since,
  pm.invited_at,
  pm.joined_at,
  pm.last_login_at,
  pm.login_count,
  
  -- CPD tracking
  pm.cpd_completed_hours,
  pm.cpd_determined_completed,
  pm.cpd_self_allocated_completed,
  pm.cpd_year_start_date,
  pm.cpd_exempt,
  
  -- VARK Quick Info
  pm.vark_assessment_completed,
  pm.vark_completed_at,
  pm.learning_style,
  
  -- OCEAN Personality Scores
  pa.openness_score,
  pa.conscientiousness_score,
  pa.extraversion_score,
  pa.agreeableness_score,
  pa.neuroticism_score,
  pa.emotional_stability_score,
  pa.dominant_traits,
  pa.work_style as ocean_work_style,
  pa.communication_style as ocean_communication_style,
  pa.stress_response,
  pa.completed_at as ocean_completed,
  
  -- Belbin Team Roles
  ba.primary_role as belbin_primary,
  ba.secondary_role as belbin_secondary,
  ba.role_scores as belbin_role_scores,
  ba.domain_scores as belbin_domain_scores,
  ba.strengths as belbin_strengths,
  ba.allowable_weaknesses as belbin_weaknesses,
  ba.ideal_team_contributions as belbin_contributions,
  ba.summary as belbin_summary,
  ba.assessed_at as belbin_completed,
  
  -- Emotional Intelligence
  eq.self_awareness_score,
  eq.self_management_score,
  eq.social_awareness_score,
  eq.relationship_management_score,
  eq.overall_eq,
  eq.eq_level,
  eq.strengths as eq_strengths,
  eq.development_areas as eq_development_areas,
  eq.workplace_implications as eq_workplace_implications,
  eq.growth_recommendations as eq_growth_recommendations,
  eq.summary as eq_summary,
  eq.assessed_at as eq_completed,
  
  -- VARK Learning Styles
  lp.visual_score,
  lp.auditory_score,
  lp.read_write_score,
  lp.kinesthetic_score,
  lp.visual_percentage,
  lp.auditory_percentage,
  lp.read_write_percentage,
  lp.kinesthetic_percentage,
  lp.learning_type,
  lp.dominant_styles,
  lp.assessment_date as vark_completed,
  
  -- Working Preferences
  wp.communication_style as working_communication_style,
  wp.work_style,
  wp.environment as working_environment,
  wp.feedback_preference,
  wp.collaboration_preference,
  wp.time_management,
  wp.preferences_data,
  wp.summary as working_prefs_summary,
  wp.assessed_at as working_prefs_completed,
  
  -- Conflict Style
  cs.primary_style as conflict_primary,
  cs.secondary_style as conflict_secondary,
  cs.style_scores as conflict_style_scores,
  cs.assertiveness_level,
  cs.cooperativeness_level,
  cs.flexibility_score,
  cs.when_effective,
  cs.when_ineffective,
  cs.growth_recommendations as conflict_growth_recommendations,
  cs.summary as conflict_summary,
  cs.assessed_at as conflict_completed,
  
  -- Motivational Drivers
  md.primary_driver,
  md.secondary_driver,
  md.driver_scores,
  md.motivation_intensity,
  md.what_motivates,
  md.what_demotivates,
  md.ideal_role_characteristics,
  md.retention_risks,
  md.summary as motivational_summary,
  md.assessed_at as motivational_completed,
  
  -- Assessment Insights
  ai.assigned_role_type,
  ai.advisory_suitability_score,
  ai.technical_suitability_score,
  ai.hybrid_suitability_score,
  ai.leadership_readiness_score,
  ai.overall_role_fit_score,
  ai.red_flags,
  ai.warning_flags,
  ai.development_priorities,
  ai.training_level,
  ai.calculated_at as insights_calculated,
  
  -- CPD Summary
  (SELECT COUNT(*) FROM cpd_activities WHERE practice_member_id = pm.id) as cpd_activities_count,
  (SELECT SUM(hours_claimed) FROM cpd_activities cpd1 WHERE cpd1.practice_member_id = pm.id AND cpd1.status = 'completed') as cpd_hours_total,
  (SELECT SUM(hours_claimed) FROM cpd_activities cpd2 WHERE cpd2.practice_member_id = pm.id AND cpd2.status = 'completed' AND cpd2.activity_date >= DATE_TRUNC('year', CURRENT_DATE)) as cpd_hours_this_year

FROM practice_members pm

LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
LEFT JOIN belbin_assessments ba ON pm.id = ba.practice_member_id
LEFT JOIN eq_assessments eq ON pm.id = eq.practice_member_id
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
LEFT JOIN working_preferences wp ON pm.id = wp.practice_member_id
LEFT JOIN conflict_style_assessments cs ON pm.id = cs.practice_member_id
LEFT JOIN motivational_drivers md ON pm.id = md.practice_member_id
LEFT JOIN assessment_insights ai ON pm.id = ai.member_id

WHERE pm.is_active
  AND (pm.is_test_account IS NULL OR NOT pm.is_test_account)

ORDER BY pm.name ASC;
