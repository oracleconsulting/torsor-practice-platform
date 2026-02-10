-- Add admin context fields to discovery_engagements
-- These allow admins to override or guide business type classification
ALTER TABLE discovery_engagements 
  ADD COLUMN IF NOT EXISTS admin_business_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_context_note TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_flags JSONB DEFAULT '{}';

-- Ensure client_type columns exist on discovery_reports  
-- (They may already exist from the opportunities system)
ALTER TABLE discovery_reports 
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'trading_product',
  ADD COLUMN IF NOT EXISTS client_type_confidence INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS client_type_signals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS framework_overrides JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN discovery_engagements.admin_business_type IS 'Admin override for business type classification (e.g., investment_vehicle, funded_startup). If set, classification will use this value with high confidence.';
COMMENT ON COLUMN discovery_engagements.admin_context_note IS 'Admin context note that feeds into classification algorithm (e.g., "Property portfolio", "VC-backed SaaS startup").';
COMMENT ON COLUMN discovery_engagements.admin_flags IS 'Admin flags for special handling (e.g., {"cash_constrained": true, "high_net_worth": true}).';

COMMENT ON COLUMN discovery_reports.client_type IS 'Classified business type from Pass 1 (trading_product, trading_agency, investment_vehicle, funded_startup, professional_practice, lifestyle_business).';
COMMENT ON COLUMN discovery_reports.client_type_confidence IS 'Confidence score 0-100 for the classification.';
COMMENT ON COLUMN discovery_reports.client_type_signals IS 'Array of signals that led to this classification (e.g., ["High freehold property", "Minimal staff"]).';
COMMENT ON COLUMN discovery_reports.framework_overrides IS 'Framework overrides based on client type (e.g., useAssetValuation, payrollBenchmarkRelevant, appropriateServices).';
