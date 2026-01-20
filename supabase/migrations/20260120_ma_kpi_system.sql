-- ============================================================================
-- MANAGEMENT ACCOUNTS KPI SYSTEM
-- ============================================================================
-- Tables for KPI definitions, client selections, and tracking
-- ============================================================================

-- ============================================================================
-- TABLE 1: KPI DEFINITIONS (The catalog of all available KPIs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ma_kpi_definitions (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  calculation_notes TEXT,
  good_for TEXT,
  unit VARCHAR(20) NOT NULL, -- 'currency', 'percentage', 'days', 'ratio', 'number'
  decimal_places INTEGER DEFAULT 2,
  higher_is_better BOOLEAN,
  default_target DECIMAL(15,4),
  -- Industry benchmarks by sector
  industry_benchmarks JSONB DEFAULT '{}'::jsonb,
  -- Auto-commentary trigger conditions
  commentary_triggers JSONB DEFAULT '[]'::jsonb,
  -- Data source hints
  data_sources JSONB DEFAULT '[]'::jsonb,
  -- RAG thresholds (relative to target)
  rag_thresholds JSONB DEFAULT '{}'::jsonb,
  -- Tier availability
  min_tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_category ON ma_kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON ma_kpi_definitions(is_active);

-- ============================================================================
-- TABLE 2: KPI SELECTIONS (Which KPIs each engagement has selected)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ma_kpi_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) ON DELETE CASCADE,
  kpi_code VARCHAR(50) REFERENCES ma_kpi_definitions(code) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  selected_by UUID REFERENCES auth.users(id),
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 100,
  -- Custom target override (NULL = use default)
  custom_target DECIMAL(15,4),
  -- Custom RAG thresholds override
  custom_rag_thresholds JSONB,
  -- Notes about why this KPI was selected
  selection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id, kpi_code)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_kpi_selections_engagement ON ma_kpi_selections(engagement_id);
CREATE INDEX IF NOT EXISTS idx_kpi_selections_kpi ON ma_kpi_selections(kpi_code);

-- ============================================================================
-- TABLE 3: KPI TRACKING (Monthly values and history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ma_kpi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) ON DELETE CASCADE,
  kpi_code VARCHAR(50) REFERENCES ma_kpi_definitions(code) ON DELETE CASCADE,
  -- Period this value relates to
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- The actual value
  value DECIMAL(15,4),
  -- Comparison values
  previous_value DECIMAL(15,4), -- Last period
  previous_year_value DECIMAL(15,4), -- Same period last year
  -- Target and benchmark
  target_value DECIMAL(15,4),
  benchmark_value DECIMAL(15,4),
  -- Status and trend
  rag_status VARCHAR(10), -- 'green', 'amber', 'red'
  trend VARCHAR(20), -- 'improving', 'stable', 'declining'
  -- Change metrics
  change_vs_previous DECIMAL(15,4),
  change_vs_previous_pct DECIMAL(10,4),
  change_vs_previous_year DECIMAL(15,4),
  change_vs_previous_year_pct DECIMAL(10,4),
  -- Commentary
  auto_commentary TEXT, -- Generated from triggers
  human_commentary TEXT, -- Added by accountant
  -- Supporting data
  supporting_data JSONB, -- Breakdown, watchlist items, etc.
  -- Metadata
  data_source VARCHAR(50), -- 'xero', 'qbo', 'manual', 'calculated'
  data_quality VARCHAR(20), -- 'verified', 'estimated', 'provisional'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(engagement_id, kpi_code, period_end)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_engagement ON ma_kpi_tracking(engagement_id);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_period ON ma_kpi_tracking(period_end);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_kpi ON ma_kpi_tracking(kpi_code);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_rag ON ma_kpi_tracking(rag_status);

