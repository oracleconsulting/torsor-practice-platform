-- =====================================================
-- COMPREHENSIVE TEAM ASSESSMENT DATA EXPORT
-- Extracts ALL assessment data for every team member
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
  
  -- Individual Profile Insights (if table exists)
  -- ip.advisory_score,
  -- ip.technical_score,
  -- ip.leadership_score,
  -- ip.role_fit_score,
  -- ip.strengths,
  -- ip.development_areas,
  -- ip.training_priorities,
  -- ip.career_trajectory,
  -- ip.recommended_roles,
  -- ip.calculated_at as profile_calculated,
  
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
  (SELECT SUM(hours_claimed) FROM cpd_activities WHERE practice_member_id = pm.id AND status = 'completed') as cpd_hours_total,
  (SELECT SUM(hours_claimed) FROM cpd_activities WHERE practice_member_id = pm.id AND status = 'completed' AND activity_date >= DATE_TRUNC('year', CURRENT_DATE)) as cpd_hours_this_year
  
  -- Skills Summary (commented out - need to check skill_assessments table structure)
  -- (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skills_assessed_count,
  -- (SELECT AVG(self_rating) FROM skill_assessments WHERE team_member_id = pm.id) as avg_self_rating,
  -- (SELECT AVG(current_level) FROM skill_assessments WHERE team_member_id = pm.id) as avg_current_level,
  -- (SELECT AVG(target_level) FROM skill_assessments WHERE team_member_id = pm.id) as avg_target_level,
  -- (SELECT AVG(target_level - current_level) FROM skill_assessments WHERE team_member_id = pm.id AND current_level IS NOT NULL) as avg_skill_gap

FROM practice_members pm

-- Join all assessment tables (note: inconsistent column naming across tables)
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
LEFT JOIN belbin_assessments ba ON pm.id = ba.practice_member_id
LEFT JOIN eq_assessments eq ON pm.id = eq.practice_member_id
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
LEFT JOIN working_preferences wp ON pm.id = wp.practice_member_id
LEFT JOIN conflict_style_assessments cs ON pm.id = cs.practice_member_id
LEFT JOIN motivational_drivers md ON pm.id = md.practice_member_id
-- LEFT JOIN individual_assessment_profiles iap ON pm.id = iap.member_id  -- Check column name
LEFT JOIN assessment_insights ai ON pm.id = ai.member_id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name;


-- =====================================================
-- SERVICE LINE INTERESTS PER MEMBER
-- =====================================================

SELECT 
  pm.name as member_name,
  sli.service_line,
  sli.interest_rank,
  sli.current_experience_level,
  sli.desired_involvement_pct,
  sli.notes,
  sli.created_at as first_recorded,
  sli.updated_at as last_updated

FROM practice_members pm
JOIN service_line_interests sli ON pm.id = sli.practice_member_id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name, sli.interest_rank;


-- =====================================================
-- ROLE DEFINITIONS THAT TEAM MEMBERS ARE SUITED FOR
-- (Based on role_definitions table - no assignments table exists yet)
-- =====================================================
-- Note: This query shows what roles exist and their requirements.
-- Individual role-fit analysis is in assessment_insights (Query #1)

SELECT 
  rd.role_title,
  rd.role_category,
  rd.seniority_level,
  rd.department,
  rd.description,
  rd.key_responsibilities,
  rd.client_facing,
  rd.required_belbin_roles,
  rd.min_eq_self_awareness,
  rd.min_eq_self_management,
  rd.min_eq_social_awareness,
  rd.min_eq_relationship_management,
  rd.required_achievement,
  rd.required_affiliation,
  rd.required_autonomy,
  rd.required_influence,
  rd.preferred_communication_style,
  rd.preferred_work_environment,
  rd.preferred_conflict_styles,
  rd.training_delivery_preference,
  rd.is_active

FROM role_definitions rd

WHERE rd.is_active = TRUE

ORDER BY rd.seniority_level, rd.role_title;


-- =====================================================
-- MENTORING RELATIONSHIPS
-- =====================================================

SELECT 
  mentor.name as mentor_name,
  mentee.name as mentee_name,
  mr.status,
  mr.matched_skills,
  mr.match_score,
  mr.vark_compatibility,
  mr.agreement_signed,
  mr.agreement_signed_at,
  mr.start_date,
  mr.end_date,
  mr.expected_duration_months,
  mr.primary_goals,
  mr.success_criteria,
  mr.reminder_frequency,
  mr.last_reminder_sent,
  mr.created_at,
  (SELECT COUNT(*) FROM mentoring_sessions WHERE relationship_id = mr.id) as sessions_completed

FROM mentoring_relationships mr
JOIN practice_members mentor ON mr.mentor_id = mentor.id
JOIN practice_members mentee ON mr.mentee_id = mentee.id

WHERE mr.status IN ('active', 'pending', 'matched')

ORDER BY mentor.name, mentee.name;


-- =====================================================
-- REPORTING LINES
-- =====================================================

SELECT 
  member.name as member_name,
  manager.name as reports_to,
  rl.relationship_type,
  rl.effective_from

FROM practice_members member
JOIN reporting_lines rl ON member.id = rl.member_id
JOIN practice_members manager ON rl.reports_to_id = manager.id

WHERE member.is_active = TRUE

ORDER BY manager.name, member.name;
*/

