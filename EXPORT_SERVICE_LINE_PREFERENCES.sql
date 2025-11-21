-- =====================================================
-- SERVICE LINE PREFERENCES FOR EACH TEAM MEMBER
-- =====================================================

SELECT 
  pm.name as member_name,
  pm.email,
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


