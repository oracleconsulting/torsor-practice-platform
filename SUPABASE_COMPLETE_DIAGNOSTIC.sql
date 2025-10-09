-- COMPLETE DIAGNOSTIC - Shows EVERYTHING about current state
-- Run this FIRST to see what's actually broken

-- ==========================================
-- SECTION 1: USER DATA
-- ==========================================
SELECT '1️⃣ USER EXISTS?' as check_name;
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'jhoward@rpgcc.co.uk';

-- ==========================================
-- SECTION 2: PRACTICE DATA
-- ==========================================
SELECT '2️⃣ PRACTICE EXISTS?' as check_name;
SELECT 
  id,
  name,
  owner_id,
  subscription_tier,
  created_at
FROM practices
WHERE name = 'RPGCC' OR owner_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- ==========================================
-- SECTION 3: PRACTICE_MEMBER DATA
-- ==========================================
SELECT '3️⃣ PRACTICE_MEMBER EXISTS?' as check_name;
SELECT 
  pm.id,
  pm.user_id,
  pm.practice_id,
  pm.email,
  pm.name,
  pm.role
FROM practice_members pm
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- ==========================================
-- SECTION 4: RLS POLICIES ON practice_members
-- ==========================================
SELECT '4️⃣ RLS POLICIES ON practice_members?' as check_name;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'practice_members';

-- ==========================================
-- SECTION 5: RLS POLICIES ON practices
-- ==========================================
SELECT '5️⃣ RLS POLICIES ON practices?' as check_name;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'practices';

-- ==========================================
-- SECTION 6: TEST CLIENT-SIDE QUERY (practice_members only)
-- ==========================================
SELECT '6️⃣ CLIENT CAN READ practice_members?' as check_name;
SELECT 
  practice_id,
  role
FROM practice_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- ==========================================
-- SECTION 7: TEST CLIENT-SIDE QUERY (practices only)
-- ==========================================
SELECT '7️⃣ CLIENT CAN READ practices?' as check_name;
SELECT 
  id,
  name,
  subscription_tier
FROM practices
WHERE id IN (
  SELECT practice_id 
  FROM practice_members 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk')
);

-- ==========================================
-- SECTION 8: TEST CLIENT-SIDE JOIN QUERY
-- ==========================================
SELECT '8️⃣ CLIENT CAN DO JOIN QUERY?' as check_name;
SELECT 
  pm.practice_id,
  pm.role,
  p.id as practice_id_from_join,
  p.name as practice_name
FROM practice_members pm
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- ==========================================
-- RESULTS INTERPRETATION:
-- ==========================================
-- ✅ Section 1: Should return 1 row (user exists)
-- ✅ Section 2: Should return 1 row (practice exists)
-- ✅ Section 3: Should return 1 row (practice_member exists)
-- ✅ Section 4: Should show at least 2 policies for practice_members
-- ✅ Section 5: Should show at least 2 policies for practices
-- ✅ Section 6: Should return 1 row (client can read practice_members)
-- ✅ Section 7: Should return 1 row (client can read practices)
-- ✅ Section 8: Should return 1 row with practice_name filled (JOIN works)
--
-- If ANY section returns 0 rows or errors, that's the problem!

