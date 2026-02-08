-- Fix RLS policy for bm_reports
-- The issue: client_id in bm_engagements is the practice_member.id, not auth.uid()
-- practice_members.user_id links to auth.users.id
-- We need to join through practice_members to match the authenticated user

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Clients can view own SHARED bm_reports" ON bm_reports;
DROP POLICY IF EXISTS "Clients can view own bm_reports" ON bm_reports;

-- Create the corrected policy for clients viewing SHARED reports
CREATE POLICY "Clients can view own SHARED bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.id = bme.client_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()  -- Match via user_id (links to auth.users)
      AND bm_reports.is_shared_with_client = true
    )
  );

-- Note: Practice members (admin/consultant) policy already exists separately
-- from the original 20251222_benchmarking_complete.sql migration

-- Verify the policies
SELECT polname, polcmd, polqual::text
FROM pg_policy 
WHERE polrelid = 'bm_reports'::regclass;
