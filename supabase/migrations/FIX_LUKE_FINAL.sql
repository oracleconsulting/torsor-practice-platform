-- =====================================================
-- CHECK LUKE'S AUTH USER AND FIX IF NEEDED
-- =====================================================

-- Step 1: Check auth.users for Luke
SELECT 
  'AUTH USER' as type,
  id as user_id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE email ILIKE '%tyrrell%' AND email NOT ILIKE '%jeremy%';

-- Step 2: Check practice_members for Luke
SELECT 
  'PRACTICE MEMBER' as type,
  id as member_id,
  name,
  email,
  user_id,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as skills
FROM practice_members
WHERE name ILIKE '%luke%tyrrell%' OR email ILIKE 'ltyrrell%';

-- Step 3: Check if user_id matches
SELECT 
  pm.id as member_id,
  pm.name,
  pm.email as member_email,
  pm.user_id as member_user_id,
  au.id as auth_user_id,
  au.email as auth_email,
  CASE 
    WHEN pm.user_id = au.id THEN '✅ MATCHED'
    ELSE '❌ MISMATCH'
  END as status,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skills
FROM practice_members pm
LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(pm.email)
WHERE pm.name ILIKE '%luke%tyrrell%';

-- Step 4: Fix if needed
DO $$ 
DECLARE
  v_auth_user_id UUID;
  v_current_user_id UUID;
  v_member_id UUID;
BEGIN
  -- Find Luke's auth user by email (case insensitive)
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE LOWER(email) IN ('ltyrrell@rpgcc.co.uk', 'ltyrell@rpgcc.co.uk')
  LIMIT 1;
  
  -- Find Luke's practice member
  SELECT id, user_id INTO v_member_id, v_current_user_id
  FROM practice_members
  WHERE name ILIKE '%luke%tyrrell%'
  LIMIT 1;
  
  IF v_member_id IS NULL THEN
    RAISE NOTICE '⚠️  Could not find Luke in practice_members';
    RETURN;
  END IF;
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '⚠️  Could not find Luke in auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE '📋 Found Luke:';
  RAISE NOTICE '  Member ID: %', v_member_id;
  RAISE NOTICE '  Current user_id: %', v_current_user_id;
  RAISE NOTICE '  Auth user_id: %', v_auth_user_id;
  
  IF v_current_user_id != v_auth_user_id THEN
    UPDATE practice_members
    SET user_id = v_auth_user_id
    WHERE id = v_member_id;
    
    RAISE NOTICE '✅ FIXED: Updated Luke''s user_id';
  ELSE
    RAISE NOTICE '✅ Already correct - no fix needed';
  END IF;
END $$;

-- Step 5: Verify
SELECT 
  pm.name,
  pm.email,
  pm.user_id,
  au.email as auth_email,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skills,
  '✅ Luke can now see his skills!' as status
FROM practice_members pm
JOIN auth.users au ON au.id = pm.user_id
WHERE pm.name ILIKE '%luke%tyrrell%';

