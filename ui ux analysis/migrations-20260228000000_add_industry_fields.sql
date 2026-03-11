-- ============================================================================
-- Add industry identification fields to client_financial_data
-- ============================================================================
-- Principal activity is extracted from uploaded accounts (Companies House text).
-- Industry code can be set by admin override or auto-detected.
-- These feed into Pass 1 industry detection to ensure correct benchmarks.
-- ============================================================================

ALTER TABLE client_financial_data
  ADD COLUMN IF NOT EXISTS principal_activity TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sic_code TEXT DEFAULT NULL;

COMMENT ON COLUMN client_financial_data.principal_activity IS 'Principal activity extracted from statutory accounts (e.g. "Training of money market traders"). Used by Pass 1 detectIndustry().';
COMMENT ON COLUMN client_financial_data.sic_code IS 'SIC code if found in accounts or Companies House data.';

-- Add admin_industry_override to discovery_engagements
ALTER TABLE discovery_engagements
  ADD COLUMN IF NOT EXISTS admin_industry_override TEXT DEFAULT NULL;

COMMENT ON COLUMN discovery_engagements.admin_industry_override IS 'Admin override for industry benchmark code (e.g. "training", "education", "professional_services"). Takes absolute priority over auto-detection in Pass 1.';
