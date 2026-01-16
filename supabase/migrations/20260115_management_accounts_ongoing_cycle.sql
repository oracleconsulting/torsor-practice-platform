-- ============================================================================
-- MANAGEMENT ACCOUNTS - ONGOING CYCLE ARCHITECTURE
-- ============================================================================
-- Migration: 20260115_management_accounts_ongoing_cycle.sql
-- Purpose: Add tables and fields for ongoing monthly/quarterly MA service
--          including periods, trends, forecasts, scenarios, and optimizations
-- ============================================================================

-- ============================================================================
-- UPDATE: ma_engagements - Add ongoing cycle configuration
-- ============================================================================

ALTER TABLE ma_engagements 
  ADD COLUMN IF NOT EXISTS reporting_deadline_days INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS year_end_month INTEGER CHECK (year_end_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS connected_platform TEXT CHECK (connected_platform IN ('xero', 'quickbooks', 'manual')),
  ADD COLUMN IF NOT EXISTS platform_connection_id TEXT,
  ADD COLUMN IF NOT EXISTS next_period_due DATE,
  ADD COLUMN IF NOT EXISTS last_period_completed DATE;

-- Update frequency to match new structure (already exists, just ensure it's correct)
-- frequency already exists as TEXT with CHECK constraint

-- ============================================================================
-- TABLE: ma_periods
-- ============================================================================
-- Tracks each monthly/quarterly period for an engagement

CREATE TABLE IF NOT EXISTS ma_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('month', 'quarter')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT, -- 'January 2026' or 'Q1 2026'
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'data_received', 
    'processing', 
    'review', 
    'published', 
    'superseded'
  )),
  
  -- Timestamps
  data_received_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES practice_members(id),
  published_at TIMESTAMPTZ,
  
  -- References to related data (FKs added after tables are created)
  document_id UUID,
  extracted_financials_id UUID,
  forecast_id UUID,
  insight_id UUID,
  
  -- Period sequence
  period_number INTEGER, -- 1, 2, 3... for this engagement
  prior_period_id UUID REFERENCES ma_periods(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ma_periods_engagement ON ma_periods(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_periods_status ON ma_periods(status);
CREATE INDEX IF NOT EXISTS idx_ma_periods_period_end ON ma_periods(period_end DESC);

-- ============================================================================
-- TABLE: ma_trend_data
-- ============================================================================
-- Cumulative trend data updated each period

CREATE TABLE IF NOT EXISTS ma_trend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  period_id UUID REFERENCES ma_periods(id),
  period_end DATE NOT NULL,
  
  -- Core metrics for trending
  revenue NUMERIC(15,2),
  gross_profit NUMERIC(15,2),
  gross_margin_pct NUMERIC(5,2),
  operating_profit NUMERIC(15,2),
  operating_margin_pct NUMERIC(5,2),
  net_profit NUMERIC(15,2),
  net_margin_pct NUMERIC(5,2),
  
  -- Cash position
  bank_balance NUMERIC(15,2),
  true_cash NUMERIC(15,2),
  
  -- Working capital
  debtors NUMERIC(15,2),
  debtor_days NUMERIC(5,2),
  creditors NUMERIC(15,2),
  creditor_days NUMERIC(5,2),
  
  -- Efficiency
  headcount NUMERIC(5,2),
  revenue_per_head NUMERIC(15,2),
  staff_cost_pct NUMERIC(5,2),
  
  -- Calculated trends (updated each period)
  revenue_trend TEXT CHECK (revenue_trend IN ('growing', 'stable', 'declining')),
  revenue_trend_pct NUMERIC(5,2), -- avg MoM change
  margin_trend TEXT CHECK (margin_trend IN ('improving', 'stable', 'eroding')),
  margin_trend_pp NUMERIC(5,2), -- percentage point change
  cash_trend TEXT CHECK (cash_trend IN ('building', 'stable', 'depleting')),
  debtor_days_trend TEXT CHECK (debtor_days_trend IN ('improving', 'stable', 'worsening')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id, period_end)
);

CREATE INDEX IF NOT EXISTS idx_ma_trend_data_engagement ON ma_trend_data(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_trend_data_period_end ON ma_trend_data(period_end DESC);

-- ============================================================================
-- TABLE: ma_known_commitments
-- ============================================================================
-- Known future expenses/income for forecasting

CREATE TABLE IF NOT EXISTS ma_known_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  
  commitment_type TEXT NOT NULL CHECK (commitment_type IN (
    'recurring_expense',
    'one_off_expense',
    'expected_income',
    'loan_payment',
    'tax_payment'
  )),
  
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  
  -- Timing
  frequency TEXT CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annual', 'one_off')),
  next_due_date DATE,
  end_date DATE, -- NULL if ongoing
  
  -- For forecasting
  include_in_forecast BOOLEAN DEFAULT true,
  confidence TEXT DEFAULT 'confirmed' CHECK (confidence IN ('confirmed', 'expected', 'possible')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id)
);

CREATE INDEX IF NOT EXISTS idx_ma_commitments_engagement ON ma_known_commitments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_commitments_next_due ON ma_known_commitments(next_due_date);

-- ============================================================================
-- TABLE: ma_cash_forecasts
-- ============================================================================
-- 13-week cash flow forecasts

CREATE TABLE IF NOT EXISTS ma_cash_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  period_id UUID REFERENCES ma_periods(id),
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  forecast_weeks INTEGER DEFAULT 13,
  
  -- Starting position
  opening_cash NUMERIC(15,2) NOT NULL,
  opening_true_cash NUMERIC(15,2),
  
  -- Weekly projections
  weekly_forecast JSONB NOT NULL,
  /* Structure:
  [
    {
      "week_ending": "2026-01-24",
      "opening_balance": 46920,
      "expected_receipts": 28000,
      "expected_payments": 22000,
      "closing_balance": 52920,
      "confidence": "high",
      "key_events": ["Payroll £8,800"]
    },
    ...
  ]
  */
  
  -- Summary metrics
  lowest_point_amount NUMERIC(15,2),
  lowest_point_week DATE,
  cash_runway_weeks INTEGER,
  avg_weekly_burn NUMERIC(15,2),
  
  -- Critical dates
  critical_dates JSONB,
  /* Structure:
  [
    {
      "date": "2026-02-24",
      "event": "VAT + Payroll collision",
      "impact": -48550,
      "resulting_balance": 18370,
      "action_needed": "Accelerate debtor collection before this date"
    }
  ]
  */
  
  -- Assumptions used
  assumptions JSONB,
  /* Structure:
  {
    "revenue_assumption": "Based on 3-month average: £78k/month",
    "collection_assumption": "50 days based on current debtor days",
    "known_commitments_included": 12,
    "seasonality_applied": true,
    "model_confidence": "medium"
  }
  */
  
  -- AI narrative
  narrative TEXT,
  overall_sentiment TEXT CHECK (overall_sentiment IN ('comfortable', 'tight', 'concerning', 'critical')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_forecasts_engagement ON ma_cash_forecasts(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_forecasts_period ON ma_cash_forecasts(period_id);

-- ============================================================================
-- TABLE: ma_scenarios
-- ============================================================================
-- What-if scenario modeling

CREATE TABLE IF NOT EXISTS ma_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  period_id UUID REFERENCES ma_periods(id),
  
  scenario_type TEXT NOT NULL CHECK (scenario_type IN (
    'hire',
    'fire',
    'price_increase',
    'price_decrease',
    'new_client',
    'lost_client',
    'capex',
    'cost_reduction',
    'collection_improvement',
    'custom'
  )),
  
  scenario_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Inputs
  assumptions JSONB NOT NULL,
  /* Structure varies by type, e.g. for 'hire':
  {
    "role": "Delivery Consultant",
    "salary": 55000,
    "start_date": "2026-03-01",
    "ramp_up_months": 2,
    "target_utilization": 75,
    "billable_rate": 650
  }
  */
  
  -- Outputs
  impact_summary JSONB,
  /* Structure:
  {
    "monthly_revenue_impact": 9750,
    "monthly_cost_impact": 4583,
    "monthly_profit_impact": 5167,
    "cash_impact_month_1": -4583,
    "cash_impact_month_3": 10918,
    "breakeven_month": 3,
    "12_month_cumulative_impact": 62000
  }
  */
  
  -- P&L projection
  projected_pl JSONB, -- 12-month projected P&L with this scenario
  
  -- Cash projection
  projected_cash JSONB, -- 12-month cash with this scenario
  
  -- AI analysis
  verdict TEXT CHECK (verdict IN ('recommended', 'viable', 'risky', 'not_recommended', 'yes_if')),
  verdict_summary TEXT,
  risks TEXT[],
  conditions TEXT[], -- What needs to be true for this to work
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id)
);

CREATE INDEX IF NOT EXISTS idx_ma_scenarios_engagement ON ma_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenarios_period ON ma_scenarios(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenarios_active ON ma_scenarios(is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: ma_optimisations
-- ============================================================================
-- Optimization suggestions with tracking

CREATE TABLE IF NOT EXISTS ma_optimisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  period_id UUID REFERENCES ma_periods(id),
  
  category TEXT NOT NULL CHECK (category IN (
    'working_capital',
    'cost_reduction',
    'revenue_opportunity',
    'cash_timing',
    'pricing',
    'efficiency',
    'risk_mitigation'
  )),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Quantified impact
  potential_impact JSONB,
  /* Structure:
  {
    "type": "cash_release",
    "amount": 20700,
    "timeframe": "30 days",
    "confidence": "high",
    "calculation": "Reducing debtor days from 50 to 30 on £52k balance"
  }
  */
  
  -- Implementation
  effort TEXT CHECK (effort IN ('quick_win', 'medium', 'significant')),
  steps TEXT[],
  
  -- Priority
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  urgency TEXT CHECK (urgency IN ('immediate', 'this_quarter', 'this_year')),
  
  -- Status tracking
  status TEXT DEFAULT 'suggested' CHECK (status IN (
    'suggested',
    'acknowledged',
    'in_progress',
    'implemented',
    'rejected'
  )),
  
  client_response TEXT,
  outcome_if_implemented JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_optimisations_engagement ON ma_optimisations(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_optimisations_period ON ma_optimisations(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_optimisations_status ON ma_optimisations(status);
CREATE INDEX IF NOT EXISTS idx_ma_optimisations_priority ON ma_optimisations(priority);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ma_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_trend_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_known_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_cash_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_optimisations ENABLE ROW LEVEL SECURITY;

-- Policies follow same pattern as ma_engagements
-- Practice members can view/update, clients can view their own
-- Drop existing policies first to avoid conflicts

DROP POLICY IF EXISTS "Users can view own practice periods" ON ma_periods;
DROP POLICY IF EXISTS "Users can insert own practice periods" ON ma_periods;
DROP POLICY IF EXISTS "Users can update own practice periods" ON ma_periods;

CREATE POLICY "Users can view own practice periods" ON ma_periods
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own practice periods" ON ma_periods
  FOR INSERT WITH CHECK (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own practice periods" ON ma_periods
  FOR UPDATE USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

-- Similar policies for other tables
DROP POLICY IF EXISTS "Users can view own practice trend data" ON ma_trend_data;
CREATE POLICY "Users can view own practice trend data" ON ma_trend_data
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own practice commitments" ON ma_known_commitments;
DROP POLICY IF EXISTS "Users can manage own practice commitments" ON ma_known_commitments;
CREATE POLICY "Users can view own practice commitments" ON ma_known_commitments
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own practice commitments" ON ma_known_commitments
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own practice forecasts" ON ma_cash_forecasts;
DROP POLICY IF EXISTS "Users can manage own practice forecasts" ON ma_cash_forecasts;
CREATE POLICY "Users can view own practice forecasts" ON ma_cash_forecasts
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own practice forecasts" ON ma_cash_forecasts
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own practice scenarios" ON ma_scenarios;
DROP POLICY IF EXISTS "Users can manage own practice scenarios" ON ma_scenarios;
CREATE POLICY "Users can view own practice scenarios" ON ma_scenarios
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own practice scenarios" ON ma_scenarios
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own practice optimisations" ON ma_optimisations;
DROP POLICY IF EXISTS "Users can manage own practice optimisations" ON ma_optimisations;
CREATE POLICY "Users can view own practice optimisations" ON ma_optimisations
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
      OR client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own practice optimisations" ON ma_optimisations
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (after all tables exist)
-- ============================================================================

-- Add FKs to ma_periods that reference tables created later
ALTER TABLE ma_periods
  ADD CONSTRAINT fk_ma_periods_document 
    FOREIGN KEY (document_id) REFERENCES ma_uploaded_documents(id),
  ADD CONSTRAINT fk_ma_periods_extracted_financials 
    FOREIGN KEY (extracted_financials_id) REFERENCES ma_extracted_financials(id),
  ADD CONSTRAINT fk_ma_periods_forecast 
    FOREIGN KEY (forecast_id) REFERENCES ma_cash_forecasts(id),
  ADD CONSTRAINT fk_ma_periods_insight 
    FOREIGN KEY (insight_id) REFERENCES ma_monthly_insights(id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for ma_periods
CREATE OR REPLACE FUNCTION update_ma_periods_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ma_periods_timestamp
  BEFORE UPDATE ON ma_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_ma_periods_timestamp();

-- Update timestamp trigger for ma_trend_data
CREATE OR REPLACE FUNCTION update_ma_trend_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ma_trend_data_timestamp
  BEFORE UPDATE ON ma_trend_data
  FOR EACH ROW
  EXECUTE FUNCTION update_ma_trend_data_timestamp();

-- Update timestamp trigger for ma_known_commitments
CREATE OR REPLACE FUNCTION update_ma_commitments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ma_commitments_timestamp
  BEFORE UPDATE ON ma_known_commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_ma_commitments_timestamp();

-- Update timestamp trigger for ma_optimisations
CREATE OR REPLACE FUNCTION update_ma_optimisations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ma_optimisations_timestamp
  BEFORE UPDATE ON ma_optimisations
  FOR EACH ROW
  EXECUTE FUNCTION update_ma_optimisations_timestamp();

