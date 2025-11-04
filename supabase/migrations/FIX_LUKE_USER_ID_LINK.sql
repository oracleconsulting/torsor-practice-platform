-- =====================================================
-- FIX LUKE'S USER_ID LINK
-- =====================================================
-- After password reset, the user_id might have become disconnected
-- This reconnects Luke's practice_members record to his auth.users record
-- =====================================================

BEGIN;

-- Step 1: Check current state
DO $$ 
DECLARE
  v_auth_user_id UUID;
  v_member_user_id UUID;
  v_member_id UUID;
  v_skill_count INTEGER;
BEGIN
  -- Get Luke's auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  -- Get Luke's practice member record
  SELECT id, user_id INTO v_member_id, v_member_user_id
  FROM practice_members
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  -- Count skills
  SELECT COUNT(*) INTO v_skill_count
  FROM skill_assessments
  WHERE team_member_id = v_member_id;
  
  RAISE NOTICE '📋 Current State:';
  RAISE NOTICE '  Auth User ID: %', v_auth_user_id;
  RAISE NOTICE '  Practice Member User ID: %', v_member_user_id;
  RAISE NOTICE '  Member ID: %', v_member_id;
  RAISE NOTICE '  Skills Count: %', v_skill_count;
  
  IF v_auth_user_id = v_member_user_id THEN
    RAISE NOTICE '  ✅ user_id is correctly linked';
  ELSE
    RAISE NOTICE '  ⚠️  user_id MISMATCH - will fix!';
  END IF;
END $$;

-- Step 2: Fix the link if needed
DO $$ 
DECLARE
  v_auth_user_id UUID;
  v_member_user_id UUID;
BEGIN
  -- Get Luke's auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  -- Get Luke's current practice member user_id
  SELECT user_id INTO v_member_user_id
  FROM practice_members
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  -- If they don't match, update it
  IF v_auth_user_id != v_member_user_id OR v_member_user_id IS NULL THEN
    UPDATE practice_members
    SET user_id = v_auth_user_id
    WHERE email = 'ltyrrell@rpgcc.co.uk';
    
    RAISE NOTICE '✅ Fixed user_id link for Luke';
    RAISE NOTICE '   Old user_id: %', v_member_user_id;
    RAISE NOTICE '   New user_id: %', v_auth_user_id;
  ELSE
    RAISE NOTICE '✅ user_id already correct - no fix needed';
  END IF;
END $$;

-- Step 3: Verify
DO $$ 
DECLARE
  v_auth_user_id UUID;
  v_member_user_id UUID;
  v_skill_count INTEGER;
BEGIN
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT user_id INTO v_member_user_id FROM practice_members WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT COUNT(*) INTO v_skill_count FROM skill_assessments sa
  JOIN practice_members pm ON pm.id = sa.team_member_id
  WHERE pm.email = 'ltyrrell@rpgcc.co.uk';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ VERIFICATION:';
  RAISE NOTICE '  Auth user_id: %', v_auth_user_id;
  RAISE NOTICE '  Member user_id: %', v_member_user_id;
  RAISE NOTICE '  Skills count: %', v_skill_count;
  
  IF v_auth_user_id = v_member_user_id THEN
    RAISE NOTICE '  ✅ Luke can now see his % skills!', v_skill_count;
  ELSE
    RAISE NOTICE '  ⚠️  Still mismatched - manual intervention needed';
  END IF;
END $$;

COMMIT;

