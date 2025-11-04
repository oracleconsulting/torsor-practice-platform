-- =====================================================
-- VERIFY LUKE'S SKILLS ASSESSMENTS ARE STILL THERE
-- =====================================================

-- Check Luke's practice member ID
SELECT 
  pm.id as member_id,
  pm.name,
  pm.email,
  pm.user_id,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skill_count
FROM practice_members pm
WHERE pm.email = 'ltyrrell@rpgcc.co.uk';

-- Show sample of Luke's skills
SELECT 
  sa.id,
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.target_level,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
JOIN practice_members pm ON pm.id = sa.team_member_id
WHERE pm.email = 'ltyrrell@rpgcc.co.uk'
ORDER BY s.name
LIMIT 10;

-- Count by category
SELECT 
  s.category,
  COUNT(*) as skills_in_category
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
JOIN practice_members pm ON pm.id = sa.team_member_id
WHERE pm.email = 'ltyrrell@rpgcc.co.uk'
GROUP BY s.category
ORDER BY s.category;

