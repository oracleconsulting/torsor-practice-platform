-- Simple fix for user practice access
-- No assumptions about table structure

-- STEP 1: Check current state
SELECT 
  'Current User State' as info,
  u.id as user_id,
  u.email,
  pm.id as practice_member_id,
  pm.practice_id,
  pm.role
FROM auth.users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- STEP 2: Check existing practices
SELECT 
  'Existing Practices' as info,
  id,
  name,
  subscription_tier,
  created_at
FROM practices
ORDER BY created_at DESC
LIMIT 5;

-- STEP 3: Create practice and link user
DO $$
DECLARE
  v_user_id UUID;
  v_practice_id UUID;
  v_practice_member_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jhoward@rpgcc.co.uk';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if user already has a practice
  SELECT p.id INTO v_practice_id
  FROM practices p
  INNER JOIN practice_members pm ON pm.practice_id = p.id
  WHERE pm.user_id = v_user_id
  LIMIT 1;
  
  -- Create practice if needed (minimal columns)
  IF v_practice_id IS NULL THEN
    INSERT INTO practices (name, subscription_tier)
    VALUES ('RPGCC', 'enterprise')
    RETURNING id INTO v_practice_id;
    
    RAISE NOTICE 'Created practice: %', v_practice_id;
  ELSE
    RAISE NOTICE 'Practice exists: %', v_practice_id;
  END IF;
  
  -- Check for existing practice_member
  SELECT id INTO v_practice_member_id
  FROM practice_members
  WHERE user_id = v_user_id;
  
  -- Create or update practice_member
  IF v_practice_member_id IS NULL THEN
    INSERT INTO practice_members (
      user_id,
      practice_id,
      name,
      email,
      role
    ) VALUES (
      v_user_id,
      v_practice_id,
      'James Howard',
      'jhoward@rpgcc.co.uk',
      'owner'
    )
    RETURNING id INTO v_practice_member_id;
    
    RAISE NOTICE 'Created practice_member: %', v_practice_member_id;
  ELSE
    UPDATE practice_members
    SET 
      practice_id = v_practice_id,
      role = 'owner'
    WHERE id = v_practice_member_id;
    
    RAISE NOTICE 'Updated practice_member: %', v_practice_member_id;
  END IF;
  
  -- Sync test user to same practice
  UPDATE practice_members
  SET practice_id = v_practice_id
  WHERE email = 'laspartnership@googlemail.com';
  
  RAISE NOTICE 'Success! User: % | Practice: % | Member: %', 
    v_user_id, v_practice_id, v_practice_member_id;
END $$;

-- STEP 4: Verify - Admin user setup
SELECT 
  'VERIFICATION: Admin Setup' as check_result,
  u.email,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- STEP 5: Verify - Test user in same practice
SELECT 
  'VERIFICATION: Test User Synced' as check_result,
  email,
  practice_id
FROM practice_members
WHERE email = 'laspartnership@googlemail.com';

-- STEP 6: Verify - What login will see
SELECT 
  'VERIFICATION: Login Query Result' as check_result,
  pm.id,
  pm.practice_id,
  pm.role,
  p.name
FROM practice_members pm
INNER JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = '0bb006b4-8217-4890-81d6-e13b8fcf1fee';

-- If the last query returns a row, login will work!

