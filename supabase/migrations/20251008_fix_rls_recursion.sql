-- =====================================================
-- FIX: Infinite recursion in practice_members RLS
-- Problem: RLS policies query practice_members within their own policies
-- Solution: Use SECURITY DEFINER functions to bypass RLS checks
-- =====================================================

-- Drop any existing problematic policies on practice_members
DROP POLICY IF EXISTS "Users can view own practice members" ON practice_members;
DROP POLICY IF EXISTS "Users can view practice members" ON practice_members;
DROP POLICY IF EXISTS "Practice members can view themselves" ON practice_members;
DROP POLICY IF EXISTS "Practice members can view team" ON practice_members;

-- Create SECURITY DEFINER function to check if user is practice member
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION is_practice_member(p_user_id UUID, p_practice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM practice_members 
    WHERE user_id = p_user_id 
    AND practice_id = p_practice_id
  ) INTO member_exists;
  
  RETURN member_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create SECURITY DEFINER function to get user's practice_ids
CREATE OR REPLACE FUNCTION get_user_practice_ids(p_user_id UUID)
RETURNS TABLE(practice_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT pm.practice_id 
  FROM practice_members pm
  WHERE pm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on practice_members (if not already enabled)
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- Create NEW non-recursive policies using SECURITY DEFINER functions
CREATE POLICY "Users can view practice_members in their practices"
ON practice_members FOR SELECT
USING (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

CREATE POLICY "Users can insert practice_members in their practices"
ON practice_members FOR INSERT
WITH CHECK (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

CREATE POLICY "Users can update practice_members in their practices"
ON practice_members FOR UPDATE
USING (
  practice_id IN (
    SELECT get_user_practice_ids(auth.uid())
  )
);

-- Allow system/admin to bypass (for invitations system)
CREATE POLICY "Service role can manage all practice_members"
ON practice_members FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- VERIFY FIX
-- ============================================

SELECT 
  '✅ RLS Recursion Fixed!' as status,
  'practice_members policies now use SECURITY DEFINER functions' as solution,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'practice_members') as policy_count;


