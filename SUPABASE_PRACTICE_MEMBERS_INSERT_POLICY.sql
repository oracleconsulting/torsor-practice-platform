-- Allow service role to create practice_members records during assessment submission
-- This policy allows the backend (using service role key) to create practice_members
-- without requiring user authentication

-- First, check if we need to add this policy
-- The service role key bypasses RLS by default, so this is just for documentation

-- Note: When using the SUPABASE_SERVICE_ROLE_KEY, RLS is bypassed entirely
-- So we don't need additional policies for the backend operations

-- However, if you want to allow authenticated users to create their own records:
DROP POLICY IF EXISTS "Allow authenticated users to create practice member" ON practice_members;

CREATE POLICY "Allow authenticated users to create practice member"
ON practice_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  -- Allow creation if the user's email matches an invitation
  EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.email = practice_members.email
    AND invitations.status = 'pending'
  )
);

-- Verify practice_members table has RLS enabled
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- Note: The backend using SUPABASE_SERVICE_ROLE_KEY will bypass all RLS policies
-- This is the recommended approach for server-side operations

