-- ============================================================================
-- Migration: 20260121_add_burn_rate_kpi.sql
-- Purpose: Add burn_rate KPI definition (critical for pre-revenue/startup clients)
-- ============================================================================

INSERT INTO ma_kpi_definitions (
  code, name, category, description, calculation_notes, good_for,
  unit, decimal_places, higher_is_better, default_target,
  industry_benchmarks, commentary_triggers, rag_thresholds,
  is_mandatory, display_order
) VALUES (
  'burn_rate',
  'Monthly Burn Rate',
  'Cash & Working Capital',
  'Net monthly cash outflow (critical for pre-revenue and growth businesses)',
  'Total Cash Out - Total Cash In for the month. For pre-revenue: Total monthly operating costs.',
  'Understanding cash consumption and runway planning',
  'currency',
  0,
  FALSE, -- Lower burn is better
  NULL, -- No default target, depends on runway goals
  '{"saas_pre_revenue": 25000, "saas_early": 50000, "funded_startup": 100000}',
  '[
    {"condition": "runway_months < 6", "severity": "red", "template": "At £{value}/month burn with current cash, runway is under 6 months. Critical."},
    {"condition": "runway_months < 12", "severity": "amber", "template": "Burn rate of £{value}/month gives {runway_months} months runway. Consider extending."},
    {"condition": "increasing_trend", "severity": "amber", "template": "Burn rate increased to £{value}/month. Up {change_pct}% from last month."},
    {"condition": "exceeds_plan", "severity": "amber", "template": "Burn rate £{value} exceeds planned £{target} by {diff_pct}%."}
  ]',
  '{"amber_pct": 15, "red_pct": 30}',
  FALSE,
  6 -- After working_capital_ratio in Cash & Working Capital
) ON CONFLICT (code) DO NOTHING;

-- Also add cash_runway as it's commonly needed with burn rate
INSERT INTO ma_kpi_definitions (
  code, name, category, description, calculation_notes, good_for,
  unit, decimal_places, higher_is_better, default_target,
  industry_benchmarks, commentary_triggers, rag_thresholds,
  is_mandatory, display_order
) VALUES (
  'cash_runway',
  'Cash Runway',
  'Cash & Working Capital',
  'Months of operation possible at current burn rate',
  'True Cash / Monthly Burn Rate',
  'Planning hiring, fundraising, and growth decisions',
  'months',
  1,
  TRUE, -- More runway is better
  12, -- 12 months is healthy target
  '{"saas_pre_revenue": 18, "saas_early": 12, "bootstrapped": 6}',
  '[
    {"condition": "value < 3", "severity": "red", "template": "Critical: Only {value} months runway. Immediate action required."},
    {"condition": "value < 6", "severity": "red", "template": "Runway of {value} months is below safety threshold. Extend or cut burn."},
    {"condition": "value < 12", "severity": "amber", "template": "{value} months runway. Consider fundraising timeline or burn reduction."},
    {"condition": "declining_trend", "severity": "amber", "template": "Runway declining - was {previous} months, now {value} months."}
  ]',
  '{"amber_months": 12, "red_months": 6}',
  FALSE,
  7 -- After burn_rate
) ON CONFLICT (code) DO NOTHING;

