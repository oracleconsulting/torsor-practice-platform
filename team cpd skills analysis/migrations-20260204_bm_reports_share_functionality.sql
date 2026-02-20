-- Migration: Add share functionality to bm_reports
-- Date: 2026-02-04
-- Purpose: Allow practitioners to share/unshare benchmarking reports with clients

-- ============================================================================
-- PART 1: Add share columns to bm_reports
-- ============================================================================

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS is_shared_with_client BOOLEAN DEFAULT false;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES practice_members(id);

COMMENT ON COLUMN bm_reports.is_shared_with_client IS 
'When true, the report is visible in the client portal';

COMMENT ON COLUMN bm_reports.shared_at IS 
'Timestamp when the report was shared with the client';

COMMENT ON COLUMN bm_reports.shared_by IS 
'Practice member who shared the report';

-- ============================================================================
-- PART 2: Create index for efficient client portal queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bm_reports_shared 
ON bm_reports(is_shared_with_client) 
WHERE is_shared_with_client = true;

-- ============================================================================
-- PART 3: Update RLS policies for client access
-- ============================================================================

-- Drop existing client policy
DROP POLICY IF EXISTS "Clients can view own bm_reports" ON bm_reports;

-- Create new policy that respects share status
CREATE POLICY "Clients can view own SHARED bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_reports.engagement_id
      AND bme.client_id = auth.uid()
      AND bm_reports.is_shared_with_client = true  -- Only see shared reports
    )
  );

-- ============================================================================
-- PART 4: Log the changes
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Added share functionality to bm_reports:';
  RAISE NOTICE '  - is_shared_with_client: Controls visibility in client portal';
  RAISE NOTICE '  - shared_at: Timestamp of sharing';
  RAISE NOTICE '  - shared_by: Who shared it';
  RAISE NOTICE 'Updated RLS: Clients only see reports where is_shared_with_client = true';
END $$;
