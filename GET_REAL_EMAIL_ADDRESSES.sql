-- GET ACTUAL TEAM MEMBER EMAIL ADDRESSES
-- Run this to see the real email addresses in the database

SELECT 
  pm.name AS "Name",
  pm.email AS "Email",
  pm.role AS "Role",
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Auth Account'
    ELSE '❌ Needs Auth Account'
  END AS "Auth Status"
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY pm.name;

-- Use THESE email addresses for auth account creation
-- NOT @ivcaccounting.co.uk addresses!

