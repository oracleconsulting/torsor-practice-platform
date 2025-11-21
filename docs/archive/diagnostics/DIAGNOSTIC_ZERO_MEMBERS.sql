-- ==============================================================
-- DIAGNOSTIC: Check why 7 specific people show zeros in heatmap
-- ==============================================================

-- 1. Verify these 7 people exist and have the correct IDs
SELECT 
  id,
  name,
  email,
  role,
  is_active
FROM practice_members
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND name IN (
    'Azalia Farman',
    'Jack Attersall',
    'Lambros Zavros',
    'Lynley Allagapen',
    'MEdirisinghe@rpgcc.co.uk',
    'Rizwan Paderwala',
    'Shari Baird-Caesar'
  )
ORDER BY name;

-- 2. Check their skill assessments
SELECT 
  pm.name,
  pm.id as member_id,
  COUNT(sa.id) as assessment_count,
  ROUND(AVG(sa.current_level), 1) as avg_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.name IN (
    'Azalia Farman',
    'Jack Attersall',
    'Lambros Zavros',
    'Lynley Allagapen',
    'MEdirisinghe@rpgcc.co.uk',
    'Rizwan Paderwala',
    'Shari Baird-Caesar'
  )
GROUP BY pm.id, pm.name
ORDER BY pm.name;

-- 3. Sample one person's assessments to see if data exists
SELECT 
  sa.skill_id,
  s.name as skill_name,
  sa.current_level,
  sa.interest_level
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
WHERE sa.team_member_id = (
  SELECT id FROM practice_members 
  WHERE name = 'Jack Attersall'
  AND practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
)
LIMIT 5;

-- 4. Compare member IDs between the 7 with zeros vs 9 with data
-- First, get all members with their assessment counts
SELECT 
  pm.id,
  pm.name,
  pm.email,
  COUNT(sa.id) as assessment_count,
  CASE 
    WHEN pm.name IN ('Azalia Farman', 'Jack Attersall', 'Lambros Zavros', 
                     'Lynley Allagapen', 'MEdirisinghe@rpgcc.co.uk', 
                     'Rizwan Paderwala', 'Shari Baird-Caesar') 
    THEN 'SHOWS_ZEROS'
    ELSE 'SHOWS_DATA'
  END as heatmap_status
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY pm.id, pm.name, pm.email
ORDER BY heatmap_status, pm.name;

