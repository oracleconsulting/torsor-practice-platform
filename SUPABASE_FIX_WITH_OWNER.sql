-- Fix with owner_id included
-- The practices table requires owner_id (NOT NULL constraint)

-- Step 1: Check current state
SELECT 
  'Current State' as info,
  u.id as user_id,
  u.email,
  pm.id as practice_member_id,
  pm.practice_id
FROM auth.users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- Step 2: Create practice WITH owner_id
DO $$
DECLARE
  v_user_id UUID := '0bb006b4-8217-4890-81d6-e13b8fcf1fee';
  v_practice_id UUID;
  v_member_id UUID;
BEGIN
  -- Check if practice already exists
  SELECT id INTO v_practice_id
  FROM practices
  WHERE owner_id = v_user_id OR name = 'RPGCC'
  LIMIT 1;
  
  -- Create practice if needed (with owner_id)
  IF v_practice_id IS NULL THEN
    INSERT INTO practices (
      owner_id,  -- THIS WAS MISSING!
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
  
  RAISE NOTICE 'SUCCESS! Practice: % | Member: %', v_practice_id, v_member_id;
END $$;

-- Step 3: VERIFY - This MUST return 1 row
SELECT 
  '✅ VERIFICATION - Login will work if this shows data' as status,
  u.email,
  pm.id as member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name,
  p.owner_id
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- If the above returns 1 row, you're good to go!
-- If it returns 0 rows, send me the error message

