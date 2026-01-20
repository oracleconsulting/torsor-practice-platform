-- ============================================================================
-- MANAGEMENT ACCOUNTS PORTAL - CORE SCHEMA
-- ============================================================================
-- Creates the foundational tables for MA service delivery:
-- - Engagements (client contracts)
-- - Periods (monthly/quarterly reporting periods)
-- - Documents (uploaded files)
-- - Financial Data (extracted/entered figures)
-- - Insights, Watch List, Forecasts, Scenarios, Profitability
-- ============================================================================

-- ============================================
-- MA ENGAGEMENTS
-- ============================================
-- The core contract between practice and client for MA services

CREATE TABLE IF NOT EXISTS ma_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES practice_members(id) NOT NULL,
  practice_id UUID REFERENCES practices(id) NOT NULL,
  
  -- Tier and frequency
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly')),
  
  -- Pricing (stored for historical reference)
  monthly_fee DECIMAL(10,2) NOT NULL,
  
  -- Engagement dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if ongoing
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
  
  -- Onboarding
  onboarding_completed_at TIMESTAMPTZ,
  xero_connected BOOLEAN DEFAULT FALSE,
  qbo_connected BOOLEAN DEFAULT FALSE,
  
  -- Client's Tuesday Question (template for each period)
  default_tuesday_question TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES practice_members(id),
  reviewer_id UUID REFERENCES practice_members(id),
  
  -- Year end info (important for MA)
  financial_year_end_month INTEGER CHECK (financial_year_end_month BETWEEN 1 AND 12),
  vat_registered BOOLEAN DEFAULT FALSE,
  vat_quarter_end_month INTEGER CHECK (vat_quarter_end_month BETWEEN 1 AND 12),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MA REPORTING PERIODS
-- ============================================
-- Each period represents one delivery cycle (month or quarter)

CREATE TABLE IF NOT EXISTS ma_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- Period definition
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label VARCHAR(50), -- "January 2025" or "Q1 2025"
  
  -- Status workflow
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Awaiting data
    'data_received',     -- Xero data pulled/uploaded
    'in_progress',       -- Being prepared
    'review',            -- Ready for review
    'approved',          -- Reviewed and approved
    'delivered',         -- Sent to client
    'client_reviewed'    -- Client has viewed
  )),
  
  -- Key dates
  due_date DATE, -- When report should be delivered
  data_received_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  client_viewed_at TIMESTAMPTZ,
  
  -- Tuesday Question for this period
  tuesday_question TEXT,
  tuesday_question_asked_at TIMESTAMPTZ,
  tuesday_answer TEXT,
  tuesday_answer_format VARCHAR(20) CHECK (tuesday_answer_format IN ('text', 'calculation', 'scenario', 'chart')),
  
  -- Review call
  review_call_scheduled_at TIMESTAMPTZ,
  review_call_completed_at TIMESTAMPTZ,
  review_call_notes TEXT,
  review_call_duration_mins INTEGER,
  review_call_recording_url TEXT,
  
  -- Delivery checklist status (JSON for flexibility)
  checklist_status JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  prepared_by UUID REFERENCES practice_members(id),
  reviewed_by UUID REFERENCES practice_members(id),
  
  UNIQUE(engagement_id, period_start)
);

-- ============================================
-- MA DOCUMENTS
-- ============================================
-- Uploaded files (MA packs, reports, supporting docs)

CREATE TABLE IF NOT EXISTS ma_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) NOT NULL,
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL, -- Denormalized for easier queries
  
  -- Document info
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'pnl',                    -- Profit & Loss
    'balance_sheet',          -- Balance Sheet
    'cash_flow',              -- Cash Flow Statement
    'aged_debtors',           -- Aged Debtors Report
    'aged_creditors',         -- Aged Creditors Report
    'trial_balance',          -- Trial Balance
    'bank_reconciliation',    -- Bank Rec
    'vat_return',             -- VAT Return
    'management_pack',        -- Combined MA Pack (PDF)
    'supporting',             -- Other supporting docs
    'board_pack',             -- Board Pack (Platinum)
    'client_report'           -- Final delivered report
  )),
  
  -- File storage
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Extraction status (for data extraction from uploads)
  extraction_status VARCHAR(20) DEFAULT 'pending' CHECK (extraction_status IN (
    'pending', 'processing', 'completed', 'failed', 'not_required'
  )),
  extracted_data JSONB, -- Parsed financial data from document
  extraction_error TEXT,
  
  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MA FINANCIAL DATA
