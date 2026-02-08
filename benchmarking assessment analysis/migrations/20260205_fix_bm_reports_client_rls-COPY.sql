-- Fix RLS policy for bm_reports client access
-- Date: 2026-02-05
-- Problem: The policy uses bme.client_id = auth.uid() but client_id is practice_members.id, not auth.uid()
--          We need to join through practice_members to match pm.user_id = auth.uid()

-- ============================================================================
-- PART 1: Drop all existing client policies to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Clients can view own SHARED bm_reports" ON bm_reports;
DROP POLICY IF EXISTS "Clients can view own bm_reports" ON bm_reports;
DROP POLICY IF EXISTS "Clients can view shared bm_reports" ON bm_reports;

-- ============================================================================
-- PART 2: Create the CORRECT client policy
-- ============================================================================

-- The key insight:
--   bm_engagements.client_id = practice_members.id (the client's member record)
--   practice_members.user_id = auth.users.id (the actual auth user)
-- So we need to join through practice_members to verify the authenticated user owns the client record

CREATE POLICY "Clients can view shared bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.id = bme.client_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()  -- user_id links to auth.users, NOT pm.id
      AND bm_reports.is_shared_with_client = true
    )
  );

-- ============================================================================
-- PART 3: Verify the fix
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policy 
  WHERE polrelid = 'bm_reports'::regclass
  AND polname LIKE '%client%';
  
  RAISE NOTICE 'Client policies on bm_reports: %', policy_count;
END $$;

-- Show all bm_reports policies for verification
SELECT polname, polcmd, polqual::text
FROM pg_policy 
WHERE polrelid = 'bm_reports'::regclass;
