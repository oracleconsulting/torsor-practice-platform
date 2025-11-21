-- Check if skills table has ANY data and whether it has practice_id column

-- 1. Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skills' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Count total skills
SELECT COUNT(*) as total_skills FROM skills;

-- 3. Sample some skills
SELECT id, name, category 
FROM skills 
LIMIT 10;

-- 4. Check if Laura's skills exist
WITH laura_skills AS (
  SELECT DISTINCT
    jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE 'lpond@rpgcc.co.uk'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
    AND status = 'accepted'
  LIMIT 5
)
SELECT 
  ls.skill_id,
  s.id as skills_table_id,
  s.name,
  CASE WHEN s.id IS NULL THEN 'MISSING' ELSE 'FOUND' END as status
FROM laura_skills ls
LEFT JOIN skills s ON s.id::text = ls.skill_id;

