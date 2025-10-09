-- FIX: Remove infinite recursion in RLS policies
-- The problem: policy on practice_members was querying practice_members in its USING clause

-- ==========================================
-- STEP 1: Drop the problematic policy
-- ==========================================
DROP POLICY IF EXISTS "Users can read team members in same practice" ON practice_members;

-- ==========================================
-- STEP 2: Keep only the simple, non-recursive policy
-- ==========================================
-- This policy is already created, just verifying it exists:
-- "Users can read their own practice_member"
-- USING (auth.uid() = user_id)

-- ==========================================
-- STEP 3: VERIFICATION - Test the query works now
-- ==========================================
SELECT 
  '✅ VERIFICATION - Query should work without infinite recursion' as status,
  pm.practice_id,
  pm.role,
  p.id as practice_id_from_join,
  p.name as practice_name,
  p.subscription_tier
FROM practice_members pm
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- If this returns 1 row, the recursion is fixed!
-- The key insight: We only need users to read THEIR OWN record.
-- We don't need a policy for reading other team members yet.

