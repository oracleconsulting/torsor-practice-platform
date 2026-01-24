-- ============================================================================
-- Business Intelligence Phase 1 Enhancements
-- P&L Analysis + Budget Comparison + Balance Sheet + PDF Export
-- Created: 22 January 2026
-- ============================================================================

-- ============================================================================
-- 1. BUDGET STORAGE
-- ============================================================================

-- Store annual budgets by engagement
CREATE TABLE IF NOT EXISTS bi_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  
  -- Financial year
  financial_year_start DATE NOT NULL,
  financial_year_end DATE NOT NULL,
  
  -- Monthly budget data (JSONB for flexibility)
  -- Structure: { "2026-01": { revenue: 50000, cost_of_sales: 20000, gross_profit: 30000, overheads: 25000, operating_profit: 5000, net_profit: 5000 }, ... }
  monthly_budgets JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(engagement_id, financial_year_start)
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_bi_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bi_budgets_updated_at ON bi_budgets;
CREATE TRIGGER bi_budgets_updated_at
  BEFORE UPDATE ON bi_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_bi_budgets_updated_at();

-- RLS for bi_budgets
ALTER TABLE bi_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY bi_budgets_all_access ON bi_budgets
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 2. BALANCE SHEET DATA
-- ============================================================================

-- Add balance sheet data column to bi_financial_data
-- Structure: {
--   current_assets: { cash: X, debtors: X, stock: X, prepayments: X, other: X },
--   fixed_assets: { tangible: X, intangible: X, investments: X },
--   current_liabilities: { creditors: X, tax: X, accruals: X, overdraft: X, other: X },
--   long_term_liabilities: { loans: X, director_loans: X, other: X },
--   equity: { share_capital: X, retained_earnings: X, current_year_profit: X }
-- }
ALTER TABLE bi_financial_data ADD COLUMN IF NOT EXISTS 
  balance_sheet_data JSONB DEFAULT '{}';

-- Add detailed P&L breakdown for more granular analysis
ALTER TABLE bi_financial_data ADD COLUMN IF NOT EXISTS 
  pl_breakdown JSONB DEFAULT '{}';
-- Structure: {
--   revenue: { services: X, products: X, other: X },
--   cost_of_sales: { materials: X, direct_labour: X, subcontractors: X, other: X },
--   overheads: { 
--     staff: X, premises: X, admin: X, marketing: X, 
--     professional: X, depreciation: X, finance: X, other: X 
--   }
-- }

-- ============================================================================
-- 3. PERIOD COMPARISONS (CACHED)
-- ============================================================================

-- Period comparisons (cached for performance)
CREATE TABLE IF NOT EXISTS bi_period_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE UNIQUE,
  
  -- Reference periods
  prior_month_id UUID REFERENCES bi_periods(id) ON DELETE SET NULL,
  prior_year_id UUID REFERENCES bi_periods(id) ON DELETE SET NULL,
  
  -- Budget for this specific month
  budget_month JSONB,
  
  -- Calculated variances
  -- Structure: {
  --   vs_budget: { revenue: { amount: 3000, pct: 5.5 }, cost_of_sales: {...}, ... },
  --   vs_prior_month: { ... },
  --   vs_prior_year: { ... }
  -- }
  variances JSONB DEFAULT '{}',
  
  -- YTD figures
  ytd_actual JSONB DEFAULT '{}',
  ytd_budget JSONB DEFAULT '{}',
  ytd_prior_year JSONB DEFAULT '{}',
  
  -- Full comparison data for P&L table
  pl_comparison JSONB DEFAULT '{}',
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_bi_period_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bi_period_comparisons_updated_at ON bi_period_comparisons;
CREATE TRIGGER bi_period_comparisons_updated_at
  BEFORE UPDATE ON bi_period_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_bi_period_comparisons_updated_at();

-- RLS for bi_period_comparisons
ALTER TABLE bi_period_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY bi_period_comparisons_all_access ON bi_period_comparisons
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 4. PDF REPORT TRACKING
-- ============================================================================

-- Track generated PDF reports
CREATE TABLE IF NOT EXISTS bi_generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
  
  -- Report details
  report_type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'executive', 'detailed'
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Generation options used
  options JSONB DEFAULT '{}',
  -- { include_comparisons: true, include_budget: true, include_balance_sheet: false }
  
  -- Status
  status TEXT NOT NULL DEFAULT 'generated', -- 'generating', 'generated', 'failed'
  error_message TEXT,
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID,
  expires_at TIMESTAMPTZ, -- Optional expiry for temporary reports
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for bi_generated_reports
ALTER TABLE bi_generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY bi_generated_reports_all_access ON bi_generated_reports
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for period lookups by date
CREATE INDEX IF NOT EXISTS idx_bi_periods_engagement_date 
  ON bi_periods(engagement_id, period_start);

