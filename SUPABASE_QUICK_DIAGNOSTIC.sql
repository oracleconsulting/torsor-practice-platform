-- QUICK DIAGNOSTIC: Check if data exists
-- Run this first to see what's actually in the database

-- 1. Does the user have a practice_member record?
SELECT 
  'USER CHECK' as step,
  pm.id,
  pm.user_id,
  pm.practice_id,
  pm.email,
  pm.role
FROM practice_members pm
WHERE pm.user_id = '0bb006b4-8217-4890-81d6-e13b8fcf1fee';

-- Expected: 1 row with practice_id filled in
-- If 0 rows: User has NO practice_member record (CREATE IT MANUALLY BELOW)
-- If 1 row but practice_id is NULL: practice_member exists but not linked (FIX BELOW)

-- 2. What practices exist?
SELECT 
  'PRACTICES CHECK' as step,
  id,
  name,
  subscription_tier,
  created_at
FROM practices
ORDER BY created_at DESC
LIMIT 3;

-- 3. What practice_members exist?
SELECT 
  'ALL MEMBERS CHECK' as step,
  id,
  user_id,
  practice_id,
  email,
  name,
  role
FROM practice_members
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- MANUAL FIX: If above shows NO data, run this:
-- =====================================================

-- Option A: Create everything from scratch
DO $$
DECLARE
  v_practice_id UUID;
  v_member_id UUID;
BEGIN
  -- Create practice
  INSERT INTO practices (name, subscription_tier)
  VALUES ('RPGCC', 'enterprise')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_practice_id;
  
  -- If practice already existed, get its ID
  IF v_practice_id IS NULL THEN
    SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  END IF;
  
  -- Delete existing practice_member if any (to avoid conflicts)
  DELETE FROM practice_members 
  WHERE user_id = '0bb006b4-8217-4890-81d6-e13b8fcf1fee';
  
  -- Create fresh practice_member
  INSERT INTO practice_members (
    user_id,
    practice_id,
    email,
    name,
    role
  ) VALUES (
    '0bb006b4-8217-4890-81d6-e13b8fcf1fee',
    v_practice_id,
    'jhoward@rpgcc.co.uk',
    'James Howard',
    'owner'
  )
  RETURNING id INTO v_member_id;
  
  -- Also link test user
  UPDATE practice_members
  SET practice_id = v_practice_id
  WHERE email = 'laspartnership@googlemail.com';
  
  RAISE NOTICE 'DONE! Practice: % | Member: %', v_practice_id, v_member_id;
END $$;

-- =====================================================
-- VERIFY: Check it worked
-- =====================================================

SELECT 
  'FINAL VERIFICATION' as result,
  u.email as user_email,
  pm.id as member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- This MUST return 1 row or login will fail
-- If it returns 0 rows, something is still wrong

