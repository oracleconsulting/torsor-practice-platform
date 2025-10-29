-- Find ALL practice members to see if Jaanu exists
SELECT 
  id,
  name,
  email,
  role
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY name;

-- Also search for Jaanu with broader patterns
SELECT 
  id,
  name,
  email,
  role
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND (
    name ILIKE '%jaanu%'
    OR name ILIKE '%anandeswaran%'
    OR email ILIKE '%JA%'
  );

