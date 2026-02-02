-- Migration: 20260202_value_suppressors_overhaul.sql
-- Purpose: Add dedicated columns for value suppressors and tier configuration

-- ============================================================================
-- PART 1: VALUE SUPPRESSOR COLUMNS
-- ============================================================================

-- Add dedicated value suppressor columns for easier querying
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS value_suppressors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_value_discount DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS baseline_multiple DECIMAL(4,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS discounted_multiple DECIMAL(4,2);

-- Add comments
COMMENT ON COLUMN bm_reports.value_suppressors IS 'Array of value suppressor objects from Pass 1/3 analysis';
COMMENT ON COLUMN bm_reports.total_value_discount IS 'Total discount percentage (0-60)';
COMMENT ON COLUMN bm_reports.baseline_multiple IS 'Industry baseline EBITDA multiple';
COMMENT ON COLUMN bm_reports.discounted_multiple IS 'Effective multiple after suppressors applied';

-- ============================================================================
-- PART 2: SCENARIOS COLUMN
-- ============================================================================

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS scenarios JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS scenarios_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN bm_reports.scenarios IS 'Array of scenario projection objects';
COMMENT ON COLUMN bm_reports.scenarios_generated_at IS 'When scenarios were last generated';

-- ============================================================================
-- PART 3: SERVICE TIER TRACKING
-- ============================================================================

ALTER TABLE bm_engagements 
ADD COLUMN IF NOT EXISTS service_tier TEXT DEFAULT 'tier2'
CHECK (service_tier IN ('tier1', 'tier2', 'tier3'));

ALTER TABLE bm_engagements 
ADD COLUMN IF NOT EXISTS tier_price INTEGER,
ADD COLUMN IF NOT EXISTS tier_name TEXT;

-- ============================================================================
-- PART 4: TIER CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code TEXT UNIQUE NOT NULL,
  tier_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  price_type TEXT DEFAULT 'one_off' CHECK (price_type IN ('one_off', 'monthly')),
  commitment_months INTEGER,
  features JSONB NOT NULL,
  report_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier configurations (only if table is empty)
INSERT INTO bm_tier_config (tier_code, tier_name, price, price_type, commitment_months, features, report_config)
SELECT * FROM (VALUES
  ('tier1', 'Benchmark Report', 2000, 'one_off', NULL::INTEGER, 
   '{"metrics_count": 6, "opportunities_count": 2, "includes_value_bridge": true, "includes_scenarios": false, "includes_scripts": false, "includes_action_plan": false, "support_type": "30min_call"}'::JSONB,
   '{"show_full_suppressors": false, "show_scenarios": false, "show_all_opportunities": false, "show_conversation_scripts": false, "show_action_timeline": false}'::JSONB
  ),
  ('tier2', 'Benchmark + Value Analysis', 4500, 'one_off', NULL::INTEGER,
   '{"metrics_count": 12, "opportunities_count": 7, "includes_value_bridge": true, "includes_scenarios": true, "includes_scripts": true, "includes_action_plan": true, "support_type": "60min_strategy"}'::JSONB,
   '{"show_full_suppressors": true, "show_scenarios": true, "show_all_opportunities": true, "show_conversation_scripts": true, "show_action_timeline": true}'::JSONB
  ),
  ('tier3', 'Benchmark Advisory Programme', 1500, 'monthly', 12,
   '{"metrics_count": 20, "opportunities_count": 999, "includes_value_bridge": true, "includes_scenarios": true, "includes_scripts": true, "includes_action_plan": true, "includes_quarterly_rebenchmark": true, "includes_monthly_tracking": true, "support_type": "monthly_sessions"}'::JSONB,
   '{"show_full_suppressors": true, "show_scenarios": true, "show_all_opportunities": true, "show_conversation_scripts": true, "show_action_timeline": true, "show_progress_tracking": true}'::JSONB
  )
) AS v(tier_code, tier_name, price, price_type, commitment_months, features, report_config)
WHERE NOT EXISTS (SELECT 1 FROM bm_tier_config);

-- ============================================================================
-- PART 5: INDEX FOR VALUE ANALYSIS QUERIES
-- ============================================================================

-- Index for suppressor count queries
CREATE INDEX IF NOT EXISTS idx_bm_reports_value_discount 
ON bm_reports (total_value_discount)
WHERE total_value_discount IS NOT NULL;

-- Index for tier-based filtering
CREATE INDEX IF NOT EXISTS idx_bm_engagements_tier 
ON bm_engagements (service_tier);