-- ============================================================================
-- TABLE 4: KPI RECOMMENDATIONS (AI-suggested KPIs from assessment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ma_kpi_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES ma_assessment_reports(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES ma_engagements(id) ON DELETE CASCADE,
  kpi_code VARCHAR(50) REFERENCES ma_kpi_definitions(code) ON DELETE CASCADE,
  -- Recommendation details
  priority INTEGER DEFAULT 1, -- 1 = highest priority
  rationale TEXT, -- Why this KPI is recommended
  relevance_score DECIMAL(5,2), -- 0-100 score
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(report_id, kpi_code)
);

CREATE INDEX IF NOT EXISTS idx_kpi_recommendations_report ON ma_kpi_recommendations(report_id);
CREATE INDEX IF NOT EXISTS idx_kpi_recommendations_engagement ON ma_kpi_recommendations(engagement_id);

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Current KPIs with latest values for an engagement
CREATE OR REPLACE VIEW ma_kpi_dashboard AS
SELECT 
  s.engagement_id,
  s.kpi_code,
  d.name AS kpi_name,
  d.category,
  d.unit,
  d.decimal_places,
  d.higher_is_better,
  s.display_order,
  s.is_mandatory,
  COALESCE(s.custom_target, d.default_target) AS target_value,
  t.value AS current_value,
  t.previous_value,
  t.previous_year_value,
  t.rag_status,
  t.trend,
  t.change_vs_previous,
  t.change_vs_previous_pct,
  t.period_end AS as_of_date,
  t.auto_commentary,
  t.human_commentary,
  d.industry_benchmarks
FROM ma_kpi_selections s
JOIN ma_kpi_definitions d ON d.code = s.kpi_code
LEFT JOIN LATERAL (
  SELECT * FROM ma_kpi_tracking t2
  WHERE t2.engagement_id = s.engagement_id 
    AND t2.kpi_code = s.kpi_code
  ORDER BY t2.period_end DESC
  LIMIT 1
) t ON TRUE
WHERE d.is_active = TRUE
ORDER BY s.display_order, d.name;

-- View: KPI history for trend charts
CREATE OR REPLACE VIEW ma_kpi_history AS
SELECT 
  t.engagement_id,
  t.kpi_code,
  d.name AS kpi_name,
  d.unit,
  d.decimal_places,
  d.higher_is_better,
  t.period_end,
  t.value,
  t.target_value,
  t.benchmark_value,
  t.rag_status,
  t.trend
FROM ma_kpi_tracking t
JOIN ma_kpi_definitions d ON d.code = t.kpi_code
WHERE d.is_active = TRUE
ORDER BY t.engagement_id, t.kpi_code, t.period_end;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate RAG status based on value, target, and KPI rules
CREATE OR REPLACE FUNCTION calculate_kpi_rag_status(
  p_kpi_code VARCHAR(50),
  p_value DECIMAL(15,4),
  p_target DECIMAL(15,4),
  p_custom_thresholds JSONB DEFAULT NULL
) RETURNS VARCHAR(10) AS $$
DECLARE
  v_definition ma_kpi_definitions%ROWTYPE;
  v_thresholds JSONB;
  v_higher_is_better BOOLEAN;
  v_amber_threshold DECIMAL;
  v_red_threshold DECIMAL;
BEGIN
  -- Get KPI definition
  SELECT * INTO v_definition FROM ma_kpi_definitions WHERE code = p_kpi_code;
  
  IF v_definition IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  -- Use custom thresholds if provided, otherwise use definition
  v_thresholds := COALESCE(p_custom_thresholds, v_definition.rag_thresholds);
  v_higher_is_better := v_definition.higher_is_better;
  
  -- If no target, can't calculate RAG
  IF p_target IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  -- Default thresholds if not specified
  v_amber_threshold := COALESCE((v_thresholds->>'amber_pct')::DECIMAL, 10);
  v_red_threshold := COALESCE((v_thresholds->>'red_pct')::DECIMAL, 20);
  
  IF v_higher_is_better THEN
    -- Higher is better (e.g., profit margin)
    IF p_value >= p_target THEN
      RETURN 'green';
    ELSIF p_value >= p_target * (1 - v_amber_threshold/100) THEN
      RETURN 'amber';
    ELSE
      RETURN 'red';
    END IF;
  ELSE
    -- Lower is better (e.g., debtor days)
    IF p_value <= p_target THEN
      RETURN 'green';
    ELSIF p_value <= p_target * (1 + v_amber_threshold/100) THEN
      RETURN 'amber';
    ELSE
      RETURN 'red';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trend based on recent values
CREATE OR REPLACE FUNCTION calculate_kpi_trend(
  p_engagement_id UUID,
  p_kpi_code VARCHAR(50)
) RETURNS VARCHAR(20) AS $$
DECLARE
  v_values DECIMAL[];
  v_higher_is_better BOOLEAN;
  v_avg_change DECIMAL;
BEGIN
  -- Get higher_is_better flag
  SELECT higher_is_better INTO v_higher_is_better 
  FROM ma_kpi_definitions WHERE code = p_kpi_code;
  
  -- Get last 3 values
  SELECT ARRAY_AGG(value ORDER BY period_end) INTO v_values
  FROM (
    SELECT value, period_end
    FROM ma_kpi_tracking
    WHERE engagement_id = p_engagement_id AND kpi_code = p_kpi_code
    ORDER BY period_end DESC
    LIMIT 3
  ) recent;
  
  IF array_length(v_values, 1) < 2 THEN
    RETURN 'insufficient_data';
  END IF;
  
  -- Calculate average change direction
  -- Note: v_values[1] is oldest, v_values[n] is newest
  v_avg_change := (v_values[array_length(v_values, 1)] - v_values[1]) / (array_length(v_values, 1) - 1);
  
  -- Determine trend
  IF ABS(v_avg_change) < 0.5 THEN -- Less than 0.5 unit change average
    RETURN 'stable';
  ELSIF (v_avg_change > 0 AND v_higher_is_better) OR (v_avg_change < 0 AND NOT v_higher_is_better) THEN
    RETURN 'improving';
  ELSE
    RETURN 'declining';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get KPI count limit by tier
CREATE OR REPLACE FUNCTION get_kpi_limit_by_tier(p_tier VARCHAR(20)) 
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'bronze' THEN RETURN 3;
    WHEN 'silver' THEN RETURN 5;
    WHEN 'gold' THEN RETURN 8;
    WHEN 'platinum' THEN RETURN 999; -- Unlimited
    ELSE RETURN 3;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ma_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_kpi_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_kpi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_kpi_recommendations ENABLE ROW LEVEL SECURITY;

-- KPI Definitions: Anyone can read (it's a catalog)
CREATE POLICY "kpi_definitions_read" ON ma_kpi_definitions
  FOR SELECT USING (true);

-- KPI Selections: Practice members can manage their engagements' selections
CREATE POLICY "kpi_selections_practice_access" ON ma_kpi_selections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_kpi_selections.engagement_id
        AND pm.user_id = auth.uid()
    )
  );

