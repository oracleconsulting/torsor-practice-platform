-- ============================================================================
-- Add pass1_data column to sa_audit_reports for two-pass generation
-- ============================================================================

ALTER TABLE sa_audit_reports 
ADD COLUMN IF NOT EXISTS pass1_data JSONB;

COMMENT ON COLUMN sa_audit_reports.pass1_data IS 'Structured data from Pass 1 (Sonnet extraction) - stored for Pass 2 narrative generation';

