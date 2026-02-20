-- ============================================
-- BUSINESS INTELLIGENCE SERVICE TABLES
-- Version 2.0 - January 2026
-- Replaces legacy "Management Accounts" naming
-- ============================================

-- ============================================
-- CORE ENGAGEMENT TABLES
-- ============================================

-- Engagements (client sign-up)
CREATE TABLE IF NOT EXISTS bi_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Tier: clarity, foresight, strategic
  tier TEXT NOT NULL CHECK (tier IN ('clarity', 'foresight', 'strategic')),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly')),
  
  -- Pricing (flexible within ranges)
  monthly_fee DECIMAL(10,2),
  quarterly_fee DECIMAL(10,2),
  turnover_band TEXT CHECK (turnover_band IN (
    'under_750k', '750k_1.5m', '1.5m_3m', '3m_5m', '5m_plus'
  )),
  price_adjustments JSONB DEFAULT '[]',
  
  -- Configuration
  kpi_count INTEGER DEFAULT 5,
  scenario_limit INTEGER, -- null = unlimited (strategic)
  call_duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
  start_date DATE,
  
  -- Discovery data for client voice
  discovery_data JSONB,
  tuesday_question_template TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id) -- One BI engagement per client
);

-- Periods (monthly/quarterly reporting periods)
CREATE TABLE IF NOT EXISTS bi_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  
  -- Period definition
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT,
  
  -- Workflow status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'documents_uploaded',
    'data_extracted',
    'insights_generated',
    'team_review',
    'ready_for_call',
    'call_complete',
    'delivered'
  )),
  
  -- Tuesday Question
  tuesday_question TEXT,
  tuesday_answer_short TEXT,
  tuesday_answer_detail TEXT,
  tuesday_linked_scenario_id UUID,
  
  -- Call tracking
  call_scheduled_at TIMESTAMPTZ,
  call_completed_at TIMESTAMPTZ,
  call_notes TEXT,
  call_recording_url TEXT,
  
  -- Team workflow
  assigned_to UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (uploaded files)
CREATE TABLE IF NOT EXISTS bi_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'profit_loss', 'balance_sheet', 'trial_balance',
    'bank_statement', 'aged_debtors', 'aged_creditors',
    'vat_return', 'payroll_summary', 'other'
  )),
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  extracted BOOLEAN DEFAULT FALSE,
  extraction_confidence DECIMAL(3,2),
  extraction_notes TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID
);

-- ============================================
-- FINANCIAL DATA
-- ============================================

CREATE TABLE IF NOT EXISTS bi_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  
  -- P&L
  revenue DECIMAL(12,2),
  cost_of_sales DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  overheads DECIMAL(12,2),
  operating_profit DECIMAL(12,2),
  net_profit DECIMAL(12,2),
  
  -- Balance Sheet - Assets
  cash_at_bank DECIMAL(12,2),
  trade_debtors DECIMAL(12,2),
  other_debtors DECIMAL(12,2),
  stock DECIMAL(12,2),
  fixed_assets DECIMAL(12,2),
  
  -- Balance Sheet - Liabilities
  trade_creditors DECIMAL(12,2),
  other_creditors DECIMAL(12,2),
  vat_liability DECIMAL(12,2),
  paye_liability DECIMAL(12,2),
  corporation_tax_liability DECIMAL(12,2),
  bank_loans DECIMAL(12,2),
  director_loans DECIMAL(12,2),
  
  -- Cash Flow Context
  committed_payments DECIMAL(12,2),
  confirmed_receivables DECIMAL(12,2),
  
  -- Operational
  monthly_operating_costs DECIMAL(12,2),
  monthly_payroll_costs DECIMAL(12,2),
  fte_count DECIMAL(4,1),
  
  -- Comparative (prior period)
  prior_revenue DECIMAL(12,2),
  prior_gross_profit DECIMAL(12,2),
  prior_operating_profit DECIMAL(12,2),
  prior_net_profit DECIMAL(12,2),
  prior_cash_at_bank DECIMAL(12,2),
  
  -- Year-on-year
  yoy_revenue DECIMAL(12,2),
  
  -- Data quality
  data_source TEXT CHECK (data_source IN ('manual', 'xero', 'quickbooks', 'sage', 'extracted')),
  data_confidence TEXT CHECK (data_confidence IN ('high', 'medium', 'low')),
  data_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_id)
);

