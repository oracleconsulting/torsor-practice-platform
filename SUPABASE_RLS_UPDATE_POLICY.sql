-- =====================================================
-- Allow authenticated users to accept invitations
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow users to accept their own invitations" ON invitations;

-- Create policy that allows users to update invitations they're accepting
CREATE POLICY "Allow users to accept their own invitations"
ON invitations
FOR UPDATE
USING (
  -- Allow updating if the user is authenticated and the invitation is for their email
  auth.jwt() ->> 'email' = email
  AND status = 'pending'
)
WITH CHECK (
  -- Only allow setting status to 'accepted'
  status = 'accepted'
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'invitations';

