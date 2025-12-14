-- ============================================================================
-- FIX: Add RLS Policy for Clients to Read Their Own Shared Reports
-- ============================================================================
-- This migration ensures clients can read their own discovery analysis reports
-- when is_shared_with_client = true
-- ============================================================================

-- Enable RLS on client_reports if not already enabled
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Clients can view their own shared reports" ON client_reports;

-- Create policy: Clients can view their own shared reports
-- This allows clients (practice_members with member_type = 'client')
-- to read reports where:
-- 1. The report's client_id matches their practice_members.id
-- 2. The report is marked as shared (is_shared_with_client = true)
CREATE POLICY "Clients can view their own shared reports"
  ON client_reports
  FOR SELECT
  USING (
    -- Check if the current user is a client
    EXISTS (
      SELECT 1
      FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.member_type = 'client'
        AND pm.id = client_reports.client_id
    )
    -- AND the report is shared
    AND client_reports.is_shared_with_client = true
  );

-- Also ensure practice members (advisors) can view reports for their practice
DROP POLICY IF EXISTS "Practice members can view reports for their practice" ON client_reports;

CREATE POLICY "Practice members can view reports for their practice"
  ON client_reports
  FOR SELECT
  USING (
    -- Check if the current user is a practice member (advisor/team member)
    EXISTS (
      SELECT 1
      FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.member_type IN ('member', 'admin')
        AND pm.practice_id = client_reports.practice_id
    )
  );

-- Practice members can also insert/update reports
DROP POLICY IF EXISTS "Practice members can manage reports" ON client_reports;

CREATE POLICY "Practice members can manage reports"
  ON client_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.member_type IN ('member', 'admin')
        AND pm.practice_id = client_reports.practice_id
    )
  );

COMMENT ON POLICY "Clients can view their own shared reports" ON client_reports IS 
  'Allows clients to read their own discovery analysis reports when is_shared_with_client = true';


