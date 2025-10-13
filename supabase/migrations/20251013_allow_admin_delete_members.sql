-- =====================================================
-- ALLOW ADMINS TO DELETE PRACTICE MEMBERS
-- Fix: No DELETE policy exists on practice_members table
-- Error: "No rows deleted - user may not exist or RLS policy blocked deletion"
-- Date: October 13, 2025
-- =====================================================

-- Add DELETE policy for admins/owners with delete permissions
CREATE POLICY "Admins can delete practice_members"
ON practice_members FOR DELETE
USING (
  -- User must be in the same practice
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
  AND
  -- User must have admin role or delete permissions
  EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.practice_id = practice_members.practice_id
    AND (
      pm.permission_role IN ('admin', 'partner')
      OR pm.can_delete_data = true
      OR pm.role IN ('owner', 'Owner')
    )
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'practice_members' 
  AND cmd = 'DELETE';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ DELETE policy created for practice_members';
    RAISE NOTICE 'Admins and owners can now delete team members';
  ELSE
    RAISE NOTICE '❌ Failed to create DELETE policy';
  END IF;
END $$;


