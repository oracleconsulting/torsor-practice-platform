-- ============================================================================
-- MANAGEMENT ACCOUNTS AI LAYER v2
-- ============================================================================
-- Enhanced with document analysis, true cash calculation, and structured
-- question answering
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: ma_assessment_responses
-- ============================================================================
-- Stores the client's MA assessment responses for context in analysis

CREATE TABLE IF NOT EXISTS ma_assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    
    -- Current State
    relationship_with_numbers TEXT,
    reports_insight_frequency TEXT,
    tuesday_financial_question TEXT,
    magic_away_financial TEXT,
    
    -- Pain Points
    kpi_priorities TEXT[],
    current_reporting_lag TEXT,
    decision_making_story TEXT,
    
    -- System Context
    accounting_platform TEXT,
    bookkeeping_currency TEXT,
    bookkeeping_owner TEXT,
    
    -- Desired Outcomes
    ma_transformation_desires TEXT[],
    financial_visibility_vision TEXT,
    
    -- Frequency & Scope
    reporting_frequency_preference TEXT,
    additional_reporting_needs TEXT[],
    
    -- Raw JSON (full form submission)
    raw_responses JSONB,
    
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ma_assessment_engagement ON ma_assessment_responses(engagement_id);
CREATE INDEX idx_ma_assessment_client ON ma_assessment_responses(client_id);

-- ============================================================================
-- TABLE: ma_uploaded_documents
-- ============================================================================
-- Tracks documents uploaded for analysis

CREATE TABLE IF NOT EXISTS ma_uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    
    -- Document Info
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER,
    
    -- Extraction Status
    extraction_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    extraction_error TEXT,
    extracted_at TIMESTAMPTZ,
    
    -- Period Coverage
    period_start DATE,
    period_end DATE,
    is_comparative BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ma_documents_engagement ON ma_uploaded_documents(engagement_id);

-- ============================================================================
-- TABLE: ma_extracted_financials
-- ============================================================================
-- Structured financial data extracted from uploaded documents

CREATE TABLE IF NOT EXISTS ma_extracted_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES ma_uploaded_documents(id) ON DELETE CASCADE,
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    
    -- Period
    period_end_date DATE NOT NULL,
    period_label TEXT, -- e.g., "May 2025", "Q1 2025"
    
    -- Profit & Loss
    revenue DECIMAL(15,2),
    cost_of_sales DECIMAL(15,2),
    gross_profit DECIMAL(15,2),
    gross_margin_pct DECIMAL(5,2),
    
    staff_costs DECIMAL(15,2),
    marketing_costs DECIMAL(15,2),
    software_costs DECIMAL(15,2),
    professional_fees DECIMAL(15,2),
    rent_utilities DECIMAL(15,2),
    other_overheads DECIMAL(15,2),
    total_overheads DECIMAL(15,2),
    
    operating_profit DECIMAL(15,2),
    operating_margin_pct DECIMAL(5,2),
    
    interest DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    net_margin_pct DECIMAL(5,2),
    
    -- Balance Sheet
    bank_balance DECIMAL(15,2),
    trade_debtors DECIMAL(15,2),
    other_current_assets DECIMAL(15,2),
    total_current_assets DECIMAL(15,2),
    
    trade_creditors DECIMAL(15,2),
    vat_payable DECIMAL(15,2),
    paye_nic_payable DECIMAL(15,2),
    corporation_tax_payable DECIMAL(15,2),
    director_loan DECIMAL(15,2),
    other_liabilities DECIMAL(15,2),
    
    net_assets DECIMAL(15,2),
    
    -- KPIs
    debtor_days INTEGER,
    creditor_days INTEGER,
    staff_cost_pct DECIMAL(5,2),
    
    -- Extraction Confidence
    extraction_confidence DECIMAL(3,2) DEFAULT 0.9,
    manual_adjustments JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(document_id, period_end_date)
);

CREATE INDEX idx_ma_extracted_engagement ON ma_extracted_financials(engagement_id);
CREATE INDEX idx_ma_extracted_period ON ma_extracted_financials(period_end_date DESC);

-- ============================================================================
-- TABLE: ma_period_comparisons
-- ============================================================================
-- Pre-calculated period-over-period movements