-- Index for budget lookups
CREATE INDEX IF NOT EXISTS idx_bi_budgets_engagement_year 
  ON bi_budgets(engagement_id, financial_year_start, financial_year_end);

-- Index for comparison lookups
CREATE INDEX IF NOT EXISTS idx_bi_period_comparisons_period 
  ON bi_period_comparisons(period_id);

-- Index for generated reports
CREATE INDEX IF NOT EXISTS idx_bi_generated_reports_period 
  ON bi_generated_reports(period_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_bi_generated_reports_engagement 
  ON bi_generated_reports(engagement_id, generated_at DESC);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate variance
CREATE OR REPLACE FUNCTION calculate_variance(actual NUMERIC, comparison NUMERIC)
RETURNS JSONB AS $$
DECLARE
  amount NUMERIC;
  pct NUMERIC;
BEGIN
  IF comparison IS NULL OR comparison = 0 THEN
    RETURN NULL;
  END IF;
  
  amount := actual - comparison;
  pct := ROUND((amount / ABS(comparison)) * 100, 1);
  
  RETURN jsonb_build_object('amount', amount, 'pct', pct);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get budget for a specific month
CREATE OR REPLACE FUNCTION get_budget_for_month(
  p_engagement_id UUID,
  p_month DATE
)
RETURNS JSONB AS $$
DECLARE
  budget_data JSONB;
  month_key TEXT;
BEGIN
  month_key := to_char(p_month, 'YYYY-MM');
  
  SELECT monthly_budgets->month_key INTO budget_data
  FROM bi_budgets
  WHERE engagement_id = p_engagement_id
    AND financial_year_start <= p_month
    AND financial_year_end >= p_month;
  
  RETURN budget_data;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. SEED TEST BUDGET DATA (Meridian example)
-- ============================================================================

-- Insert sample budget for testing (will only insert if engagement exists)
DO $$
DECLARE
  v_engagement_id UUID;
BEGIN
  -- Try to find a test engagement (Meridian or any existing)
  SELECT id INTO v_engagement_id
  FROM bi_engagements
  LIMIT 1;
  
  IF v_engagement_id IS NOT NULL THEN
    INSERT INTO bi_budgets (
      engagement_id,
      financial_year_start,
      financial_year_end,
      monthly_budgets,
      notes
    ) VALUES (
      v_engagement_id,
      '2025-04-01',
      '2026-03-31',
      '{
        "2025-04": {"revenue": 52000, "cost_of_sales": 20800, "gross_profit": 31200, "overheads": 24000, "operating_profit": 7200, "net_profit": 5500},
        "2025-05": {"revenue": 53000, "cost_of_sales": 21200, "gross_profit": 31800, "overheads": 24200, "operating_profit": 7600, "net_profit": 5800},
        "2025-06": {"revenue": 54000, "cost_of_sales": 21600, "gross_profit": 32400, "overheads": 24400, "operating_profit": 8000, "net_profit": 6100},
        "2025-07": {"revenue": 54500, "cost_of_sales": 21800, "gross_profit": 32700, "overheads": 24500, "operating_profit": 8200, "net_profit": 6250},
        "2025-08": {"revenue": 50000, "cost_of_sales": 20000, "gross_profit": 30000, "overheads": 23500, "operating_profit": 6500, "net_profit": 4950},
        "2025-09": {"revenue": 55000, "cost_of_sales": 22000, "gross_profit": 33000, "overheads": 24800, "operating_profit": 8200, "net_profit": 6250},
        "2025-10": {"revenue": 56000, "cost_of_sales": 22400, "gross_profit": 33600, "overheads": 25000, "operating_profit": 8600, "net_profit": 6550},
        "2025-11": {"revenue": 54000, "cost_of_sales": 21600, "gross_profit": 32400, "overheads": 24600, "operating_profit": 7800, "net_profit": 5940},
        "2025-12": {"revenue": 55000, "cost_of_sales": 22000, "gross_profit": 33000, "overheads": 25000, "operating_profit": 8000, "net_profit": 6000},
        "2026-01": {"revenue": 52000, "cost_of_sales": 20800, "gross_profit": 31200, "overheads": 24000, "operating_profit": 7200, "net_profit": 5500},
        "2026-02": {"revenue": 53000, "cost_of_sales": 21200, "gross_profit": 31800, "overheads": 24200, "operating_profit": 7600, "net_profit": 5800},
        "2026-03": {"revenue": 58000, "cost_of_sales": 23200, "gross_profit": 34800, "overheads": 25500, "operating_profit": 9300, "net_profit": 7100}
      }',
      'FY 2025/26 Annual Budget'
    )
    ON CONFLICT (engagement_id, financial_year_start) DO UPDATE
    SET monthly_budgets = EXCLUDED.monthly_budgets,
        notes = EXCLUDED.notes,
        updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================