-- ============================================
-- Extracted or manually entered financial figures for a period

CREATE TABLE IF NOT EXISTS ma_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) NOT NULL UNIQUE,
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- P&L Summary
  revenue DECIMAL(15,2),
  cost_of_sales DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  overheads DECIMAL(15,2),
  operating_profit DECIMAL(15,2),
  interest DECIMAL(15,2),
  tax_charge DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  
  -- Revenue breakdown (optional)
  revenue_breakdown JSONB, -- {"service_a": 50000, "service_b": 30000}
  
  -- Balance Sheet Summary
  cash_at_bank DECIMAL(15,2),
  trade_debtors DECIMAL(15,2),
  other_debtors DECIMAL(15,2),
  stock DECIMAL(15,2),
  wip DECIMAL(15,2),
  prepayments DECIMAL(15,2),
  fixed_assets DECIMAL(15,2),
  trade_creditors DECIMAL(15,2),
  other_creditors DECIMAL(15,2),
  accruals DECIMAL(15,2),
  vat_liability DECIMAL(15,2),
  paye_liability DECIMAL(15,2),
  corporation_tax_liability DECIMAL(15,2),
  loans DECIMAL(15,2),
  directors_loans DECIMAL(15,2),
  share_capital DECIMAL(15,2),
  retained_earnings DECIMAL(15,2),
  
  -- Working Capital (calculated)
  current_assets DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  net_current_assets DECIMAL(15,2),
  
  -- True Cash Calculation
  true_cash DECIMAL(15,2),
  true_cash_calculation JSONB, -- Detailed breakdown
  true_cash_runway_months DECIMAL(5,2),
  
  -- Comparatives
  prior_month_revenue DECIMAL(15,2),
  prior_year_revenue DECIMAL(15,2),
  budget_revenue DECIMAL(15,2),
  
  -- Headcount
  fte_count DECIMAL(5,2),
  headcount_breakdown JSONB, -- {"directors": 2, "employees": 5, "contractors": 2}
  
  -- Monthly operating costs (for runway calculation)
  monthly_operating_costs DECIMAL(15,2),
  
  -- Data quality
  data_source VARCHAR(20) CHECK (data_source IN ('xero_api', 'qbo_api', 'upload', 'manual')),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low')),
  data_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  entered_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MA INSIGHTS
-- ============================================
-- Observations, warnings, and recommendations for a period

CREATE TABLE IF NOT EXISTS ma_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) NOT NULL,
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- Insight details
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'observation',      -- Something we noticed
    'warning',          -- Something concerning
    'opportunity',      -- Something positive
    'recommendation',   -- What to do (Silver+)
    'action_required'   -- Urgent action needed
  )),
  
  category VARCHAR(50) CHECK (category IN (
    'cash', 'profitability', 'clients', 'operations', 
    'growth', 'efficiency', 'risk', 'tax', 'compliance'
  )),
  
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Supporting data
  metric_value DECIMAL(15,4),
  metric_comparison DECIMAL(15,4), -- What it was before/should be
  metric_unit VARCHAR(20),
  
  -- Recommendation (Silver+ only)
  recommendation TEXT,
  recommendation_priority VARCHAR(20) CHECK (recommendation_priority IN ('high', 'medium', 'low')),
  recommendation_timing VARCHAR(100), -- "Within 2 weeks", "Before month end"
  
  -- Related entities
  related_kpi_code VARCHAR(50) REFERENCES ma_kpi_definitions(code),
  related_client_name VARCHAR(200), -- If insight is about one of their clients
  supporting_data JSONB, -- Charts, calculations, etc.
  
  -- Visibility
  min_tier VARCHAR(20) DEFAULT 'bronze',
  show_to_client BOOLEAN DEFAULT TRUE,
  
  -- Status
  client_acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,
  action_completed_at TIMESTAMPTZ,
  
  -- Ordering
  display_order INTEGER,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MA WATCH LIST
