-- ============================================================================
-- Add principal_activity to client_financial_data (if not already present)
-- ============================================================================
-- Principal activity is extracted from statutory accounts by process-accounts-upload.
-- Feeds into Pass 1 industry detection for correct benchmarks.
-- ============================================================================

ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS principal_activity TEXT DEFAULT NULL;

COMMENT ON COLUMN client_financial_data.principal_activity IS 'Principal activity from statutory accounts. Feeds into Pass 1 industry detection.';
