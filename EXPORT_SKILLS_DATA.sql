-- =====================================================
-- SKILLS ASSESSMENT DATA FOR EACH TEAM MEMBER
-- =====================================================

SELECT 
  pm.name as member_name,
  pm.email,
  s.name as skill_name,
  s.category as skill_category,
  s.service_line,
  s.required_level,
  sa.current_level,
  (s.required_level - COALESCE(sa.current_level, 0)) as skill_gap,
  sa.created_at as first_assessed,
  sa.updated_at as last_updated

FROM practice_members pm
JOIN skill_assessments sa ON pm.id = sa.team_member_id
JOIN skills s ON sa.skill_id = s.id

WHERE pm.is_active = TRUE
  AND (pm.is_test_account IS NULL OR pm.is_test_account = FALSE)

ORDER BY pm.name, s.category, s.name;


