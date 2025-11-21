-- Check the ACTUAL structure of assessment_data for Luke
SELECT 
  email,
  jsonb_pretty(assessment_data->0) as first_skill_structure,
  jsonb_pretty(assessment_data->1) as second_skill_structure,
  jsonb_pretty(assessment_data->10) as tenth_skill_structure
FROM invitations
WHERE email ILIKE 'ltyrrell@rpgcc.co.uk'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND status = 'accepted';

-- Also check Laura's structure for comparison
SELECT 
  email,
  jsonb_pretty(assessment_data->0) as first_skill_structure,
  jsonb_pretty(assessment_data->1) as second_skill_structure
FROM invitations
WHERE email ILIKE '%lpond%'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND status = 'accepted';

