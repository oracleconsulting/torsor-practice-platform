-- Fix: Add RLS policy for practices table
-- The practice_members query does a JOIN to practices, which also needs RLS

-- Step 1: Check existing policies on practices
SELECT 
  'Current RLS policies on practices table' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'practices';

-- Step 2: Drop and recreate policies
DROP POLICY IF EXISTS "Users can read their own practice" ON practices;
DROP POLICY IF EXISTS "Practice owners can read their practice" ON practices;

-- Step 3: Create policy allowing users to read practices they're members of
CREATE POLICY "Users can read practices they are members of"
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

-- Step 4: Also allow owners to read their own practice
CREATE POLICY "Practice owners can read their own practice"
ON practices
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
);

-- Step 5: Verify the full query works (simulating AccountancyContext query)
SELECT 
  '✅ VERIFICATION - Full query with JOIN should work now' as status,
  pm.practice_id,
  pm.role,
  p.id as practice_id_from_join,
  p.name as practice_name,
  p.subscription_tier
FROM practice_members pm
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- If this returns 1 row with practice data, the JOIN is working!