CREATE TABLE IF NOT EXISTS ma_period_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    
    current_period_id UUID NOT NULL REFERENCES ma_extracted_financials(id),
    prior_period_id UUID REFERENCES ma_extracted_financials(id),
    
    comparison_type TEXT NOT NULL CHECK (comparison_type IN ('mom', 'yoy', 'budget')),
    
    -- Movements
    revenue_change DECIMAL(15,2),
    revenue_change_pct DECIMAL(5,2),
    gross_profit_change DECIMAL(15,2),
    gross_margin_change_pp DECIMAL(5,2),
    operating_profit_change DECIMAL(15,2),
    operating_margin_change_pp DECIMAL(5,2),
    net_profit_change DECIMAL(15,2),
    
    cash_change DECIMAL(15,2),
    debtors_change DECIMAL(15,2),
    debtor_days_change INTEGER,
    
    staff_costs_change DECIMAL(15,2),
    staff_costs_change_pct DECIMAL(5,2),
    other_overheads_change DECIMAL(15,2),
    other_overheads_change_pct DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ma_comparisons_engagement ON ma_period_comparisons(engagement_id);

-- ============================================================================
-- TABLE: ma_true_cash_calculations
-- ============================================================================
-- Stores the "True Cash Available" calculation

CREATE TABLE IF NOT EXISTS ma_true_cash_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extracted_financials_id UUID NOT NULL REFERENCES ma_extracted_financials(id) ON DELETE CASCADE,
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    
    period_end_date DATE NOT NULL,
    
    -- Components
    bank_balance DECIMAL(15,2) NOT NULL,
    less_vat_payable DECIMAL(15,2) DEFAULT 0,
    less_paye_nic DECIMAL(15,2) DEFAULT 0,
    less_corporation_tax DECIMAL(15,2) DEFAULT 0,
    less_director_loan DECIMAL(15,2) DEFAULT 0,
    less_other_committed DECIMAL(15,2) DEFAULT 0,
    other_committed_notes TEXT,
    
    -- Result
    true_cash_available DECIMAL(15,2) NOT NULL,
    
    -- Context
    is_positive BOOLEAN GENERATED ALWAYS AS (true_cash_available >= 0) STORED,
    days_runway INTEGER, -- How many days of overheads this covers
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(extracted_financials_id)
);

CREATE INDEX idx_ma_truecash_engagement ON ma_true_cash_calculations(engagement_id);

-- ============================================================================
-- ENHANCE ma_monthly_insights TABLE
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE ma_monthly_insights 
ADD COLUMN IF NOT EXISTS extracted_financials_id UUID REFERENCES ma_extracted_financials(id),
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES ma_assessment_responses(id),
ADD COLUMN IF NOT EXISTS true_cash_narrative TEXT,
ADD COLUMN IF NOT EXISTS true_cash_calculation_id UUID REFERENCES ma_true_cash_calculations(id),
ADD COLUMN IF NOT EXISTS tuesday_question_original TEXT,
ADD COLUMN IF NOT EXISTS tuesday_question_answer TEXT,
ADD COLUMN IF NOT EXISTS tuesday_question_supporting_data JSONB,
ADD COLUMN IF NOT EXISTS client_quotes_used TEXT[],
ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT 'v1';

-- Update existing insights to v1 if prompt_version is null
UPDATE ma_monthly_insights SET prompt_version = 'v1' WHERE prompt_version IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ma_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_extracted_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_period_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_true_cash_calculations ENABLE ROW LEVEL SECURITY;

-- Policies for ma_assessment_responses
DROP POLICY IF EXISTS "ma_assessment_policy" ON ma_assessment_responses;
CREATE POLICY "ma_assessment_policy" ON ma_assessment_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE e.id = ma_assessment_responses.engagement_id
            AND (
                pm.user_id = auth.uid() -- Client can see their own
                OR EXISTS (
                    SELECT 1 FROM practice_members pm2
                    WHERE pm2.practice_id = e.practice_id
                    AND pm2.user_id = auth.uid()
                    AND pm2.member_type = 'team'
                ) -- Team can see all in their practice
            )
        )
    );

