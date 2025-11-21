-- Check if Jaanu's data was properly remapped

-- 1. Check Jaanu's invitation record
SELECT 
  email,
  jsonb_array_length(assessment_data) as skill_count,
  assessment_data->0->>'skill_id' as first_skill_id,
  assessment_data->0->>'current_level' as first_level,
  assessment_data->1->>'skill_id' as second_skill_id
FROM invitations
WHERE email ILIKE '%jaanu%'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND status = 'accepted';

-- 2. Verify Jaanu's skill IDs match Laura's (they should after remapping)
WITH jaanu_skills AS (
  SELECT jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE '%jaanu%' 
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  LIMIT 5
),
laura_skills AS (
  SELECT jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE '%lpond%'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  LIMIT 5
)
SELECT 
  j.skill_id as jaanu_skill_id,
  l.skill_id as laura_skill_id,
  s.name as skill_name,
  CASE WHEN s.id IS NULL THEN 'MISSING ❌' ELSE 'FOUND ✅' END as status
FROM jaanu_skills j
FULL OUTER JOIN laura_skills l ON j.skill_id = l.skill_id
LEFT JOIN skills s ON s.id::text = COALESCE(j.skill_id, l.skill_id);

-- 3. Check practice_members for Jaanu
SELECT id, name, email, role
FROM practice_members
WHERE email ILIKE '%jaanu%'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';

