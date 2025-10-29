-- Check if Jaanu's skill IDs match Laura's (to confirm remapping worked)
WITH jaanu_first_5 AS (
  SELECT 
    email,
    jsonb_array_length(assessment_data) as total_skills,
    (assessment_data->0)->>'skill_id' as skill_0,
    (assessment_data->1)->>'skill_id' as skill_1,
    (assessment_data->2)->>'skill_id' as skill_2,
    (assessment_data->3)->>'skill_id' as skill_3,
    (assessment_data->4)->>'skill_id' as skill_4
  FROM invitations
  WHERE email = 'JAnandeswaran@rpgcc.co.uk'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
),
laura_first_5 AS (
  SELECT 
    email,
    (assessment_data->0)->>'skill_id' as skill_0,
    (assessment_data->1)->>'skill_id' as skill_1,
    (assessment_data->2)->>'skill_id' as skill_2,
    (assessment_data->3)->>'skill_id' as skill_3,
    (assessment_data->4)->>'skill_id' as skill_4
  FROM invitations
  WHERE email ILIKE '%lpond%'
    AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
)
SELECT 
  'Jaanu' as person,
  j.total_skills,
  j.skill_0 as jaanu_skill_0,
  l.skill_0 as laura_skill_0,
  CASE WHEN j.skill_0 = l.skill_0 THEN '✅ MATCH' ELSE '❌ DIFFERENT' END as status_0,
  j.skill_1 as jaanu_skill_1,
  l.skill_1 as laura_skill_1,
  CASE WHEN j.skill_1 = l.skill_1 THEN '✅ MATCH' ELSE '❌ DIFFERENT' END as status_1
FROM jaanu_first_5 j
CROSS JOIN laura_first_5 l;

