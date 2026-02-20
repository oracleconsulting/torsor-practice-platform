-- ============================================================================
-- MAKE snapshot_id NULLABLE IN ma_monthly_insights
-- ============================================================================
-- In v2 mode, insights are generated from extracted_financials directly,
-- not from financial snapshots. Therefore snapshot_id should be nullable.
-- ============================================================================

-- Make snapshot_id nullable to support v2 insights
ALTER TABLE ma_monthly_insights 
ALTER COLUMN snapshot_id DROP NOT NULL;

-- Add a check constraint to ensure either snapshot_id OR extracted_financials_id is set
ALTER TABLE ma_monthly_insights
DROP CONSTRAINT IF EXISTS ma_monthly_insights_snapshot_or_extracted_check;

ALTER TABLE ma_monthly_insights
ADD CONSTRAINT ma_monthly_insights_snapshot_or_extracted_check 
CHECK (
  (snapshot_id IS NOT NULL AND extracted_financials_id IS NULL) OR
  (snapshot_id IS NULL AND extracted_financials_id IS NOT NULL)
);

COMMENT ON CONSTRAINT ma_monthly_insights_snapshot_or_extracted_check ON ma_monthly_insights IS 
'Ensures each insight has either a snapshot_id (v1) or extracted_financials_id (v2), but not both';

