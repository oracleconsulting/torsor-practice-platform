-- Migration: Add value_analysis column to bm_reports
-- Date: 2026-02-01
-- Purpose: Store business valuation analysis with HVA-based suppressors

-- Add value_analysis column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bm_reports' AND column_name = 'value_analysis'
  ) THEN
    ALTER TABLE bm_reports 
    ADD COLUMN value_analysis JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN bm_reports.value_analysis IS 
      'Business valuation analysis with baseline value, HVA suppressors, and exit readiness';
  END IF;
END $$;

-- Index for querying reports with value analysis
CREATE INDEX IF NOT EXISTS idx_bm_reports_has_value_analysis 
ON bm_reports (id)
WHERE value_analysis IS NOT NULL;

