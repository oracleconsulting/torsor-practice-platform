-- Find Luke Tyrrell's actual email address
-- Run this first to find the correct email

SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  pm.id as member_id,
  pm.name,
  pm.role
FROM auth.users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
WHERE 
  u.email ILIKE '%tyrrell%' 
  OR u.email ILIKE '%ltyrell%'
  OR pm.name ILIKE '%tyrrell%'
  OR pm.name ILIKE '%luke%'
ORDER BY u.created_at;