-- ============================================
-- KPI SYSTEM
-- ============================================

-- KPI Definitions (reference table)
CREATE TABLE IF NOT EXISTS bi_kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cash_working_capital', 'revenue_growth',
    'profitability', 'efficiency', 'client_health'
  )),
  
  description TEXT,
  calculation_formula TEXT,
  calculation_code TEXT,
  
  -- RAG thresholds
  default_green_threshold DECIMAL(10,2),
  default_green_operator TEXT CHECK (default_green_operator IN ('>=', '<=', '>', '<', '=')),
  default_amber_min DECIMAL(10,2),
  default_amber_max DECIMAL(10,2),
  default_red_threshold DECIMAL(10,2),
  default_red_operator TEXT CHECK (default_red_operator IN ('>=', '<=', '>', '<', '=')),
  
  -- Display
  unit TEXT,
  decimal_places INTEGER DEFAULT 0,
  
  -- Tier availability
  min_tier TEXT DEFAULT 'clarity' CHECK (min_tier IN ('clarity', 'foresight', 'strategic')),
  is_core BOOLEAN DEFAULT FALSE,
  
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- KPI Values (calculated per period)
CREATE TABLE IF NOT EXISTS bi_kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  kpi_definition_id UUID NOT NULL REFERENCES bi_kpi_definitions(id),
  
  value DECIMAL(12,2),
  formatted_value TEXT,
  
  rag_status TEXT CHECK (rag_status IN ('green', 'amber', 'red', 'neutral')),
  rag_override TEXT,
  rag_override_reason TEXT,
  
  prior_value DECIMAL(12,2),
  change_amount DECIMAL(12,2),
  change_percentage DECIMAL(5,2),
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'flat')),
  trend_is_positive BOOLEAN,
  
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_id, kpi_definition_id)
);

-- ============================================
-- INSIGHTS (Theme-based deduplication)
-- ============================================

CREATE TABLE IF NOT EXISTS bi_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  
  -- Theme-based deduplication (ONE insight per theme max)
  theme TEXT NOT NULL CHECK (theme IN (
    'tuesday_question',
    'cash_runway',
    'debtor_opportunity',
    'cost_structure',
    'tax_obligations',
    'profitability',
    'client_health',
    'pricing_power'
  )),
  
  -- Content
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'warning', 'opportunity', 'positive')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT,
  
  -- Client voice integration
  client_quote TEXT,
  emotional_anchor TEXT,
  
  -- Tier-specific content (Foresight+ only)
  recommendation TEXT,
  scenario_teaser TEXT,
  linked_scenario_id UUID,
  
  -- Visualization
  visualization_type TEXT CHECK (visualization_type IN (
    'none', 'comparison', 'timeline', 'progress', 'bar', 'waterfall', 'table'
  )) DEFAULT 'none',
  visualization_data JSONB,
  
  -- Status
  is_tuesday_answer BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  
  -- Team edits
  edited_by UUID,
  edited_at TIMESTAMPTZ,
  original_content JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only ONE insight per theme per period
  UNIQUE(period_id, theme)
);

-- ============================================
-- FORECASTING (Foresight+ only)
-- ============================================

