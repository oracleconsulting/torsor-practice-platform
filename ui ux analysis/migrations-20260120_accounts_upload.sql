-- Migration: Accounts Upload Feature
-- Allows practices to upload client accounts for automatic financial data extraction

-- Store uploaded account files
CREATE TABLE IF NOT EXISTS client_accounts_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'csv', 'xlsx'
  file_size INTEGER,
  storage_path TEXT, -- Supabase Storage path
  
  -- Processing status
  status TEXT DEFAULT 'pending', -- pending, processing, extracted, confirmed, failed
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Extraction metadata
  fiscal_year INTEGER,
  fiscal_year_end DATE,
  extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
  raw_extraction JSONB, -- Full LLM extraction response
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id)
);

-- Store extracted financial data (one row per year)
CREATE TABLE IF NOT EXISTS client_financial_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES client_accounts_uploads(id) ON DELETE SET NULL,
  
  -- Period
  fiscal_year INTEGER NOT NULL,
  fiscal_year_end DATE,
  period_months INTEGER DEFAULT 12,
  
  -- P&L Metrics
  revenue DECIMAL(15,2),
  cost_of_sales DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  gross_margin_pct DECIMAL(5,2),
  operating_expenses DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  ebitda_margin_pct DECIMAL(5,2),
  depreciation DECIMAL(15,2),
  amortisation DECIMAL(15,2),
  interest_paid DECIMAL(15,2),
  tax DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  net_margin_pct DECIMAL(5,2),
  
  -- Balance Sheet
  total_assets DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  fixed_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  long_term_liabilities DECIMAL(15,2),
  net_assets DECIMAL(15,2),
  
  -- Working Capital
  debtors DECIMAL(15,2),
  creditors DECIMAL(15,2),
  stock DECIMAL(15,2),
  cash DECIMAL(15,2),
  debtor_days INTEGER,
  creditor_days INTEGER,
  
  -- Operational
  employee_count INTEGER,
  revenue_per_employee DECIMAL(15,2),
  
  -- Data Quality
  data_source TEXT DEFAULT 'upload', -- 'upload', 'manual', 'integration'
  confidence_score DECIMAL(3,2),
  manually_adjusted BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_by UUID REFERENCES practice_members(id),
  confirmed_at TIMESTAMPTZ,
  
  UNIQUE(client_id, fiscal_year)
);

-- Audit log for changes to financial data
CREATE TABLE IF NOT EXISTS client_financial_data_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financial_data_id UUID REFERENCES client_financial_data(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES practice_members(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_uploads_client ON client_accounts_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_uploads_practice ON client_accounts_uploads(practice_id);
CREATE INDEX IF NOT EXISTS idx_accounts_uploads_status ON client_accounts_uploads(status);
CREATE INDEX IF NOT EXISTS idx_financial_data_client ON client_financial_data(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_practice ON client_financial_data(practice_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_year ON client_financial_data(fiscal_year DESC);

-- Create storage bucket for account uploads (run separately in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('client-accounts', 'client-accounts', false);

-- RLS policies
ALTER TABLE client_accounts_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_financial_data_audit ENABLE ROW LEVEL SECURITY;

-- Practice members can view/manage their practice's uploads
CREATE POLICY "Practice members can view uploads" ON client_accounts_uploads
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Practice members can insert uploads" ON client_accounts_uploads
  FOR INSERT WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Practice members can update uploads" ON client_accounts_uploads
  FOR UPDATE USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Same for financial data
CREATE POLICY "Practice members can view financial data" ON client_financial_data
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Practice members can manage financial data" ON client_financial_data
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Audit trail viewable by practice
CREATE POLICY "Practice members can view audit" ON client_financial_data_audit
  FOR SELECT USING (
    financial_data_id IN (
      SELECT id FROM client_financial_data WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE id = auth.uid()
      )
    )
  );

-- Function to get latest financial data for a client
CREATE OR REPLACE FUNCTION get_client_financial_summary(p_client_id UUID)
RETURNS TABLE (
  fiscal_year INTEGER,
  revenue DECIMAL,
  gross_margin_pct DECIMAL,
  ebitda_margin_pct DECIMAL,
  net_margin_pct DECIMAL,
  debtor_days INTEGER,
  employee_count INTEGER,
  revenue_per_employee DECIMAL,
  revenue_growth_pct DECIMAL,
  data_source TEXT,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH yearly_data AS (
    SELECT 
      fd.fiscal_year,
      fd.revenue,
      fd.gross_margin_pct,
      fd.ebitda_margin_pct,
      fd.net_margin_pct,
      fd.debtor_days,
      fd.employee_count,
      fd.revenue_per_employee,
      fd.data_source,
      fd.confidence_score,
      LAG(fd.revenue) OVER (ORDER BY fd.fiscal_year) as prev_revenue
    FROM client_financial_data fd
    WHERE fd.client_id = p_client_id
      AND fd.confirmed_at IS NOT NULL
    ORDER BY fd.fiscal_year DESC
  )
  SELECT 
    yd.fiscal_year,
    yd.revenue,
    yd.gross_margin_pct,
    yd.ebitda_margin_pct,
    yd.net_margin_pct,
    yd.debtor_days,
    yd.employee_count,
    yd.revenue_per_employee,
    CASE 
      WHEN yd.prev_revenue > 0 
      THEN ROUND(((yd.revenue - yd.prev_revenue) / yd.prev_revenue * 100)::numeric, 1)
      ELSE NULL 
    END as revenue_growth_pct,
    yd.data_source,
    yd.confidence_score
  FROM yearly_data yd
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


