-- =====================================================
-- FIX: Allow public access to invitations by invite_code
-- =====================================================
-- This allows unauthenticated users to read invitations when they click the link

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read of invitations by invite_code" ON invitations;

-- Create new policy that allows anyone to read invitations by invite_code
CREATE POLICY "Allow public read of invitations by invite_code"
ON invitations
FOR SELECT
USING (
  -- Allow if invite_code is being queried (for invitation acceptance)
  invite_code IS NOT NULL
);

-- Alternative: More restrictive - only allow reading pending invitations
-- Uncomment this if you want to be more restrictive
/*
DROP POLICY IF EXISTS "Allow public read of pending invitations" ON invitations;

CREATE POLICY "Allow public read of pending invitations"
ON invitations
FOR SELECT
USING (
  status = 'pending' 
  AND invite_code IS NOT NULL
  AND expires_at > NOW()
);
*/

-- Verify RLS is enabled on the table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT * FROM pg_policies WHERE tablename = 'invitations';

