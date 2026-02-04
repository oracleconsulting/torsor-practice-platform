-- Fix: Add share tracking to bm_engagements (clients can read this table)
-- This solves the RLS circular dependency where clients can't check 
-- if a report is shared because they can only see shared reports

ALTER TABLE bm_engagements 
ADD COLUMN IF NOT EXISTS report_shared_with_client BOOLEAN DEFAULT false;

ALTER TABLE bm_engagements 
ADD COLUMN IF NOT EXISTS report_shared_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bm_engagements.report_shared_with_client IS 
'Mirrors bm_reports.is_shared_with_client - needed because clients can read engagements but not unshared reports';

-- Update existing engagements where reports are already shared
UPDATE bm_engagements e
SET 
  report_shared_with_client = r.is_shared_with_client,
  report_shared_at = r.shared_at
FROM bm_reports r
WHERE r.engagement_id = e.id
AND r.is_shared_with_client = true;

-- Verify
SELECT 
  e.id as engagement_id,
  e.status,
  e.report_shared_with_client,
  r.is_shared_with_client as report_shared
FROM bm_engagements e
LEFT JOIN bm_reports r ON r.engagement_id = e.id
WHERE e.status IN ('generated', 'approved', 'published');
