-- COPY - Do not edit. Reference only. Source: supabase/migrations/20260205_add_discovery_admin_context.sql
-- Add admin context fields to discovery_engagements
ALTER TABLE discovery_engagements
  ADD COLUMN IF NOT EXISTS admin_business_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_context_note TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_flags JSONB DEFAULT '{}';

ALTER TABLE discovery_reports
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'trading_product',
  ADD COLUMN IF NOT EXISTS client_type_confidence INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS client_type_signals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS framework_overrides JSONB DEFAULT '{}';

COMMENT ON COLUMN discovery_engagements.admin_business_type IS 'Admin override for business type classification.';
COMMENT ON COLUMN discovery_engagements.admin_context_note IS 'Admin context note that feeds into classification algorithm.';
COMMENT ON COLUMN discovery_engagements.admin_flags IS 'Admin flags for special handling.';
COMMENT ON COLUMN discovery_reports.client_type IS 'Classified business type from Pass 1.';
COMMENT ON COLUMN discovery_reports.client_type_confidence IS 'Confidence score 0-100 for the classification.';
COMMENT ON COLUMN discovery_reports.client_type_signals IS 'Array of signals that led to this classification.';
COMMENT ON COLUMN discovery_reports.framework_overrides IS 'Framework overrides based on client type.';
