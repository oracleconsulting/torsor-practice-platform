-- Check invitations table for assessment_data
SELECT 
  email,
  name,
  status,
  CASE 
    WHEN assessment_data IS NULL THEN 'NULL'
    WHEN assessment_data = '[]'::jsonb THEN 'EMPTY ARRAY'
    WHEN jsonb_array_length(assessment_data) = 0 THEN 'ZERO LENGTH'
    ELSE 'HAS DATA: ' || jsonb_array_length(assessment_data)::text || ' items'
  END as data_status,
  LENGTH(assessment_data::text) as data_length,
  LEFT(assessment_data::text, 200) as sample_data
FROM invitations
ORDER BY created_at DESC;

