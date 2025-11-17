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
  pm.seniority_level,
  pm.years_experience,
  pm.department,
  pm.is_test_account,
  pm.created_at as member_since,
  
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
  ba.tertiary_role as belbin_tertiary,
  ba.primary_score as belbin_primary_score,
  ba.secondary_score as belbin_secondary_score,
  ba.raw_scores as belbin_all_scores,
  ba.completed_at as belbin_completed,
  
  -- Emotional Intelligence
  eq.self_awareness_score,
  eq.self_regulation_score,
  eq.motivation_score as eq_motivation,
  eq.empathy_score,
  eq.social_skills_score,
  eq.overall_eq_score,
  eq.completed_at as eq_completed,
  
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
  wp.preferred_work_environment,
  wp.preferred_work_hours,
  wp.collaboration_preference,
  wp.communication_preference,
  wp.decision_making_style,
  wp.pace_preference,
  wp.structure_preference,
  wp.feedback_preference,
  wp.completed_at as working_prefs_completed,
  
  -- Conflict Style
  cs.primary_style as conflict_primary,
  cs.secondary_style as conflict_secondary,
  cs.competing_score,
  cs.collaborating_score,
  cs.compromising_score,
  cs.avoiding_score,
  cs.accommodating_score,
  cs.completed_at as conflict_completed,
  
  -- Motivational Drivers
  md.achievement_score,
  md.affiliation_score,
  md.power_score,
  md.autonomy_score,
  md.security_score,
  md.recognition_score,
  md.dominant_driver,
  md.secondary_driver,
  md.completed_at as motivational_completed,
  
  -- Individual Profile Insights
  ip.advisory_score,
  ip.technical_score,
  ip.leadership_score,
  ip.role_fit_score,
  ip.strengths,
  ip.development_areas,
  ip.training_priorities,
  ip.career_trajectory,
  ip.recommended_roles,
  ip.calculated_at as profile_calculated,
  
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
  (SELECT SUM(hours_claimed) FROM cpd_activities WHERE practice_member_id = pm.id AND status = 'completed' AND activity_date >= DATE_TRUNC('year', CURRENT_DATE)) as cpd_hours_this_year,
  
  -- Skills Summary
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skills_assessed_count,
  (SELECT AVG(self_rating) FROM skill_assessments WHERE team_member_id = pm.id) as avg_self_rating,
  (SELECT AVG(current_level) FROM skill_assessments WHERE team_member_id = pm.id) as avg_current_level,
  (SELECT AVG(target_level) FROM skill_assessments WHERE team_member_id = pm.id) as avg_target_level,
  (SELECT AVG(target_level - current_level) FROM skill_assessments WHERE team_member_id = pm.id AND current_level IS NOT NULL) as avg_skill_gap

FROM practice_members pm

-- Join all assessment tables
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
LEFT JOIN belbin_assessments ba ON pm.id = ba.team_member_id
LEFT JOIN eq_assessments eq ON pm.id = eq.team_member_id
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
LEFT JOIN working_preferences wp ON pm.id = wp.team_member_id
LEFT JOIN conflict_style_assessments cs ON pm.id = cs.team_member_id
LEFT JOIN motivational_drivers md ON pm.id = md.team_member_id
LEFT JOIN individual_profiles ip ON pm.id = ip.member_id
LEFT JOIN assessment_insights ai ON pm.id = ai.member_id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name;


-- =====================================================
-- DETAILED SKILLS BREAKDOWN PER MEMBER
-- =====================================================

SELECT 
  pm.name as member_name,
  s.skill_name,
  s.category,
  s.skill_level as skill_difficulty,
  sa.self_rating,
  sa.current_level,
  sa.target_level,
  (sa.target_level - COALESCE(sa.current_level, sa.self_rating)) as skill_gap,
  sa.last_used_date,
  sa.proficiency_notes,
  sa.updated_at as last_assessed

FROM practice_members pm
JOIN skill_assessments sa ON pm.id = sa.team_member_id
JOIN skills s ON sa.skill_id = s.id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name, s.category, s.skill_name;


-- =====================================================
-- SERVICE LINE INTERESTS PER MEMBER
-- =====================================================

SELECT 
  pm.name as member_name,
  sl.name as service_line,
  sl.category,
  sli.interest_level,
  sli.experience_level,
  sli.willing_to_lead,
  sli.notes,
  sli.updated_at

FROM practice_members pm
JOIN service_line_interests sli ON pm.id = sli.team_member_id
JOIN service_lines sl ON sli.service_line_id = sl.id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name, sl.name;


-- =====================================================
-- ROLE ASSIGNMENTS & FIT SCORES
-- =====================================================

SELECT 
  pm.name as member_name,
  rd.role_title,
  rd.seniority_level as role_seniority,
  rd.core_responsibilities,
  rd.required_competencies,
  ra.fit_score,
  ra.gap_analysis,
  ra.development_recommendations,
  ra.assigned_at,
  ra.auto_assigned

FROM practice_members pm
JOIN role_assignments ra ON pm.id = ra.member_id
JOIN role_definitions rd ON ra.role_definition_id = rd.id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name;


-- =====================================================
-- MENTORING RELATIONSHIPS
-- =====================================================

SELECT 
  mentor.name as mentor_name,
  mentee.name as mentee_name,
  mr.status,
  mr.focus_areas,
  mr.goals,
  mr.start_date,
  mr.end_date,
  mr.session_frequency,
  (SELECT COUNT(*) FROM mentoring_sessions WHERE relationship_id = mr.id) as sessions_completed

FROM mentoring_relationships mr
JOIN practice_members mentor ON mr.mentor_id = mentor.id
JOIN practice_members mentee ON mr.mentee_id = mentee.id

WHERE mr.status IN ('active', 'pending')

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

