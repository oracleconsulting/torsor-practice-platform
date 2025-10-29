-- Check practice_members for all 3 previously missing members
SELECT 
  id,
  name,
  email,
  role,
  practice_id
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND (
    email ILIKE '%ltyrrell%' 
    OR email ILIKE '%jaanu%'
    OR email ILIKE '%anandeswaran%'
    OR email ILIKE '%jhoward%'
  )
ORDER BY name;

-- Also check the exact email match between invitations and practice_members
SELECT 
  i.email as invitation_email,
  pm.email as practice_member_email,
  pm.name,
  CASE 
    WHEN i.email = pm.email THEN 'EXACT MATCH ✅'
    WHEN LOWER(i.email) = LOWER(pm.email) THEN 'CASE MISMATCH ⚠️'
    ELSE 'NO MATCH ❌'
  END as match_status
FROM invitations i
LEFT JOIN practice_members pm ON LOWER(i.email) = LOWER(pm.email)
WHERE i.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND i.email ILIKE ANY(ARRAY['%ltyrrell%', '%jaanu%', '%jhoward%'])
ORDER BY i.email;

