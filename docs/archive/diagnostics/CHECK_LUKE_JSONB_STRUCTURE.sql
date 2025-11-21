-- Check the exact structure of assessment_data JSONB in invitations table
SELECT 
  email,
  jsonb_array_length(assessment_data) as skill_count,
  -- Look at first 3 skills to see field names
  assessment_data->0 as first_skill,
  assessment_data->1 as second_skill,
  assessment_data->2 as third_skill
FROM invitations
WHERE email = 'luke@rpgcc.co.uk'
  OR email = 'ltyrrell@rpgcc.co.uk'
  AND assessment_data IS NOT NULL;