CREATE TABLE IF NOT EXISTS bi_cash_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('13_week', '6_month')),
  
  opening_cash DECIMAL(12,2),
  opening_true_cash DECIMAL(12,2),
  
  assumptions JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_cash_forecast_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES bi_cash_forecasts(id) ON DELETE CASCADE,
  
  period_number INTEGER NOT NULL,
  period_label TEXT,
  period_start DATE,
  period_end DATE,
  
  expected_inflows DECIMAL(12,2),
  expected_outflows DECIMAL(12,2),
  net_flow DECIMAL(12,2),
  
  closing_cash DECIMAL(12,2),
  closing_true_cash DECIMAL(12,2),
  
  rag_status TEXT CHECK (rag_status IN ('green', 'amber', 'red')),
  runway_at_period_end DECIMAL(4,2),
  
  scenario_variants JSONB DEFAULT '{}',
  
  display_order INTEGER
);

-- ============================================
-- SCENARIOS
-- ============================================

CREATE TABLE IF NOT EXISTS bi_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  period_id UUID REFERENCES bi_periods(id) ON DELETE SET NULL,
  
  scenario_type TEXT NOT NULL CHECK (scenario_type IN (
    'hire', 'pricing_change', 'client_loss', 'client_win',
    'debtor_collection', 'cost_reduction', 'investment', 'custom'
  )),
  
  name TEXT NOT NULL,
  short_label TEXT,
  description TEXT,
  
  parameters JSONB NOT NULL DEFAULT '{}',
  
  impact_summary TEXT,
  monthly_cash_impact DECIMAL(12,2),
  annual_profit_impact DECIMAL(12,2),
  breakeven_months INTEGER,
  
  is_featured BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Update bi_insights foreign key for scenarios
ALTER TABLE bi_insights 
  ADD CONSTRAINT bi_insights_scenario_fk 
  FOREIGN KEY (linked_scenario_id) 
  REFERENCES bi_scenarios(id) ON DELETE SET NULL;

-- Update bi_periods foreign key for tuesday scenario
ALTER TABLE bi_periods
  ADD CONSTRAINT bi_periods_tuesday_scenario_fk
  FOREIGN KEY (tuesday_linked_scenario_id)
  REFERENCES bi_scenarios(id) ON DELETE SET NULL;

-- ============================================
-- CLIENT PROFITABILITY (Foresight+ only)
-- ============================================

CREATE TABLE IF NOT EXISTS bi_client_profitability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  
  client_name TEXT NOT NULL,
  
  revenue DECIMAL(12,2),
  revenue_percentage DECIMAL(5,2),
  
  direct_costs DECIMAL(12,2),
  allocated_overheads DECIMAL(12,2),
  total_costs DECIMAL(12,2),
  
  gross_margin DECIMAL(12,2),
  gross_margin_percentage DECIMAL(5,2),
  net_margin DECIMAL(12,2),
  net_margin_percentage DECIMAL(5,2),
  
  profitability_status TEXT CHECK (profitability_status IN (
    'highly_profitable', 'profitable', 'marginal', 'loss_making', 'unknown'
  )),
  
  payment_terms_days INTEGER,
  actual_payment_days INTEGER,
  concentration_risk BOOLEAN,
  
  team_notes TEXT,
  client_notes TEXT,
  
  display_order INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WATCH LIST (Foresight+ only)
-- ============================================

CREATE TABLE IF NOT EXISTS bi_watch_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  
  watch_type TEXT NOT NULL CHECK (watch_type IN (
    'debtor', 'client', 'kpi', 'cash_threshold', 'date', 'custom'
  )),
  
  name TEXT NOT NULL,
  description TEXT,
  
  trigger_kpi_id UUID REFERENCES bi_kpi_definitions(id),
  trigger_threshold DECIMAL(12,2),
  trigger_operator TEXT CHECK (trigger_operator IN ('>', '<', '>=', '<=', '=')),
  trigger_date DATE,
  
  status TEXT DEFAULT 'watching' CHECK (status IN ('watching', 'triggered', 'resolved', 'snoozed')),
  triggered_at TIMESTAMPTZ,
  triggered_value DECIMAL(12,2),
  
  alert_team BOOLEAN DEFAULT TRUE,
  alert_client BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  snoozed_until TIMESTAMPTZ
);

