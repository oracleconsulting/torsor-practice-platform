-- Fix: User can't access portal because no practice found
-- User: jhoward@rpgcc.co.uk (ID: 0bb006b4-8217-4890-81d6-e13b8fcf1fee)

-- 1. Check if user exists and has practice_member record
SELECT 
  u.id as user_id,
  u.email,
  pm.id as practice_member_id,
  pm.practice_id,
  pm.role,
  pm.is_active,
  p.name as practice_name,
  p.id as practice_table_id
FROM auth.users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- 2. Check if a practice exists for this user
SELECT 
  id,
  name,
  subscription_tier,
  is_active,
  created_at
FROM practices
ORDER BY created_at DESC
LIMIT 5;

-- 3. FIX: Create practice and link user
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
    RAISE EXCEPTION 'User jhoward@rpgcc.co.uk not found';
  END IF;
  
  -- Check if practice already exists for this user
  SELECT p.id INTO v_practice_id
  FROM practices p
  INNER JOIN practice_members pm ON pm.practice_id = p.id
  WHERE pm.user_id = v_user_id
  LIMIT 1;
  
  -- If no practice exists, create one
  IF v_practice_id IS NULL THEN
    INSERT INTO practices (
      name,
      subscription_tier,
      is_active
    ) VALUES (
      'RPGCC',
      'enterprise',
      true
    )
    RETURNING id INTO v_practice_id;
    
    RAISE NOTICE '✅ Created practice: %', v_practice_id;
  ELSE
    RAISE NOTICE 'ℹ️ Practice already exists: %', v_practice_id;
  END IF;
  
  -- Check if practice_member record exists
  SELECT id INTO v_practice_member_id
  FROM practice_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  -- If no practice_member, create one
  IF v_practice_member_id IS NULL THEN
    INSERT INTO practice_members (
      user_id,
      practice_id,
      name,
      email,
      role,
      is_active
    ) VALUES (
      v_user_id,
      v_practice_id,
      'James Howard',
      'jhoward@rpgcc.co.uk',
      'owner',
      true
    )
    RETURNING id INTO v_practice_member_id;
    
    RAISE NOTICE '✅ Created practice_member: %', v_practice_member_id;
  ELSE
    -- Update existing practice_member to link to practice
    UPDATE practice_members
    SET 
      practice_id = v_practice_id,
      role = 'owner',
      is_active = true
    WHERE id = v_practice_member_id;
    
    RAISE NOTICE '✅ Updated practice_member: %', v_practice_member_id;
  END IF;
  
  -- Sync test user to same practice
  UPDATE practice_members
  SET practice_id = v_practice_id
  WHERE email = 'laspartnership@googlemail.com'
    AND (practice_id IS NULL OR practice_id != v_practice_id);
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ User setup complete!';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Practice ID: %', v_practice_id;
  RAISE NOTICE '   Practice Member ID: %', v_practice_member_id;
  RAISE NOTICE '   Test user synced to same practice';
  RAISE NOTICE '==============================================';
  
END $$;

-- 4. Verify the fix worked
SELECT 
  'VERIFICATION: Admin User Setup' as check_name,
  u.email,
  pm.id as practice_member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- 5. Verify test user is in same practice
SELECT 
  'VERIFICATION: Test User in Same Practice' as check_name,
  pm.email,
  pm.name,
  pm.practice_id,
  p.name as practice_name
FROM practice_members pm
INNER JOIN practices p ON p.id = pm.practice_id
WHERE pm.email = 'laspartnership@googlemail.com';

-- 6. Final verification - what AccountancyContext will query
SELECT 
  'VERIFICATION: AccountancyContext Query' as check_name,
  pm.id as practice_member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name,
  p.subscription_tier
FROM practice_members pm
INNER JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = '0bb006b4-8217-4890-81d6-e13b8fcf1fee'
  AND pm.is_active = true
LIMIT 1;

-- Expected: Should return 1 row with complete practice info
-- If 0 rows, login will still fail