-- ============================================
-- Items to monitor across periods

CREATE TABLE IF NOT EXISTS ma_watch_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- Watch item
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
    'debtor',           -- Overdue debtor
    'creditor',         -- Payment due
    'kpi_threshold',    -- KPI approaching/breaching threshold
    'cash_warning',     -- Cash forecast warning
    'client_concern',   -- Client profitability issue
    'renewal',          -- Contract renewal coming
    'vat_quarter',      -- VAT quarter end approaching
    'year_end',         -- Year end approaching
    'custom'            -- Manual watch item
  )),
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Reference
  reference_type VARCHAR(50), -- 'invoice', 'client', 'kpi', 'date'
  reference_id VARCHAR(100), -- Invoice number, client name, KPI code, etc.
  
  -- Thresholds
  current_value DECIMAL(15,4),
  threshold_value DECIMAL(15,4),
  threshold_direction VARCHAR(20) CHECK (threshold_direction IN ('above', 'below', 'approaching', 'overdue')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Dates
  due_date DATE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_notes TEXT,
  
  -- Period this was first flagged in (optional)
  origin_period_id UUID REFERENCES ma_periods(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- MA CASH FORECASTS (Gold+)
-- ============================================

CREATE TABLE IF NOT EXISTS ma_cash_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  period_id UUID REFERENCES ma_periods(id), -- Which period this forecast is for
  
  -- Forecast metadata
  forecast_type VARCHAR(20) NOT NULL CHECK (forecast_type IN ('13_week', '6_month', '12_month')),
  forecast_date DATE NOT NULL, -- As-of date
  base_cash_position DECIMAL(15,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded')),
  
  -- Warnings
  has_warnings BOOLEAN DEFAULT FALSE,
  first_warning_week INTEGER, -- Which week/month has first warning
  lowest_balance DECIMAL(15,2),
  lowest_balance_week INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS ma_cash_forecast_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID REFERENCES ma_cash_forecasts(id) ON DELETE CASCADE NOT NULL,
  
  -- Period (week or month)
  period_number INTEGER NOT NULL, -- 1-13 for weekly, 1-12 for monthly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label VARCHAR(50), -- "Week 1", "Feb 2025"
  
  -- Forecast values
  opening_balance DECIMAL(15,2),
  
  -- Inflows
  forecast_receipts DECIMAL(15,2) DEFAULT 0,
  receipt_details JSONB DEFAULT '[]', -- [{name, amount, confidence}]
  
  -- Outflows
  forecast_payments DECIMAL(15,2) DEFAULT 0,
  payment_details JSONB DEFAULT '[]', -- [{name, amount, type}]
  
  -- Calculated
  net_movement DECIMAL(15,2),
  closing_balance DECIMAL(15,2),
  
  -- Alerts
  is_warning BOOLEAN DEFAULT FALSE,
  warning_message TEXT,
  warning_severity VARCHAR(20) CHECK (warning_severity IN ('watch', 'caution', 'critical')),
  recommended_actions JSONB DEFAULT '[]',
  
  -- Actuals (filled in as time passes)
  actual_receipts DECIMAL(15,2),
  actual_payments DECIMAL(15,2),
  actual_closing DECIMAL(15,2),
  variance_receipts DECIMAL(15,2),
  variance_payments DECIMAL(15,2),
  variance_notes TEXT,
  
  UNIQUE(forecast_id, period_number)
);

-- ============================================
-- MA SCENARIOS (Gold+)
-- ============================================

CREATE TABLE IF NOT EXISTS ma_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- Scenario definition
  scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN (
    'hire',           -- New hire analysis
    'pricing',        -- Price change impact
    'client_loss',    -- What if we lose X client
    'investment',     -- Capital investment
    'expansion',      -- Office/location expansion
    'custom'          -- Other
  )),
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_pre_built BOOLEAN DEFAULT FALSE, -- Gold gets 3 pre-built
  
  -- Inputs (varies by scenario type)
  inputs JSONB NOT NULL DEFAULT '{}',
  
  -- Outputs (calculated)
  outputs JSONB DEFAULT '{}',
  
  -- Summary
  summary_headline TEXT, -- "Yes, hire if utilisation reaches 70%"
  summary_detail TEXT,
  recommendation VARCHAR(20) CHECK (recommendation IN ('proceed', 'caution', 'dont_proceed', 'needs_more_info')),
  
  -- Key metrics from scenario
  break_even_months INTEGER,
  first_year_impact DECIMAL(15,2),
  cash_impact_monthly DECIMAL(15,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MA CLIENT PROFITABILITY (Gold+)
-- ============================================
-- Analysis of THEIR clients (not our client relationship)

CREATE TABLE IF NOT EXISTS ma_client_profitability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) NOT NULL,
  engagement_id UUID REFERENCES ma_engagements(id) NOT NULL,
  
  -- Client reference (their client, not ours)
  client_name VARCHAR(200) NOT NULL,
  client_ref VARCHAR(50), -- Reference in their system
  
  -- Revenue
  revenue DECIMAL(15,2) NOT NULL,
  revenue_ytd DECIMAL(15,2),
  revenue_prior_year DECIMAL(15,2),
  
  -- Direct costs
  direct_labour_cost DECIMAL(15,2),
  direct_labour_hours DECIMAL(10,2),
  subcontractor_cost DECIMAL(15,2),
  other_direct_costs DECIMAL(15,2),
  total_direct_costs DECIMAL(15,2),
  
  -- Gross margin
  gross_profit DECIMAL(15,2),
  gross_margin_pct DECIMAL(5,2),
  
  -- Overhead allocation
  allocated_overhead DECIMAL(15,2),
  overhead_allocation_method VARCHAR(50) CHECK (overhead_allocation_method IN (
    'revenue_proportion', 'labour_hours', 'fixed', 'none'
  )),
  
  -- Net margin
  net_profit DECIMAL(15,2),
  net_margin_pct DECIMAL(5,2),
  
  -- Analysis
  effective_hourly_rate DECIMAL(10,2),
  target_margin_pct DECIMAL(5,2),
  margin_vs_target DECIMAL(5,2),
  
  -- RAG and verdict
  rag_status VARCHAR(10) CHECK (rag_status IN ('green', 'amber', 'red')),
  verdict VARCHAR(50) CHECK (verdict IN (
    'protect_grow',      -- Green - good margin, protect and grow
    'maintain',          -- Amber - acceptable, maintain relationship
    'reprice',           -- Amber - needs price increase
    'renegotiate',       -- Amber - needs scope change
    'exit'               -- Red - losing money, consider exit
  )),
  
  -- Commentary
  analysis_notes TEXT,
  recommended_action TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ma_engagements_client ON ma_engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_practice ON ma_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_status ON ma_engagements(status);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_assigned ON ma_engagements(assigned_to);

CREATE INDEX IF NOT EXISTS idx_ma_periods_engagement ON ma_periods(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_periods_status ON ma_periods(status);
CREATE INDEX IF NOT EXISTS idx_ma_periods_dates ON ma_periods(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ma_periods_due ON ma_periods(due_date);

CREATE INDEX IF NOT EXISTS idx_ma_documents_period ON ma_documents(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_documents_engagement ON ma_documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_documents_type ON ma_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_ma_financial_data_period ON ma_financial_data(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_financial_data_engagement ON ma_financial_data(engagement_id);

CREATE INDEX IF NOT EXISTS idx_ma_insights_period ON ma_insights(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_insights_engagement ON ma_insights(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_insights_type ON ma_insights(insight_type);

CREATE INDEX IF NOT EXISTS idx_ma_watch_list_engagement ON ma_watch_list(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_watch_list_status ON ma_watch_list(status);

CREATE INDEX IF NOT EXISTS idx_ma_cash_forecasts_engagement ON ma_cash_forecasts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_cash_forecasts_status ON ma_cash_forecasts(status);

CREATE INDEX IF NOT EXISTS idx_ma_scenarios_engagement ON ma_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenarios_type ON ma_scenarios(scenario_type);

CREATE INDEX IF NOT EXISTS idx_ma_client_profitability_period ON ma_client_profitability(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_client_profitability_engagement ON ma_client_profitability(engagement_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ma_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_watch_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_cash_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_cash_forecast_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_client_profitability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Practice members can see/edit all for their practice
-- ============================================

-- Engagements: Practice members can see their practice's engagements
CREATE POLICY "Practice members can view engagements"
ON ma_engagements FOR SELECT
TO authenticated
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Practice members can insert engagements"
ON ma_engagements FOR INSERT
TO authenticated
WITH CHECK (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Practice members can update engagements"
ON ma_engagements FOR UPDATE
TO authenticated
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Periods: Based on engagement access
CREATE POLICY "Users can view periods for accessible engagements"
ON ma_periods FOR SELECT
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert periods"
ON ma_periods FOR INSERT
TO authenticated
WITH CHECK (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update periods"
ON ma_periods FOR UPDATE
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

-- Documents, Financial Data, Insights, Watch List, Forecasts, Scenarios, Profitability
-- All follow same pattern based on engagement access

CREATE POLICY "Access documents via engagement"
ON ma_documents FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access financial data via engagement"
ON ma_financial_data FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access insights via engagement"
ON ma_insights FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access watch list via engagement"
ON ma_watch_list FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access forecasts via engagement"
ON ma_cash_forecasts FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access forecast periods via forecast"
ON ma_cash_forecast_periods FOR ALL
TO authenticated
USING (
  forecast_id IN (
    SELECT id FROM ma_cash_forecasts 
    WHERE engagement_id IN (
      SELECT id FROM ma_engagements 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Access scenarios via engagement"
ON ma_scenarios FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Access client profitability via engagement"
ON ma_client_profitability FOR ALL
TO authenticated
USING (
  engagement_id IN (
    SELECT id FROM ma_engagements 
    WHERE practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate period label from dates
CREATE OR REPLACE FUNCTION generate_period_label(
  p_start DATE,
  p_end DATE,
  p_type VARCHAR(20)
) RETURNS VARCHAR(50) AS $$
BEGIN
  IF p_type = 'monthly' THEN
    RETURN TO_CHAR(p_end, 'FMMonth YYYY');
  ELSIF p_type = 'quarterly' THEN
    RETURN 'Q' || EXTRACT(QUARTER FROM p_end)::TEXT || ' ' || EXTRACT(YEAR FROM p_end)::TEXT;
  ELSE
    RETURN TO_CHAR(p_start, 'DD Mon') || ' - ' || TO_CHAR(p_end, 'DD Mon YYYY');
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate True Cash from financial data
CREATE OR REPLACE FUNCTION calculate_true_cash(
  p_cash_at_bank DECIMAL(15,2),
  p_vat_liability DECIMAL(15,2),
  p_paye_liability DECIMAL(15,2),
  p_corporation_tax_liability DECIMAL(15,2),
  p_committed_payments DECIMAL(15,2) DEFAULT 0,
  p_confirmed_receivables DECIMAL(15,2) DEFAULT 0
) RETURNS DECIMAL(15,2) AS $$
BEGIN
  RETURN COALESCE(p_cash_at_bank, 0)
    - COALESCE(p_vat_liability, 0)
    - COALESCE(p_paye_liability, 0)
    - COALESCE(p_corporation_tax_liability, 0)
    - COALESCE(p_committed_payments, 0)
    + COALESCE(p_confirmed_receivables, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate runway months
CREATE OR REPLACE FUNCTION calculate_runway_months(
  p_true_cash DECIMAL(15,2),
  p_monthly_costs DECIMAL(15,2)
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_monthly_costs IS NULL OR p_monthly_costs <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(p_true_cash / p_monthly_costs, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-create periods for an engagement
CREATE OR REPLACE FUNCTION create_periods_for_engagement(
  p_engagement_id UUID,
  p_months_ahead INTEGER DEFAULT 3
) RETURNS INTEGER AS $$
DECLARE
  v_engagement RECORD;
  v_period_start DATE;
  v_period_end DATE;
  v_period_label VARCHAR(50);
  v_count INTEGER := 0;
BEGIN
  -- Get engagement details
  SELECT * INTO v_engagement FROM ma_engagements WHERE id = p_engagement_id;
  
  IF v_engagement IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Create periods
  FOR i IN 0..p_months_ahead LOOP
    IF v_engagement.frequency = 'monthly' THEN
      v_period_start := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL)::DATE;
      v_period_end := (DATE_TRUNC('month', v_period_start) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSE -- quarterly
      v_period_start := DATE_TRUNC('quarter', CURRENT_DATE + (i * 3 || ' months')::INTERVAL)::DATE;
      v_period_end := (DATE_TRUNC('quarter', v_period_start) + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
    END IF;
    
    v_period_label := generate_period_label(v_period_start, v_period_end, v_engagement.frequency);
    
    -- Insert if not exists
    INSERT INTO ma_periods (
      engagement_id,
      period_type,
      period_start,
      period_end,
      period_label,
      due_date
    ) VALUES (
      p_engagement_id,
      v_engagement.frequency,
      v_period_start,
      v_period_end,
      v_period_label,
      v_period_end + INTERVAL '10 days' -- Due 10 days after period end
    )
    ON CONFLICT (engagement_id, period_start) DO NOTHING;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ma_engagements_updated_at
  BEFORE UPDATE ON ma_engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ma_periods_updated_at
  BEFORE UPDATE ON ma_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ma_financial_data_updated_at
  BEFORE UPDATE ON ma_financial_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ma_scenarios_updated_at
  BEFORE UPDATE ON ma_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- Engagement summary view
CREATE OR REPLACE VIEW ma_engagement_summary AS
SELECT 
  e.id,
  e.client_id,
  pm.name AS client_name,
  pm.client_company,
  e.practice_id,
  e.tier,
  e.frequency,
  e.monthly_fee,
  e.status,
  e.start_date,
  e.assigned_to,
  assignee.name AS assigned_to_name,
  -- Current period info
  cp.id AS current_period_id,
  cp.period_label AS current_period_label,
  cp.status AS current_period_status,
  cp.due_date AS current_period_due_date,
  -- Counts
  (SELECT COUNT(*) FROM ma_periods WHERE engagement_id = e.id) AS total_periods,
  (SELECT COUNT(*) FROM ma_periods WHERE engagement_id = e.id AND status = 'delivered') AS delivered_periods
FROM ma_engagements e
LEFT JOIN practice_members pm ON e.client_id = pm.id
LEFT JOIN practice_members assignee ON e.assigned_to = assignee.id
LEFT JOIN LATERAL (
  SELECT * FROM ma_periods 
  WHERE engagement_id = e.id 
  ORDER BY period_end DESC 
  LIMIT 1
) cp ON true;

-- Period with KPI summary
CREATE OR REPLACE VIEW ma_period_summary AS
SELECT 
  p.id,
  p.engagement_id,
  p.period_label,
  p.period_start,
  p.period_end,
  p.status,
  p.due_date,
  p.delivered_at,
  p.tuesday_question,
  p.tuesday_answer,
  e.tier,
  e.client_id,
  pm.name AS client_name,
  -- Financial summary
  fd.revenue,
  fd.net_profit,
  fd.true_cash,
  fd.true_cash_runway_months,
  -- KPI summary
  (SELECT COUNT(*) FROM ma_kpi_tracking kt WHERE kt.engagement_id = p.engagement_id AND kt.period_end = p.period_end) AS kpi_count,
  (SELECT COUNT(*) FROM ma_kpi_tracking kt WHERE kt.engagement_id = p.engagement_id AND kt.period_end = p.period_end AND kt.rag_status = 'red') AS red_kpis,
  -- Insight summary
  (SELECT COUNT(*) FROM ma_insights i WHERE i.period_id = p.id) AS insight_count,
  (SELECT COUNT(*) FROM ma_insights i WHERE i.period_id = p.id AND i.insight_type = 'action_required') AS action_required_count
FROM ma_periods p
JOIN ma_engagements e ON p.engagement_id = e.id
LEFT JOIN practice_members pm ON e.client_id = pm.id
LEFT JOIN ma_financial_data fd ON fd.period_id = p.id;

