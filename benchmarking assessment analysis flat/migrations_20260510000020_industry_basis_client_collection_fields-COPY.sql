-- ============================================================================
-- Migration: Add client_collection_fields to industry_valuation_basis
-- Purpose:   Registry-driven pre-revenue data gap detection
-- Context:   Pass 1 reads this column to determine which fields the engagement
--            must have populated before a defensible valuation can be produced.
--            Missing fields surface to bm_client_data_requests for the admin
--            and to the dashboard's gap card for the client.
-- ============================================================================

-- 1. Add column if it doesn't exist
ALTER TABLE industry_valuation_basis
ADD COLUMN IF NOT EXISTS client_collection_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN industry_valuation_basis.client_collection_fields IS 
  'Array of field descriptors that Pass 1 must validate as populated. Each entry: { field, label, source_table, type, required, rationale, drives }. Drives valuation gap detection and the bm_client_data_requests workflow.';

-- 2. Seed SAAS_REGTECH / pre_revenue with the canonical required-field set
UPDATE industry_valuation_basis
SET client_collection_fields = '[
  {
    "field": "target_exit_valuation",
    "label": "Target exit valuation",
    "source_table": "bm_engagements",
    "type": "currency",
    "required": true,
    "rationale": "Anchors the VC method back-solve. Without this, the implied pre-money is forecast-derived rather than founder-stated.",
    "drives": "VC method back-solve, defensible pre-money base case"
  },
  {
    "field": "exit_horizon_years",
    "label": "Exit horizon (years)",
    "source_table": "bm_engagements",
    "type": "integer",
    "required": true,
    "rationale": "Determines IRR discount factor in VC method. Common values: 5-7 years for SaaS.",
    "drives": "VC method back-solve, today pre-money implied"
  },
  {
    "field": "round_size_target",
    "label": "Round size target",
    "source_table": "bm_pre_revenue_signals",
    "type": "currency",
    "required": true,
    "rationale": "Required to compute today pre-money from today post-money. Drives dilution waterfall.",
    "drives": "Pre-money calculation, dilution scenarios"
  },
  {
    "field": "round_pre_money_target",
    "label": "Owner-stated pre-money",
    "source_table": "bm_pre_revenue_signals",
    "type": "currency",
    "required": true,
    "rationale": "Anchors the plausibility verdict — gap to base case, gap to stretch case.",
    "drives": "Versus owner-stated narrative, plausibility verdict"
  },
  {
    "field": "forecast_year_1",
    "label": "Year 1 revenue/ARR forecast",
    "source_table": "bm_pre_revenue_signals",
    "type": "jsonb",
    "required": true,
    "rationale": "First milestone anchor. Without this, the milestone path defaults to generic ARR targets.",
    "drives": "Milestone path, value step-ups"
  },
  {
    "field": "forecast_year_3",
    "label": "Year 3 revenue/ARR forecast",
    "source_table": "bm_pre_revenue_signals",
    "type": "jsonb",
    "required": true,
    "rationale": "Used as fallback target exit anchor when engagement.target_exit_valuation is missing. Drives Scorecard opportunity-size factor.",
    "drives": "VC method fallback, Scorecard weighting"
  },
  {
    "field": "pipeline_evidence_strength",
    "label": "Pipeline evidence strength",
    "source_table": "bm_pre_revenue_signals",
    "type": "text",
    "required": true,
    "rationale": "Drives the Scorecard marketing/sales factor and Berkus strategic relationships factor. Without it, both default to neutral scores.",
    "drives": "Scorecard factor, Berkus factor, investment readiness pipeline component"
  },
  {
    "field": "team_gaps_critical",
    "label": "Critical team gaps",
    "source_table": "bm_pre_revenue_signals",
    "type": "jsonb",
    "required": true,
    "rationale": "Each unfilled critical role is a forward suppressor. Without this list, the team_gaps suppressor cannot be detected.",
    "drives": "Forward suppressors, investment readiness team component"
  },
  {
    "field": "ip_protection_status",
    "label": "IP protection status",
    "source_table": "bm_pre_revenue_signals",
    "type": "jsonb",
    "required": true,
    "rationale": "Determines IP and corporate structuring suppressor. Specifically flags if IP migration is required.",
    "drives": "Forward suppressors, investment readiness data room component"
  },
  {
    "field": "cap_table_complexity",
    "label": "Cap table complexity",
    "source_table": "bm_pre_revenue_signals",
    "type": "text",
    "required": true,
    "rationale": "Determines cap table and governance suppressor severity.",
    "drives": "Forward suppressors, investment readiness governance component"
  },
  {
    "field": "data_room_completeness_pct",
    "label": "Data room completeness (%)",
    "source_table": "bm_pre_revenue_signals",
    "type": "percent",
    "required": true,
    "rationale": "Below 70% triggers data room suppressor. Investors often abandon at less than 50%.",
    "drives": "Investment readiness data room component"
  },
  {
    "field": "governance_board_status",
    "label": "Board governance status",
    "source_table": "bm_pre_revenue_signals",
    "type": "text",
    "required": true,
    "rationale": "Founder-only board signals weak governance to institutional investors.",
    "drives": "Forward suppressors, investment readiness governance component"
  }
]'::jsonb
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage = 'pre_revenue'
  AND is_current = true;

-- 3. Verification
SELECT 
  industry_code,
  business_stage,
  jsonb_array_length(client_collection_fields) as field_count,
  CASE 
    WHEN jsonb_array_length(client_collection_fields) >= 12 THEN 'seeded'
    ELSE 'failed'
  END as status
FROM industry_valuation_basis
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage = 'pre_revenue'
  AND is_current = true;