-- KPI Tracking: Practice members can read/write their engagements' data
CREATE POLICY "kpi_tracking_practice_access" ON ma_kpi_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_kpi_tracking.engagement_id
        AND pm.user_id = auth.uid()
    )
  );

-- KPI Recommendations: Practice members can access
CREATE POLICY "kpi_recommendations_practice_access" ON ma_kpi_recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_kpi_recommendations.engagement_id
        AND pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kpi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kpi_definitions_updated
  BEFORE UPDATE ON ma_kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION update_kpi_updated_at();

CREATE TRIGGER trg_kpi_selections_updated
  BEFORE UPDATE ON ma_kpi_selections
  FOR EACH ROW EXECUTE FUNCTION update_kpi_updated_at();

CREATE TRIGGER trg_kpi_tracking_updated
  BEFORE UPDATE ON ma_kpi_tracking
  FOR EACH ROW EXECUTE FUNCTION update_kpi_updated_at();

-- ============================================================================
-- SEED DATA: KPI DEFINITIONS
-- ============================================================================

INSERT INTO ma_kpi_definitions (
  code, name, category, description, calculation_notes, good_for,
  unit, decimal_places, higher_is_better, default_target,
  industry_benchmarks, commentary_triggers, rag_thresholds,
  is_mandatory, display_order
) VALUES

