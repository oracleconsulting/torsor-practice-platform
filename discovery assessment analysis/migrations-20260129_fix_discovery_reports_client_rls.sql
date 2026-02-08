-- COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md
-- ============================================================================
-- FIX: Discovery Reports RLS Policy for Client Access
-- ============================================================================
-- BUG: The existing policy checks `de.client_id = auth.uid()` but client_id
--      is a practice_members.id, NOT a user_id. Clients could NEVER pass this check.
-- FIX: Join through practice_members to compare user_id correctly.
-- ============================================================================

-- Drop ALL existing client-view policies on discovery_reports
DROP POLICY IF EXISTS "Clients can view published reports" ON discovery_reports;
DROP POLICY IF EXISTS "Clients can view published discovery reports" ON discovery_reports;

-- Create the CORRECT policy
-- Clients can view reports where:
-- 1. The report is published (status = 'published')
-- 2. The report is marked ready for client (ready_for_client = TRUE) 
-- 3. The client's user_id matches auth.uid()
CREATE POLICY "Clients can view published discovery reports"
ON discovery_reports
FOR SELECT
USING (
  ready_for_client = TRUE
  AND status = 'published'
  AND EXISTS (
    SELECT 1 
    FROM discovery_engagements de
    JOIN practice_members pm ON pm.id = de.client_id
    WHERE de.id = discovery_reports.engagement_id
    AND pm.user_id = auth.uid()
  )
);

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'RLS policy "Clients can view published discovery reports" created successfully';
END $$;

-- ============================================================================
-- ALSO: Update the discovery_engagements client policy to be consistent
-- ============================================================================

DROP POLICY IF EXISTS "Clients can view own engagement" ON discovery_engagements;

CREATE POLICY "Clients can view own engagement" ON discovery_engagements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE pm.id = discovery_engagements.client_id
    AND pm.user_id = auth.uid()
  )
);

-- ============================================================================
-- Now update the test client's report to be published
-- ============================================================================

-- First, find and update the test client's report to published status
UPDATE discovery_reports
SET 
  status = 'published',
  ready_for_client = TRUE,
  published_to_client_at = NOW(),
  updated_at = NOW()
WHERE engagement_id IN (
  SELECT de.id 
  FROM discovery_engagements de
  JOIN practice_members pm ON pm.id = de.client_id
  WHERE LOWER(pm.name) LIKE '%james%howard%'
     OR LOWER(pm.client_company) LIKE '%james%'
);

-- Log what was updated
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM discovery_reports dr
  JOIN discovery_engagements de ON de.id = dr.engagement_id
  JOIN practice_members pm ON pm.id = de.client_id
  WHERE (LOWER(pm.name) LIKE '%james%howard%' OR LOWER(pm.client_company) LIKE '%james%')
    AND dr.status = 'published';
  
  RAISE NOTICE 'Updated % reports to published status for test client', v_count;
END $$;

