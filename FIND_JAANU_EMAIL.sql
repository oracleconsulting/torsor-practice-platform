-- Find Jaanu's exact email
SELECT email, name, status, jsonb_array_length(assessment_data) as skills
FROM invitations
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND (
    email ILIKE '%jaanu%' 
    OR email ILIKE '%anandeswaran%'
    OR name ILIKE '%jaanu%'
  );