-- ============================================================================
-- CATEGORY 1: CASH & WORKING CAPITAL
-- ============================================================================

(
  'true_cash',
  'True Cash Position',
  'Cash & Working Capital',
  'Actual available cash after all known commitments',
  'Bank Balance - VAT Provision - PAYE/NI Due - Corp Tax Provision - Committed Payments + Confirmed Receivables (due <14 days, >90% probability)',
  'Understanding real spending power vs bank balance illusion',
  'currency',
  0,
  TRUE,
  NULL, -- No default target, depends on business size
  '{}',
  '[
    {"condition": "runway_months < 1", "severity": "red", "template": "Critical: Less than 1 month of runway. Immediate cash action required."},
    {"condition": "runway_months < 2", "severity": "amber", "template": "True Cash covers {runway_months} months of operations. Consider tightening cash collection."},
    {"condition": "change_pct < -20", "severity": "amber", "template": "True Cash decreased by {change_pct}% this month. Review commitments and collection."}
  ]',
  '{"green_months": 2, "amber_months": 1}',
  TRUE, -- Mandatory for all tiers
  1
),

(
  'debtor_days',
  'Debtor Days',
  'Cash & Working Capital',
  'Average time to collect payment from customers',
  '(Trade Debtors / Credit Sales) × 365',
  'Managing cash collection and customer payment behaviour',
  'days',
  0,
  FALSE, -- Lower is better
  35,
  '{"professional_services": 42, "agency": 38, "contractor": 30, "retail": 14}',
  '[
    {"condition": "value > previous + 5", "severity": "amber", "template": "Debtor days increased by {change} days. Collection may be slipping."},
    {"condition": "value > 45", "severity": "amber", "template": "At {value} days, youre waiting over 6 weeks on average to collect."},
    {"condition": "value > 60", "severity": "red", "template": "Debtor days of {value} is critically high. Cash flow at risk."}
  ]',
  '{"amber_pct": 15, "red_pct": 30}',
  FALSE,
  2
),

(
  'creditor_days',
  'Creditor Days',
  'Cash & Working Capital',
  'Average time to pay suppliers',
  '(Trade Creditors / Credit Purchases) × 365',
  'Managing supplier relationships and cash flow timing',
  'days',
  0,
  NULL, -- Neither higher nor lower is universally better
  30,
  '{"professional_services": 30, "agency": 35, "contractor": 28}',
  '[
    {"condition": "value > 60", "severity": "amber", "template": "Creditor days of {value} may strain supplier relationships."},
    {"condition": "value < debtor_days - 15", "severity": "amber", "template": "Youre paying suppliers {diff} days faster than customers pay you. Cash flow risk."}
  ]',
  '{"amber_pct": 20, "red_pct": 40}',
  FALSE,
  3
),

(
  'cash_conversion_cycle',
  'Cash Conversion Cycle',
  'Cash & Working Capital',
  'Days between paying suppliers and collecting from customers',
  'Debtor Days + WIP Days - Creditor Days (for services) or + Inventory Days (for product)',
  'Understanding working capital efficiency',
  'days',
  0,
  FALSE, -- Lower (or negative) is better
  30,
  '{"professional_services": 25, "agency": 35, "contractor": 20}',
  '[
    {"condition": "value > 60", "severity": "amber", "template": "Cash conversion of {value} days means significant working capital tied up."},
    {"condition": "value > previous + 10", "severity": "amber", "template": "Cash conversion cycle increased by {change} days. Working capital efficiency declining."}
  ]',
  '{"amber_pct": 25, "red_pct": 50}',
  FALSE,
  4
),

