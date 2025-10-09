-- ONE SCRIPT TO FIX EVERYTHING
-- This script does ALL fixes in the correct order

-- ==========================================
-- STEP 1: Ensure practice_members table has correct structure
-- ==========================================
DO $$
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practice_members' AND column_name = 'email'
  ) THEN
    ALTER TABLE practice_members ADD COLUMN email TEXT;
  END IF;

  -- Add name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practice_members' AND column_name = 'name'
  ) THEN
    ALTER TABLE practice_members ADD COLUMN name TEXT;
  END IF;
  
  -- Make user_id nullable if not already
  ALTER TABLE practice_members ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- ==========================================
-- STEP 2: Create/update practice and practice_member data
-- ==========================================
DO $$
DECLARE
  v_user_id UUID;
  v_practice_id UUID;
  v_member_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jhoward@rpgcc.co.uk';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User jhoward@rpgcc.co.uk not found';
  END IF;
  
  RAISE NOTICE 'User ID: %', v_user_id;
  
  -- Check if practice exists
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
    RAISE NOTICE 'Practice exists: %', v_practice_id;
  END IF;
  
  -- Delete existing practice_member to avoid conflicts
  DELETE FROM practice_members WHERE user_id = v_user_id OR email = 'jhoward@rpgcc.co.uk';
  RAISE NOTICE 'Deleted old practice_member records';
  
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
  
  RAISE NOTICE '✅ Created practice_member: %', v_member_id;
  RAISE NOTICE '✅ SUCCESS! Practice: % | Member: %', v_practice_id, v_member_id;
END $$;

-- ==========================================
-- STEP 3: Drop ALL existing RLS policies (clean slate)
-- ==========================================
DROP POLICY IF EXISTS "Users can read their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Users can read team members in their practice" ON practice_members;
DROP POLICY IF EXISTS "Allow public read of practice_members" ON practice_members;
DROP POLICY IF EXISTS "Allow users to read their own practice_member" ON practice_members;
DROP POLICY IF EXISTS "Service role can do anything on practice_members" ON practice_members;

DROP POLICY IF EXISTS "Users can read their own practice" ON practices;
DROP POLICY IF EXISTS "Practice owners can read their practice" ON practices;
DROP POLICY IF EXISTS "Users can read practices they are members of" ON practices;
DROP POLICY IF EXISTS "Practice owners can read their own practice" ON practices;
DROP POLICY IF EXISTS "Service role can do anything on practices" ON practices;

-- ==========================================
-- STEP 4: Create RLS policies for practice_members
-- ==========================================

-- Allow users to read their own record
CREATE POLICY "Users can read their own practice_member"
ON practice_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to read other members in same practice
CREATE POLICY "Users can read team members in same practice"
ON practice_members
FOR SELECT
TO authenticated
USING (
  practice_id IN (
    SELECT practice_id 
    FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow service role to do anything (for backend)
CREATE POLICY "Service role full access on practice_members"
ON practice_members
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- STEP 5: Create RLS policies for practices
-- ==========================================

-- Allow practice owners to read their practice
CREATE POLICY "Owners can read their practice"
ON practices
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Allow practice members to read their practice
CREATE POLICY "Members can read their practice"
ON practices
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT practice_id 
    FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow service role to do anything (for backend)
CREATE POLICY "Service role full access on practices"
ON practices
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- STEP 6: VERIFICATION
-- ==========================================
SELECT 
  '✅ FINAL VERIFICATION - Login should work now!' as status,
  u.email,
  u.id as user_id,
  pm.id as member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name,
  p.subscription_tier
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- If the above returns 1 row with all data, you're ready to login!
-- 
-- After running this script:
-- 1. Close TORSOR browser tab completely
-- 2. Open new tab
-- 3. Go to TORSOR
-- 4. Log in with jhoward@rpgcc.co.uk
-- 5. Should reach Dashboard immediately!

