-- ============================================================================
-- CLIENT TYPE CLASSIFICATION SYSTEM
-- ============================================================================
-- Adds client type classification to discovery reports for intelligent
-- service matching and appropriate analysis application
-- ============================================================================

-- Add client type columns to discovery_reports
ALTER TABLE discovery_reports 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'trading_product',
ADD COLUMN IF NOT EXISTS client_type_confidence INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS client_type_signals JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS framework_overrides JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS asset_valuation JSONB;

-- Add check constraint for client_type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discovery_reports_client_type_check'
  ) THEN
    ALTER TABLE discovery_reports
    ADD CONSTRAINT discovery_reports_client_type_check CHECK (
      client_type IN ('trading_product', 'trading_agency', 'professional_practice', 
                       'investment_vehicle', 'funded_startup', 'lifestyle_business')
    );
  END IF;
END $$;

-- Add index for client type queries
CREATE INDEX IF NOT EXISTS idx_discovery_reports_client_type 
ON discovery_reports(client_type);

-- ============================================================================
-- DISCOVERY OPPORTUNITIES TABLE
-- ============================================================================
-- Stores opportunities identified from discovery analysis

CREATE TABLE IF NOT EXISTS discovery_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
  client_id UUID,
  
  -- Opportunity identity
  opportunity_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('financial', 'operational', 'strategic', 'personal', 'wealth')),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'opportunity')),
  
  -- Evidence
  data_evidence TEXT,
  data_values JSONB DEFAULT '{}',
  benchmark_comparison TEXT,
  
  -- Financial impact
  financial_impact_type TEXT CHECK (financial_impact_type IN ('risk', 'upside', 'cost_saving', 'value_creation', 'unknown')),
  financial_impact_amount DECIMAL(12,2),
  financial_impact_confidence TEXT CHECK (financial_impact_confidence IN ('high', 'medium', 'low')),
  impact_calculation TEXT,
  life_impact TEXT,
  
  -- Service mapping (one or the other)
  recommended_service_id UUID REFERENCES services(id),
  service_fit_score INTEGER CHECK (service_fit_score BETWEEN 0 AND 100),
  service_fit_rationale TEXT,
  service_fit_limitation TEXT,
  
  -- OR new concept suggestion
  suggested_concept_id UUID REFERENCES service_concepts(id),
  
  -- Adviser tools
  talking_point TEXT,
  question_to_ask TEXT,
  quick_win TEXT,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id, opportunity_code)
);

-- Indexes for discovery_opportunities
CREATE INDEX IF NOT EXISTS idx_discovery_opps_engagement ON discovery_opportunities(engagement_id);
CREATE INDEX IF NOT EXISTS idx_discovery_opps_client ON discovery_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_discovery_opps_severity ON discovery_opportunities(severity);
CREATE INDEX IF NOT EXISTS idx_discovery_opps_category ON discovery_opportunities(category);

-- Enable RLS
ALTER TABLE discovery_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "discovery_opportunities_read" ON discovery_opportunities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "discovery_opportunities_write" ON discovery_opportunities
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- ADD OPPORTUNITY TRACKING TO DISCOVERY_REPORTS
-- ============================================================================

ALTER TABLE discovery_reports
ADD COLUMN IF NOT EXISTS opportunities_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opportunity_count INTEGER DEFAULT 0;

-- ============================================================================
-- ADD INVESTMENT PROPERTY TO CLIENT_FINANCIAL_CONTEXT
-- ============================================================================

ALTER TABLE client_financial_context
ADD COLUMN IF NOT EXISTS investment_property DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS rental_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS consultancy_fees DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS subcontractor_costs DECIMAL(12,2);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN discovery_reports.client_type IS 
'Business type classification: trading_product, trading_agency, professional_practice, investment_vehicle, funded_startup, lifestyle_business';

COMMENT ON COLUMN discovery_reports.framework_overrides IS 
'Framework settings based on client type: useEarningsValuation, benchmarkAgainst, maxRecommendedInvestment, etc.';

COMMENT ON COLUMN discovery_reports.asset_valuation IS 
'Asset-based valuation for investment vehicles (netAssets, investmentProperty, totalAssetValue)';

COMMENT ON TABLE discovery_opportunities IS 
'Opportunities identified from discovery analysis. Links to services or creates service concepts.';

-- ============================================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT CLIENT TYPE
-- ============================================================================

UPDATE discovery_reports 
SET client_type = 'trading_product',
    client_type_confidence = 50,
    client_type_signals = '[]'::jsonb,
    framework_overrides = '{}'::jsonb
WHERE client_type IS NULL;