(
  'working_capital_ratio',
  'Working Capital Ratio',
  'Cash & Working Capital',
  'Ability to pay short-term obligations (Current Ratio)',
  'Current Assets / Current Liabilities',
  'Assessing short-term financial health',
  'ratio',
  2,
  TRUE, -- Higher is generally better
  1.5,
  '{"professional_services": 1.8, "agency": 1.5, "contractor": 2.0}',
  '[
    {"condition": "value < 1.0", "severity": "red", "template": "Working capital ratio below 1.0 means current liabilities exceed current assets. Technical insolvency risk."},
    {"condition": "value < 1.2", "severity": "amber", "template": "Working capital ratio of {value} is tight. Limited buffer for unexpected costs."},
    {"condition": "change < -0.3", "severity": "amber", "template": "Working capital ratio dropped by {change}. Review whats driving the decline."}
  ]',
  '{"amber_pct": 20, "red_pct": 33}',
  FALSE,
  5
),

-- ============================================================================
-- CATEGORY 2: REVENUE & GROWTH
-- ============================================================================

(
  'monthly_revenue',
  'Monthly Revenue',
  'Revenue & Growth',
  'Total invoiced revenue for the period',
  'Sum of all sales invoices dated within the period',
  'Tracking top-line business performance',
  'currency',
  0,
  TRUE,
  NULL, -- Depends on business size
  '{}',
  '[
    {"condition": "yoy_change_pct < -10", "severity": "amber", "template": "Revenue down {yoy_change_pct}% vs same month last year."},
    {"condition": "mom_change_pct < -15", "severity": "amber", "template": "Revenue down {mom_change_pct}% vs last month."},
    {"condition": "declining_3_months", "severity": "red", "template": "Third consecutive month of revenue decline. Review pipeline and sales activity."}
  ]',
  '{}',
  FALSE,
  10
),

(
  'yoy_revenue_growth',
  'Year-on-Year Growth',
  'Revenue & Growth',
  'Growth compared to same period last year',
  '((Current Month - Same Month Last Year) / Same Month Last Year) × 100',
  'Understanding true growth trajectory (seasonality removed)',
  'percentage',
  1,
  TRUE,
  10, -- 10% growth target
  '{"professional_services": 8, "agency": 12, "saas": 25}',
  '[
    {"condition": "value < 0 for 3+ months", "severity": "amber", "template": "Third consecutive month of negative YoY growth."},
    {"condition": "value declining but positive", "severity": "info", "template": "Still growing at {value}%, but growth rate is slowing."}
  ]',
  '{"amber_pct": 50, "red_pct": 100}',
  FALSE,
  11
),

(
  'avg_project_value',
  'Average Project Value',
  'Revenue & Growth',
  'Typical size of work undertaken',
  'Total Revenue / Number of Projects or Invoices',
  'Understanding pricing power and project mix',
  'currency',
  0,
  TRUE, -- Higher generally better
  NULL,
  '{}',
  '[
    {"condition": "declining_trend", "severity": "info", "template": "Average project value declining - are you taking on smaller work?"},
    {"condition": "high_variance", "severity": "info", "template": "Wide variance in project sizes - consider segmenting analysis."}
  ]',
  '{}',
  FALSE,
  12
),

(
  'revenue_per_employee',
  'Revenue per Employee',
  'Revenue & Growth',
  'Productivity and efficiency measure',
  'Total Revenue / Average FTE Headcount (annualised)',
  'Tracking productivity and staffing efficiency',
  'currency',
  0,
  TRUE,
  120000, -- £120k per head
  '{"professional_services": 135000, "agency": 95000, "consulting": 150000}',
  '[
    {"condition": "declining_trend", "severity": "amber", "template": "Revenue per employee declining - headcount growing faster than revenue."},
    {"condition": "below_benchmark", "severity": "info", "template": "At £{value}, youre below the industry average of £{benchmark}."}
  ]',
  '{"amber_pct": 15, "red_pct": 30}',
  FALSE,
  13
),

(
  'recurring_revenue_pct',
  'Recurring vs Project Revenue',
  'Revenue & Growth',
  'Revenue stability and predictability',
  '(Retainer/Subscription Revenue / Total Revenue) × 100',
  'Understanding revenue predictability and client loyalty',
  'percentage',
  1,
  TRUE, -- Higher recurring is generally better
  30, -- 30% recurring target
  '{"professional_services": 40, "agency": 25, "consulting": 35}',
  '[
    {"condition": "value < 20", "severity": "info", "template": "Only {value}% recurring revenue. High dependency on winning new projects."},
    {"condition": "declining_trend", "severity": "amber", "template": "Recurring revenue percentage declining. Are retainer clients churning?"}
  ]',
  '{}',
  FALSE,
  14
),

