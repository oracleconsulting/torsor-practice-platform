-- Create practice_members record for Jaanu if missing
-- (Only run this if the previous query shows Jaanu is missing)

INSERT INTO practice_members (
  practice_id,
  email,
  name,
  role,
  is_active
)
SELECT
  practice_id,
  email,
  name,
  role,
  true as is_active
FROM invitations
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND email ILIKE '%anandeswaran%'
  AND status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE LOWER(pm.email) = LOWER(invitations.email)
      AND pm.practice_id = invitations.practice_id
  );

-- Verify it was created
SELECT id, name, email, role
FROM practice_members
WHERE email ILIKE '%anandeswaran%'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';

