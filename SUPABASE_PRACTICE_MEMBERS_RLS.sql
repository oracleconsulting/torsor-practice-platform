-- =====================================================
-- RLS Policy: Allow users to create their practice_members record
-- =====================================================
-- This allows newly invited users to create their own practice_members
-- record when they accept an invitation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Users can read their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Users can update their own practice member record" ON practice_members;

-- Allow users to insert their own practice_members record
CREATE POLICY "Users can create their own practice member record"
ON practice_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users to read their own practice_members record
CREATE POLICY "Users can read their own practice member record"
ON practice_members
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Allow users to update their own practice_members record
CREATE POLICY "Users can update their own practice member record"
ON practice_members
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Verify RLS is enabled
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT * FROM pg_policies WHERE tablename = 'practice_members';

