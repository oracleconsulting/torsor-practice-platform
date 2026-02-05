-- ============================================================================
-- DISCOVERY REPORTS: DATA COMPLETENESS TRACKING
-- ============================================================================
-- Adds columns to track data completeness and admin review status
-- Ensures reports don't go to clients until admin approves
-- ============================================================================

-- Add data completeness tracking columns
ALTER TABLE discovery_reports 
ADD COLUMN IF NOT EXISTS data_completeness_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_completeness_status TEXT DEFAULT 'unknown' CHECK (data_completeness_status IN ('complete', 'partial', 'insufficient', 'unknown')),
ADD COLUMN IF NOT EXISTS missing_critical_data TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS missing_important_data TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS admin_actions_needed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ready_for_client BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);

-- Add index for quick lookup of reports awaiting review
CREATE INDEX IF NOT EXISTS idx_discovery_reports_awaiting_review 
ON discovery_reports (status, ready_for_client) 
WHERE status = 'admin_review' OR ready_for_client = FALSE;

-- Add 'admin_review' and 'published' to status if not exists
-- Note: This is a soft check - Postgres doesn't support adding CHECK constraints easily after the fact
-- The application will handle this

-- Comment for documentation
COMMENT ON COLUMN discovery_reports.data_completeness_score IS 'Score 0-100 indicating how complete the assessment data is';
COMMENT ON COLUMN discovery_reports.data_completeness_status IS 'complete, partial, or insufficient based on critical data presence';
COMMENT ON COLUMN discovery_reports.missing_critical_data IS 'Array of critical data fields that are missing';
COMMENT ON COLUMN discovery_reports.missing_important_data IS 'Array of important (but not critical) data fields missing';
COMMENT ON COLUMN discovery_reports.admin_actions_needed IS 'Suggested admin actions to gather missing data';
COMMENT ON COLUMN discovery_reports.ready_for_client IS 'Whether the report can be shown to the client';
COMMENT ON COLUMN discovery_reports.published_to_client_at IS 'When admin explicitly published the report to client';
COMMENT ON COLUMN discovery_reports.published_by IS 'Which admin published the report';

-- Create a function to publish report to client
CREATE OR REPLACE FUNCTION publish_discovery_report_to_client(
  p_report_id UUID,
  p_publisher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE discovery_reports
  SET 
    status = 'published',
    ready_for_client = TRUE,
    published_to_client_at = NOW(),
    published_by = p_publisher_id,
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING jsonb_build_object(
    'id', id,
    'status', status,
    'published_at', published_to_client_at,
    'ready_for_client', ready_for_client
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION publish_discovery_report_to_client(UUID, UUID) TO authenticated;

-- Update RLS policy for client-side viewing
-- Clients can only see reports that have been published to them
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Clients can view published discovery reports" ON discovery_reports;
  
  -- Create the policy
  CREATE POLICY "Clients can view published discovery reports"
  ON discovery_reports
  FOR SELECT
  USING (
    ready_for_client = TRUE
    AND status = 'published'
    AND EXISTS (
      SELECT 1 FROM discovery_engagements de
      WHERE de.id = discovery_reports.engagement_id
      AND de.client_id = auth.uid()
    )
  );
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, skip
    NULL;
END $$;

