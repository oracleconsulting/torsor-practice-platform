-- Migration: Add raise_narrative column to bm_reports (Patch B2)
-- Nullable TEXT; populated by Pass 2 for pre-revenue / early-revenue only.

BEGIN;

ALTER TABLE bm_reports
  ADD COLUMN IF NOT EXISTS raise_narrative TEXT;

COMMENT ON COLUMN bm_reports.raise_narrative IS
  'Pre-revenue raise-centric narrative: raise status, use of funds, pipeline deals, bridge to exit. NULL for operating mode and older regens.';

COMMIT;