-- ============================================================================
-- CATEGORY 3: PROFITABILITY
-- ============================================================================

(
  'gross_margin',
  'Gross Profit Margin',
  'Profitability',
  'Profitability before overheads',
  '(Revenue - Direct Costs) / Revenue × 100. Direct costs = labour, subcontractors, project-specific costs',
  'Understanding core service profitability',
  'percentage',
  1,
  TRUE,
  50, -- 50% gross margin target
  '{"professional_services": 55, "agency": 45, "consulting": 60, "contractor": 40}',
  '[
    {"condition": "value < target - 5", "severity": "amber", "template": "Gross margin of {value}% is {diff} points below target."},
    {"condition": "declining_3_months", "severity": "amber", "template": "Gross margin has declined for 3 consecutive months."},
    {"condition": "drop > 5", "severity": "red", "template": "Gross margin dropped {drop} points this month. Review project costs."}
  ]',
  '{"amber_pct": 10, "red_pct": 20}',
  FALSE,
  20
),

(
  'operating_margin',
  'Operating Profit Margin',
  'Profitability',
  'Profitability from operations before interest and tax',
  '(Gross Profit - Operating Expenses) / Revenue × 100',
  'Understanding overall operational efficiency',
  'percentage',
  1,
  TRUE,
  15, -- 15% operating margin target
  '{"professional_services": 18, "agency": 12, "consulting": 20}',
  '[
    {"condition": "value < target", "severity": "amber", "template": "Operating margin of {value}% is below target of {target}%."},
    {"condition": "declining while gross stable", "severity": "amber", "template": "Operating margin declining but gross margin stable - overhead creep."},
    {"condition": "value < 0", "severity": "red", "template": "Operating loss this period. Revenue not covering costs."}
  ]',
  '{"amber_pct": 20, "red_pct": 50}',
  FALSE,
  21
),

(
  'net_margin',
  'Net Profit Margin',
  'Profitability',
  'Bottom-line profitability after all costs',
  '(Net Profit / Revenue) × 100',
  'Understanding true profitability after everything',
  'percentage',
  1,
  TRUE,
  10, -- 10% net margin target
  '{"professional_services": 12, "agency": 8, "consulting": 15}',
  '[
    {"condition": "value < 5", "severity": "amber", "template": "Net margin of {value}% is low. Limited buffer for growth or surprises."},
    {"condition": "declining faster than operating", "severity": "info", "template": "Net margin declining faster than operating - check interest/tax."}
  ]',
  '{"amber_pct": 25, "red_pct": 50}',
  FALSE,
  22
),

(
  'revenue_per_salary',
  'Revenue per £1 Salary',
  'Profitability',
  'Efficiency of labour spend',
  'Total Revenue / Total Salary Costs (inc. NI, pension)',
  'Tracking labour efficiency and salary burden',
  'ratio',
  2,
  TRUE,
  2.5, -- £2.50 revenue per £1 salary
  '{"professional_services": 2.8, "agency": 2.2, "consulting": 3.0}',
  '[
    {"condition": "value < 2.0", "severity": "amber", "template": "Revenue per £1 salary is {value} - high salary burden."},
    {"condition": "declining_trend", "severity": "amber", "template": "Ratio declining - salaries growing faster than revenue."}
  ]',
  '{"amber_pct": 15, "red_pct": 25}',
  FALSE,
  23
),

