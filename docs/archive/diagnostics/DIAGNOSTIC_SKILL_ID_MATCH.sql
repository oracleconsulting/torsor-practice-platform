-- Diagnostic: Check if skill IDs match between invitations and skills table

-- 1. Get Luke's skill IDs from invitations
SELECT 
  'Luke Assessment Skill IDs' as source,
  jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
FROM invitations
WHERE email ILIKE 'ltyrrell@rpgcc.co.uk'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND status = 'accepted'
LIMIT 10;

-- 2. Get current skill IDs from skills table
SELECT 
  'Skills Table' as source,
  id as skill_id,
  name,
  category
FROM skills
LIMIT 10;

-- 3. Check for matches
WITH luke_skills AS (
  SELECT DISTINCT
    jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE 'ltyrrell@rpgcc.co.uk'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
    AND status = 'accepted'
)
SELECT 
  COUNT(*) as total_luke_skills,
  COUNT(s.id) as matching_skills,
  COUNT(*) - COUNT(s.id) as missing_skills
FROM luke_skills ls
LEFT JOIN skills s ON s.id::text = ls.skill_id;

-- 4. Show which specific skill IDs are missing
WITH luke_skills AS (
  SELECT DISTINCT
    jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE 'ltyrrell@rpgcc.co.uk'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
    AND status = 'accepted'
  LIMIT 5
)
SELECT 
  ls.skill_id as luke_skill_id,
  s.id as skills_table_id,
  s.name as skill_name,
  CASE WHEN s.id IS NULL THEN 'MISSING' ELSE 'FOUND' END as status
FROM luke_skills ls
LEFT JOIN skills s ON s.id::text = ls.skill_id;

