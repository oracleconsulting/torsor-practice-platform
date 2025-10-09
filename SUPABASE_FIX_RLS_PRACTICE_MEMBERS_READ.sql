-- Fix: Add RLS policy so users can read their own practice_member record
-- This is needed for AccountancyContext to load practice data

-- Step 1: Drop existing policy if it exists (in case we need to recreate)
DROP POLICY IF EXISTS "Users can read their own practice member record" ON practice_members;

-- Step 2: Create policy allowing users to read their own record
CREATE POLICY "Users can read their own practice member record"
ON practice_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Step 3: Also allow users to read other members in same practice (for team views)
DROP POLICY IF EXISTS "Users can read team members in their practice" ON practice_members;

CREATE POLICY "Users can read team members in their practice"
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

-- Step 4: Verify the policy works
SELECT 
  '✅ VERIFICATION - User can now read their practice_member' as status,
  pm.id,
  pm.user_id,
  pm.practice_id,
  pm.email,
  pm.role,
  p.name as practice_name
FROM practice_members pm
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- If this returns 1 row, RLS is now working correctly!
-- After running this, try logging in again

