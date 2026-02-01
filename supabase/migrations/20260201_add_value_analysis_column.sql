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

-- Create an index for querying by exit readiness verdict
CREATE INDEX IF NOT EXISTS idx_bm_reports_exit_readiness 
ON bm_reports ((value_analysis->>'exitReadiness'->>'verdict'))
WHERE value_analysis IS NOT NULL;

-- Add useful computed column for quick filtering (optional)
-- This allows queries like: WHERE value_gap_percent > 30
-- Note: Requires the value_analysis to have consistent structure

