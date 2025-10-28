-- ==============================================================
-- DIAGNOSTIC: Check why heatmap shows zeros for specific people
-- ==============================================================

-- 1. Check if these people exist in practice_members
SELECT 
  id,
  name,
  email,
  role,
  active
FROM practice_members
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND email IN (
    'AFarman@rpgcc.co.uk',
    'JAttersall@rpgcc.co.uk',
    'LZavros@rpgcc.co.uk',
    'LAllagapen@rpgcc.co.uk',
    'MEdirisinghe@rpgcc.co.uk',
    'rizwanp@rpgcc.co.uk',
    'SBairdCaesar@rpgcc.co.uk'
  )
ORDER BY name;

-- 2. Check their skill assessments
SELECT 
  pm.name,
  pm.email,
  COUNT(sa.id) as skill_count,
  ROUND(AVG(sa.current_level), 1) as avg_level,
  MIN(sa.current_level) as min_level,
  MAX(sa.current_level) as max_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.email IN (
    'AFarman@rpgcc.co.uk',
    'JAttersall@rpgcc.co.uk',
    'LZavros@rpgcc.co.uk',
    'LAllagapen@rpgcc.co.uk',
    'MEdirisinghe@rpgcc.co.uk',
    'rizwanp@rpgcc.co.uk',
    'SBairdCaesar@rpgcc.co.uk'
  )
GROUP BY pm.id, pm.name, pm.email
ORDER BY pm.name;

-- 3. Sample skills for one person showing zeros (Jack Attersall)
SELECT 
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.interest_level,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
WHERE sa.team_member_id = (
  SELECT id FROM practice_members 
  WHERE email = 'JAttersall@rpgcc.co.uk'
  AND practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
)
ORDER BY s.category, s.name
LIMIT 10;

-- 4. Check RLS policies on skill_assessments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'skill_assessments';

-- 5. Check if active column is causing issues
SELECT 
  pm.name,
  pm.email,
  pm.active,
  COUNT(sa.id) as skill_count
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY pm.id, pm.name, pm.email, pm.active
HAVING COUNT(sa.id) = 0
ORDER BY pm.name;

