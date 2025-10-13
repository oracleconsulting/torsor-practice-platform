-- =====================================================
-- FIX: Infinite recursion in DELETE policy
-- Error: "infinite recursion detected in policy for relation 'practice_members'"
-- Solution: Use SECURITY DEFINER function to check admin permissions
-- Date: October 13, 2025
-- =====================================================

-- First, drop the problematic DELETE policy
DROP POLICY IF EXISTS "Admins can delete practice_members" ON practice_members;

-- Create SECURITY DEFINER function to check if user has delete permissions
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION user_can_delete_members(p_user_id UUID, p_practice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM practice_members pm
    WHERE pm.user_id = p_user_id
    AND pm.practice_id = p_practice_id
    AND (
      pm.permission_role IN ('admin', 'partner')
      OR pm.can_delete_data = true
      OR pm.role IN ('owner', 'Owner')
    )
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create NEW non-recursive DELETE policy using SECURITY DEFINER function
CREATE POLICY "Admins can delete practice_members"
ON practice_members FOR DELETE
USING (
  -- User must be in the same practice AND have delete permissions
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
  AND
  user_can_delete_members(auth.uid(), practice_id)
);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count INT;
  function_exists BOOLEAN;
BEGIN
  -- Check if DELETE policy exists
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'practice_members' 
  AND cmd = 'DELETE';
  
  -- Check if helper function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'user_can_delete_members'
  ) INTO function_exists;
  
  IF policy_count > 0 AND function_exists THEN
    RAISE NOTICE '✅ DELETE policy created for practice_members (non-recursive)';
    RAISE NOTICE '✅ Helper function user_can_delete_members() created';
    RAISE NOTICE 'Admins and owners can now delete team members without recursion';
  ELSE
    RAISE NOTICE '❌ Failed to create DELETE policy or helper function';
  END IF;
END $$;