-- Policies for ma_uploaded_documents
DROP POLICY IF EXISTS "ma_documents_policy" ON ma_uploaded_documents;
CREATE POLICY "ma_documents_policy" ON ma_uploaded_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE e.id = ma_uploaded_documents.engagement_id
            AND (
                pm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM practice_members pm2
                    WHERE pm2.practice_id = e.practice_id
                    AND pm2.user_id = auth.uid()
                    AND pm2.member_type = 'team'
                )
            )
        )
    );

-- Policies for ma_extracted_financials
DROP POLICY IF EXISTS "ma_extracted_policy" ON ma_extracted_financials;
CREATE POLICY "ma_extracted_policy" ON ma_extracted_financials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE e.id = ma_extracted_financials.engagement_id
            AND (
                pm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM practice_members pm2
                    WHERE pm2.practice_id = e.practice_id
                    AND pm2.user_id = auth.uid()
                    AND pm2.member_type = 'team'
                )
            )
        )
    );

-- Policies for ma_period_comparisons
DROP POLICY IF EXISTS "ma_comparisons_policy" ON ma_period_comparisons;
CREATE POLICY "ma_comparisons_policy" ON ma_period_comparisons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE e.id = ma_period_comparisons.engagement_id
            AND (
                pm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM practice_members pm2
                    WHERE pm2.practice_id = e.practice_id
                    AND pm2.user_id = auth.uid()
                    AND pm2.member_type = 'team'
                )
            )
        )
    );

-- Policies for ma_true_cash_calculations
DROP POLICY IF EXISTS "ma_truecash_policy" ON ma_true_cash_calculations;
CREATE POLICY "ma_truecash_policy" ON ma_true_cash_calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE e.id = ma_true_cash_calculations.engagement_id
            AND (
                pm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM practice_members pm2
                    WHERE pm2.practice_id = e.practice_id
                    AND pm2.user_id = auth.uid()
                    AND pm2.member_type = 'team'
                )
            )
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_ma_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp triggers
CREATE TRIGGER trg_ma_assessment_updated
    BEFORE UPDATE ON ma_assessment_responses 
    FOR EACH ROW EXECUTE FUNCTION update_ma_timestamp();

CREATE TRIGGER trg_ma_extracted_updated
    BEFORE UPDATE ON ma_extracted_financials 
    FOR EACH ROW EXECUTE FUNCTION update_ma_timestamp();

-- Auto-calculate True Cash when financials are extracted
CREATE OR REPLACE FUNCTION calculate_true_cash()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ma_true_cash_calculations (
        extracted_financials_id,
        engagement_id,
        period_end_date,
        bank_balance,
        less_vat_payable,
        less_paye_nic,
        less_corporation_tax,
        less_director_loan,
        true_cash_available
    ) VALUES (
        NEW.id,
        NEW.engagement_id,
        NEW.period_end_date,
        COALESCE(NEW.bank_balance, 0),
        COALESCE(NEW.vat_payable, 0),
        COALESCE(NEW.paye_nic_payable, 0),
        COALESCE(NEW.corporation_tax_payable, 0),
        COALESCE(NEW.director_loan, 0),
        COALESCE(NEW.bank_balance, 0) 
            - COALESCE(NEW.vat_payable, 0) 
            - COALESCE(NEW.paye_nic_payable, 0) 
            - COALESCE(NEW.corporation_tax_payable, 0)
            - COALESCE(NEW.director_loan, 0)
    )
    ON CONFLICT (extracted_financials_id) DO UPDATE SET
        bank_balance = EXCLUDED.bank_balance,
        less_vat_payable = EXCLUDED.less_vat_payable,
        less_paye_nic = EXCLUDED.less_paye_nic,
        less_corporation_tax = EXCLUDED.less_corporation_tax,
        less_director_loan = EXCLUDED.less_director_loan,
        true_cash_available = EXCLUDED.true_cash_available;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_true_cash ON ma_extracted_financials;
CREATE TRIGGER trg_calculate_true_cash
    AFTER INSERT OR UPDATE ON ma_extracted_financials
    FOR EACH ROW EXECUTE FUNCTION calculate_true_cash();

