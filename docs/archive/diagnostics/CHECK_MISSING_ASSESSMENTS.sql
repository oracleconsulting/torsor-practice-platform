-- Check assessment completion for the 6 "unassessed" members
SELECT 
  pm.name,
  pm.email,
  pm.role as system_role,
  
  -- Check which assessments are actually completed
  CASE WHEN pa.id IS NOT NULL THEN '✓' ELSE '✗' END as ocean_done,
  CASE WHEN ba.id IS NOT NULL THEN '✓' ELSE '✗' END as belbin_done,
  CASE WHEN eq.id IS NOT NULL THEN '✓' ELSE '✗' END as eq_done,
  CASE WHEN lp.id IS NOT NULL THEN '✓' ELSE '✗' END as vark_done,
  CASE WHEN wp.id IS NOT NULL THEN '✓' ELSE '✗' END as working_prefs_done,
  CASE WHEN cs.id IS NOT NULL THEN '✓' ELSE '✗' END as conflict_done,
  CASE WHEN md.id IS NOT NULL THEN '✓' ELSE '✗' END as motivational_done,
  
  -- Count assessments completed
  (CASE WHEN pa.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN ba.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN eq.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN wp.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN md.id IS NOT NULL THEN 1 ELSE 0 END) as assessments_completed,
  
  -- Service line preferences
  (SELECT COUNT(*) FROM service_line_interests WHERE practice_member_id = pm.id) as service_line_prefs_count

FROM practice_members pm
LEFT JOIN personality_assessments pa ON pm.id = pa.team_member_id
LEFT JOIN belbin_assessments ba ON pm.id = ba.practice_member_id
LEFT JOIN eq_assessments eq ON pm.id = eq.practice_member_id
LEFT JOIN learning_preferences lp ON pm.id = lp.team_member_id
LEFT JOIN working_preferences wp ON pm.id = wp.practice_member_id
LEFT JOIN conflict_style_assessments cs ON pm.id = cs.practice_member_id
LEFT JOIN motivational_drivers md ON pm.id = md.practice_member_id

WHERE pm.name IN (
  'Jaanu Anandeswaran',
  'Shari Baird-Caesar',
  'Luke Tyrrell',
  'MEdirisinghe@rpgcc.co.uk',
  'Jack Attersall',
  'Tanya Okorji'
)
AND pm.is_active = TRUE

ORDER BY assessments_completed DESC, pm.name;