(
  'overhead_pct',
  'Overhead as % of Revenue',
  'Profitability',
  'Overhead burden relative to sales',
  '(Total Overheads / Revenue) × 100',
  'Understanding fixed cost burden',
  'percentage',
  1,
  FALSE, -- Lower is better
  35, -- 35% overhead target
  '{"professional_services": 30, "agency": 40, "consulting": 28}',
  '[
    {"condition": "value > 40", "severity": "amber", "template": "Overheads at {value}% of revenue. Review for optimisation opportunities."},
    {"condition": "increasing while revenue flat", "severity": "amber", "template": "Overhead percentage increasing while revenue flat."},
    {"condition": "any_category > 15", "severity": "info", "template": "{category} alone is {pct}% of revenue."}
  ]',
  '{"amber_pct": 15, "red_pct": 30}',
  FALSE,
  24
),

-- ============================================================================
-- CATEGORY 4: UTILISATION & EFFICIENCY
-- ============================================================================

(
  'billable_utilisation',
  'Billable Utilisation',
  'Utilisation & Efficiency',
  'Percentage of available time spent on billable work',
  '(Billable Hours / Available Hours) × 100',
  'Tracking team productivity and capacity usage',
  'percentage',
  1,
  TRUE,
  75, -- 75% utilisation target
  '{"professional_services": 75, "agency": 65, "consulting": 70}',
  '[
    {"condition": "value < 65", "severity": "amber", "template": "Utilisation at {value}% - significant unbilled capacity."},
    {"condition": "declining_trend", "severity": "amber", "template": "Utilisation declining - review pipeline and team allocation."},
    {"condition": "high but revenue flat", "severity": "info", "template": "High utilisation but revenue flat - possible rate issue."}
  ]',
  '{"amber_pct": 15, "red_pct": 25}',
  FALSE,
  30
),

(
  'effective_hourly_rate',
  'Effective Hourly Rate',
  'Utilisation & Efficiency',
  'Actual rate being achieved',
  'Total Revenue / Total Billable Hours',
  'Understanding pricing effectiveness and rate leakage',
  'currency',
  0,
  TRUE,
  100, -- £100/hour target
  '{"professional_services": 120, "agency": 85, "consulting": 150}',
  '[
    {"condition": "declining_trend", "severity": "amber", "template": "Effective rate declining - are you discounting or experiencing scope creep?"},
    {"condition": "below_standard_rate", "severity": "info", "template": "Effective rate £{value} is below your standard rate of £{standard}."}
  ]',
  '{"amber_pct": 10, "red_pct": 25}',
  FALSE,
  31
),

(
  'wip_value',
  'Work in Progress (WIP)',
  'Utilisation & Efficiency',
  'Unbilled work that should convert to revenue',
  'Hours worked but not invoiced × Rate',
  'Managing billing cycle and cash conversion',
  'currency',
  0,
  NULL, -- Context dependent
  NULL,
  '{}',
  '[
    {"condition": "value > 1_month_revenue", "severity": "amber", "template": "WIP exceeds 1 month of revenue - £{value} tied up in unbilled work."},
    {"condition": "old_wip > 60_days", "severity": "amber", "template": "£{old_value} of WIP is over 60 days old. Review billing status."},
    {"condition": "growing_faster_than_revenue", "severity": "info", "template": "WIP growing faster than revenue - not converting to invoices."}
  ]',
  '{}',
  FALSE,
  32
),

(
  'project_margin',
  'Project Margin by Client',
  'Utilisation & Efficiency',
  'Profitability of individual clients/projects',
  '(Project Revenue - Direct Costs - Allocated Overhead) / Project Revenue × 100',
  'Identifying profitable and unprofitable clients',
  'percentage',
  1,
  TRUE,
  30, -- 30% project margin target
  '{"professional_services": 35, "agency": 25, "consulting": 40}',
  '[
    {"condition": "any_client < 15", "severity": "amber", "template": "{client} is only delivering {margin}% margin."},
    {"condition": "biggest_client_not_most_profitable", "severity": "info", "template": "Your largest client isnt your most profitable."},
    {"condition": "any_negative", "severity": "red", "template": "{client} is loss-making at {margin}% margin."}
  ]',
  '{"amber_pct": 25, "red_pct": 50}',
  FALSE,
  33
),

-- ============================================================================
-- CATEGORY 5: CLIENT HEALTH
-- ============================================================================

