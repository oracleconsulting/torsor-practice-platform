-- Dynamic fix - finds actual user ID from email
-- This avoids hardcoded UUID typos

-- Step 1: Find the ACTUAL user ID
SELECT 
  'ACTUAL USER ID' as info,
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'jhoward@rpgcc.co.uk';

-- Step 2: Create practice and link (using actual user ID from email lookup)
DO $$
DECLARE
  v_user_id UUID;
  v_practice_id UUID;
  v_member_id UUID;
BEGIN
  -- Get ACTUAL user ID from email (not hardcoded)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jhoward@rpgcc.co.uk';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User jhoward@rpgcc.co.uk not found in auth.users table';
  END IF;
  
  RAISE NOTICE 'Found user ID: %', v_user_id;
  
  -- Check if practice already exists
  SELECT id INTO v_practice_id
  FROM practices
  WHERE owner_id = v_user_id OR name = 'RPGCC'
  LIMIT 1;
  
  -- Create practice if needed
  IF v_practice_id IS NULL THEN
    INSERT INTO practices (
      owner_id,
      name,
      subscription_tier
    ) VALUES (
      v_user_id,
      'RPGCC',
      'enterprise'
    )
    RETURNING id INTO v_practice_id;
    
    RAISE NOTICE 'Created practice: %', v_practice_id;
  ELSE
    RAISE NOTICE 'Practice already exists: %', v_practice_id;
  END IF;
  
  -- Delete any existing practice_member to avoid conflicts
  DELETE FROM practice_members 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE 'Deleted old practice_member records (if any)';
  
  -- Create fresh practice_member
  INSERT INTO practice_members (
    user_id,
    practice_id,
    email,
    name,
    role
  ) VALUES (
    v_user_id,
    v_practice_id,
    'jhoward@rpgcc.co.uk',
    'James Howard',
    'owner'
  )
  RETURNING id INTO v_member_id;
  
  RAISE NOTICE 'Created practice_member: %', v_member_id;
  
  -- Sync test user to same practice
  UPDATE practice_members
  SET practice_id = v_practice_id
  WHERE email = 'laspartnership@googlemail.com';
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ SUCCESS!';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Practice ID: %', v_practice_id;
  RAISE NOTICE '   Practice Member ID: %', v_member_id;
  RAISE NOTICE '==============================================';
END $$;

-- Step 3: VERIFICATION - This MUST return 1 row for login to work
SELECT 
  '✅ FINAL VERIFICATION' as status,
  u.email,
  u.id as user_id,
  pm.id as member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- If you see 1 row above with all data filled in, you're ready to log in!