-- ============================================
-- REPORT CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS bi_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  
  sections JSONB NOT NULL DEFAULT '[
    {"key": "tuesday_question", "visible": true, "order": 1},
    {"key": "true_cash_waterfall", "visible": true, "order": 2},
    {"key": "cash_forecast", "visible": true, "order": 3},
    {"key": "insights", "visible": true, "order": 4},
    {"key": "kpi_grid", "visible": true, "order": 5},
    {"key": "client_profitability", "visible": true, "order": 6}
  ]',
  
  include_logo BOOLEAN DEFAULT TRUE,
  primary_color TEXT DEFAULT '#1e40af',
  
  auto_send_email BOOLEAN DEFAULT FALSE,
  email_recipients JSONB DEFAULT '[]',
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bi_engagements_practice ON bi_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_bi_engagements_client ON bi_engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_bi_engagements_status ON bi_engagements(status);
CREATE INDEX IF NOT EXISTS idx_bi_periods_engagement ON bi_periods(engagement_id);
CREATE INDEX IF NOT EXISTS idx_bi_periods_status ON bi_periods(status);
CREATE INDEX IF NOT EXISTS idx_bi_documents_period ON bi_documents(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_financial_data_period ON bi_financial_data(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_kpi_values_period ON bi_kpi_values(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_insights_period ON bi_insights(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_insights_theme ON bi_insights(theme);
CREATE INDEX IF NOT EXISTS idx_bi_scenarios_engagement ON bi_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_bi_client_profitability_period ON bi_client_profitability(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_watch_list_engagement ON bi_watch_list(engagement_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE bi_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_cash_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_cash_forecast_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_client_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_watch_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_report_config ENABLE ROW LEVEL SECURITY;

-- Simple authenticated user policies (to be tightened with team_members/clients tables)
CREATE POLICY bi_engagements_auth_policy ON bi_engagements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_periods_auth_policy ON bi_periods
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_documents_auth_policy ON bi_documents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_financial_data_auth_policy ON bi_financial_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_kpi_definitions_public_read ON bi_kpi_definitions
  FOR SELECT USING (true);

CREATE POLICY bi_kpi_values_auth_policy ON bi_kpi_values
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_insights_auth_policy ON bi_insights
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_cash_forecasts_auth_policy ON bi_cash_forecasts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_cash_forecast_periods_auth_policy ON bi_cash_forecast_periods
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_scenarios_auth_policy ON bi_scenarios
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_client_profitability_auth_policy ON bi_client_profitability
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_watch_list_auth_policy ON bi_watch_list
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY bi_report_config_auth_policy ON bi_report_config
  FOR ALL USING (auth.role() = 'authenticated');

-- Service role has full access (for edge functions)
CREATE POLICY bi_engagements_service_policy ON bi_engagements
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY bi_periods_service_policy ON bi_periods
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY bi_insights_service_policy ON bi_insights
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_bi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bi_engagements_updated_at
  BEFORE UPDATE ON bi_engagements
  FOR EACH ROW EXECUTE FUNCTION update_bi_updated_at();

CREATE TRIGGER bi_periods_updated_at
  BEFORE UPDATE ON bi_periods
  FOR EACH ROW EXECUTE FUNCTION update_bi_updated_at();

CREATE TRIGGER bi_financial_data_updated_at
  BEFORE UPDATE ON bi_financial_data
  FOR EACH ROW EXECUTE FUNCTION update_bi_updated_at();

CREATE TRIGGER bi_cash_forecasts_updated_at
  BEFORE UPDATE ON bi_cash_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_bi_updated_at();

CREATE TRIGGER bi_report_config_updated_at
  BEFORE UPDATE ON bi_report_config
  FOR EACH ROW EXECUTE FUNCTION update_bi_updated_at();