(
  'client_concentration',
  'Client Concentration',
  'Client Health',
  'Dependency risk on key clients (Top 3 as % of revenue)',
  '(Revenue from Top 3 Clients / Total Revenue) × 100',
  'Managing client dependency risk',
  'percentage',
  1,
  FALSE, -- Lower is better (less concentrated)
  50, -- Under 50% target
  '{}',
  '[
    {"condition": "value > 50", "severity": "amber", "template": "Top 3 clients represent {value}% of revenue. Concentration risk."},
    {"condition": "single_client > 25", "severity": "amber", "template": "{client} alone is {pct}% of revenue."},
    {"condition": "increasing_trend", "severity": "info", "template": "Client concentration increasing - fewer clients, more dependency."}
  ]',
  '{"amber_pct": 0, "red_pct": 20}', -- Target is ceiling, not floor
  FALSE,
  40
),

(
  'client_retention',
  'Client Retention Rate',
  'Client Health',
  'Percentage of clients retained year-on-year',
  '(Clients at End who were also at Start / Clients at Start) × 100',
  'Understanding client loyalty and churn',
  'percentage',
  1,
  TRUE,
  85, -- 85% retention target
  '{"professional_services": 90, "agency": 80, "consulting": 85}',
  '[
    {"condition": "value < 85", "severity": "amber", "template": "Retention at {value}% means losing more than 1 in 7 clients."},
    {"condition": "lost_top_10", "severity": "amber", "template": "Lost {client} who was in top 10 by revenue."},
    {"condition": "declining_trend", "severity": "amber", "template": "Retention rate declining - review client satisfaction."}
  ]',
  '{"amber_pct": 10, "red_pct": 20}',
  FALSE,
  41
),

(
  'client_lifetime_value',
  'Client Lifetime Value',
  'Client Health',
  'Total expected revenue from a client relationship',
  'Average Annual Revenue per Client × Average Client Lifespan',
  'Understanding long-term client value',
  'currency',
  0,
  TRUE,
  NULL,
  '{}',
  '[
    {"condition": "declining_trend", "severity": "info", "template": "CLV declining - clients staying shorter or spending less."},
    {"condition": "clv_vs_cac_low", "severity": "amber", "template": "CLV to CAC ratio is low - acquisition cost high relative to value."}
  ]',
  '{}',
  FALSE,
  42
),

(
  'new_client_revenue_pct',
  'New vs Repeat Revenue',
  'Client Health',
  'Business development effectiveness',
  '(Revenue from clients acquired this period / Total Revenue) × 100',
  'Balancing growth and retention',
  'percentage',
  1,
  NULL, -- Neither extreme is good
  20, -- ~20% from new clients
  '{}',
  '[
    {"condition": "value < 10", "severity": "info", "template": "Only {value}% from new clients - are you growing the client base?"},
    {"condition": "value > 40", "severity": "info", "template": "{value}% from new clients - watch for retention issues."},
    {"condition": "declining_trend", "severity": "info", "template": "New client revenue declining - review sales pipeline."}
  ]',
  '{}',
  FALSE,
  43
)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  calculation_notes = EXCLUDED.calculation_notes,
  good_for = EXCLUDED.good_for,
  unit = EXCLUDED.unit,
  decimal_places = EXCLUDED.decimal_places,
  higher_is_better = EXCLUDED.higher_is_better,
  default_target = EXCLUDED.default_target,
  industry_benchmarks = EXCLUDED.industry_benchmarks,
  commentary_triggers = EXCLUDED.commentary_triggers,
  rag_thresholds = EXCLUDED.rag_thresholds,
  is_mandatory = EXCLUDED.is_mandatory,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON ma_kpi_definitions TO authenticated;
GRANT ALL ON ma_kpi_selections TO authenticated;
GRANT ALL ON ma_kpi_tracking TO authenticated;
GRANT ALL ON ma_kpi_recommendations TO authenticated;
GRANT SELECT ON ma_kpi_dashboard TO authenticated;
GRANT SELECT ON ma_kpi_history TO authenticated;

