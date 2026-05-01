-- ============================================================================
-- MANAGEMENT ACCOUNTS AI LAYER
-- ============================================================================
-- Migration: 20251216_management_accounts_ai_layer.sql
-- Purpose: Add tables for MA engagements, financial snapshots, AI-generated 
--          insights, and industry benchmarks
-- Philosophy: The AI doesn't produce the accounts—it interprets them. 
--             Every insight connects to the client's life goal, not just metrics.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: ma_engagements
-- ============================================================================
-- Tracks Management Accounts service engagements with clients

CREATE TABLE IF NOT EXISTS ma_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    
    -- Service Configuration
    tier TEXT NOT NULL DEFAULT 'silver' CHECK (tier IN ('bronze', 'silver', 'gold')),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Accounting System Integration
    xero_tenant_id TEXT,
    xero_connection_status TEXT DEFAULT 'not_connected' CHECK (xero_connection_status IN ('not_connected', 'connected', 'error', 'expired')),
    xero_last_sync TIMESTAMPTZ,
    qbo_realm_id TEXT,
    qbo_connection_status TEXT DEFAULT 'not_connected' CHECK (qbo_connection_status IN ('not_connected', 'connected', 'error', 'expired')),
    qbo_last_sync TIMESTAMPTZ,
    
    -- Settings
    settings JSONB DEFAULT '{
        "kpiFocusAreas": [],
        "customMetrics": [],
        "reportRecipients": [],
        "autoGenerateInsights": true,
        "includeBenchmarks": true
    }'::jsonb,
    
    -- Pricing
    monthly_fee DECIMAL(10,2),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_engagements_client ON ma_engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_practice ON ma_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_ma_engagements_status ON ma_engagements(status);

-- ============================================================================
-- TABLE: ma_financial_snapshots
-- ============================================================================
-- Monthly/quarterly financial data snapshots for trend analysis

CREATE TABLE IF NOT EXISTS ma_financial_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    
    -- Period
    period_end_date DATE NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'month' CHECK (period_type IN ('month', 'quarter')),
    
    -- Profit & Loss
    revenue DECIMAL(15,2),
    cost_of_sales DECIMAL(15,2),
    gross_profit DECIMAL(15,2),
    gross_margin_pct DECIMAL(5,2),
    overheads DECIMAL(15,2),
    operating_profit DECIMAL(15,2),
    operating_margin_pct DECIMAL(5,2),
    net_profit DECIMAL(15,2),
    net_margin_pct DECIMAL(5,2),
    
    -- Balance Sheet Snapshot
    cash_position DECIMAL(15,2),
    debtors_total DECIMAL(15,2),
    debtors_days INTEGER,
    creditors_total DECIMAL(15,2),
    creditors_days INTEGER,
    inventory_value DECIMAL(15,2),
    net_assets DECIMAL(15,2),
    
    -- Comparatives
    revenue_vs_prior_month DECIMAL(15,2),
    revenue_vs_prior_month_pct DECIMAL(5,2),
    revenue_vs_prior_year DECIMAL(15,2),
    revenue_vs_prior_year_pct DECIMAL(5,2),
    revenue_vs_budget DECIMAL(15,2),
    revenue_vs_budget_pct DECIMAL(5,2),
    profit_vs_budget DECIMAL(15,2),
    profit_vs_budget_pct DECIMAL(5,2),
    cash_vs_prior_month DECIMAL(15,2),
    
    -- Staffing Metrics
    headcount INTEGER,
    revenue_per_head DECIMAL(15,2),
    staff_costs DECIMAL(15,2),
    staff_cost_pct_revenue DECIMAL(5,2),
    
    -- Raw Data (for debugging/audit)
    raw_data JSONB,
    
    -- Source
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('xero', 'qbo', 'manual', 'upload')),
    source_sync_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one snapshot per period per engagement
    UNIQUE(engagement_id, period_end_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_snapshots_engagement ON ma_financial_snapshots(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_snapshots_period ON ma_financial_snapshots(period_end_date DESC);

-- ============================================================================
-- TABLE: ma_monthly_insights
-- ============================================================================
-- AI-generated narrative insights for each financial snapshot

CREATE TABLE IF NOT EXISTS ma_monthly_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES ma_financial_snapshots(id) ON DELETE CASCADE,
    engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
    period_end_date DATE NOT NULL,
    
    -- The Headline
    headline_text TEXT NOT NULL,
    headline_sentiment TEXT NOT NULL CHECK (headline_sentiment IN ('positive', 'neutral', 'warning', 'critical')),
    
    -- Key Insights (structured array)
    -- Each insight: { category, finding, implication, action, urgency }
    insights JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Decisions Enabled (structured array)
    -- Each decision: { decision, supportingData, consideration }
    decisions_enabled JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Watch List (structured array)
    -- Each item: { metric, currentValue, threshold, checkDate }
    watch_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- North Star Connection
    north_star_connection TEXT,
    north_star_sentiment TEXT CHECK (north_star_sentiment IN ('closer', 'stable', 'further')),
    
    -- Benchmark Comparison (if available)
    benchmark_comparison JSONB,
    
    -- Generation Metadata
    llm_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
    llm_tokens_used INTEGER,
    llm_cost DECIMAL(8,4),
    generation_time_ms INTEGER,
    generation_prompt_version TEXT DEFAULT 'v1',
    
    -- Approval Workflow
    status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'approved', 'rejected', 'shared')),
    reviewed_by UUID REFERENCES practice_members(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    approved_by UUID REFERENCES practice_members(id),
    approved_at TIMESTAMPTZ,
    
    -- Client Sharing
    shared_with_client BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    shared_by UUID REFERENCES practice_members(id),
    
    -- Client Feedback (for learning loop)
    client_feedback JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one insight per snapshot
    UNIQUE(snapshot_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_insights_snapshot ON ma_monthly_insights(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_ma_insights_engagement ON ma_monthly_insights(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_insights_period ON ma_monthly_insights(period_end_date DESC);
CREATE INDEX IF NOT EXISTS idx_ma_insights_status ON ma_monthly_insights(status);

-- ============================================================================
-- TABLE: ma_industry_benchmarks
-- ============================================================================
-- Industry benchmark data for comparison context

CREATE TABLE IF NOT EXISTS ma_industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    
    -- Industry Classification
    industry_code TEXT NOT NULL,
    industry_name TEXT NOT NULL,
    revenue_band TEXT NOT NULL CHECK (revenue_band IN ('under_250k', '250k_500k', '500k_1m', '1m_2m', '2m_5m', '5m_10m', 'over_10m')),
    period_year INTEGER NOT NULL,
    
    -- Margin Benchmarks
    median_gross_margin_pct DECIMAL(5,2),
    median_net_margin_pct DECIMAL(5,2),
    top_quartile_gross_margin_pct DECIMAL(5,2),
    top_quartile_net_margin_pct DECIMAL(5,2),
    bottom_quartile_gross_margin_pct DECIMAL(5,2),
    bottom_quartile_net_margin_pct DECIMAL(5,2),
    
    -- Working Capital Benchmarks
    median_debtor_days INTEGER,
    median_creditor_days INTEGER,
    top_quartile_debtor_days INTEGER,
    top_quartile_creditor_days INTEGER,
    
    -- Efficiency Benchmarks
    median_revenue_per_head DECIMAL(15,2),
    median_staff_cost_pct DECIMAL(5,2),
    top_quartile_revenue_per_head DECIMAL(15,2),
    
    -- Source & Quality
    sample_size INTEGER,
    data_source TEXT NOT NULL DEFAULT 'internal' CHECK (data_source IN ('fame', 'orbis', 'internal', 'industry_body', 'research')),
    confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index (handles NULL practice_id by treating it as a sentinel UUID)
-- This allows global benchmarks (practice_id = NULL) to coexist with practice-specific ones
CREATE UNIQUE INDEX IF NOT EXISTS idx_ma_benchmarks_unique ON ma_industry_benchmarks(
    industry_code, 
    revenue_band, 
    period_year, 
    COALESCE(practice_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Lookup index
CREATE INDEX IF NOT EXISTS idx_ma_benchmarks_lookup ON ma_industry_benchmarks(industry_code, revenue_band, period_year);

-- ============================================================================
-- TABLE: ma_insight_feedback
-- ============================================================================
-- Practice team and client feedback on generated insights (for learning loop)

CREATE TABLE IF NOT EXISTS ma_insight_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL REFERENCES ma_monthly_insights(id) ON DELETE CASCADE,
    
    -- Feedback Source
    feedback_source TEXT NOT NULL CHECK (feedback_source IN ('practice_team', 'client')),
    feedback_by UUID REFERENCES practice_members(id),
    
    -- Ratings
    headline_accuracy INTEGER CHECK (headline_accuracy BETWEEN 1 AND 5),
    insight_relevance INTEGER CHECK (insight_relevance BETWEEN 1 AND 5),
    action_usefulness INTEGER CHECK (action_usefulness BETWEEN 1 AND 5),
    north_star_connection_quality INTEGER CHECK (north_star_connection_quality BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    
    -- Qualitative Feedback
    what_was_valuable TEXT,
    what_was_missing TEXT,
    what_was_wrong TEXT,
    suggested_improvements TEXT,
    
    -- Edits Made (to track what practice team changed)
    edits_made JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ma_feedback_insight ON ma_insight_feedback(insight_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ma_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_monthly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_insight_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS ma_engagements_select ON ma_engagements;
DROP POLICY IF EXISTS ma_engagements_insert ON ma_engagements;
DROP POLICY IF EXISTS ma_engagements_update ON ma_engagements;
DROP POLICY IF EXISTS ma_engagements_delete ON ma_engagements;

DROP POLICY IF EXISTS ma_snapshots_select ON ma_financial_snapshots;
DROP POLICY IF EXISTS ma_snapshots_insert ON ma_financial_snapshots;
DROP POLICY IF EXISTS ma_snapshots_update ON ma_financial_snapshots;
DROP POLICY IF EXISTS ma_snapshots_delete ON ma_financial_snapshots;

DROP POLICY IF EXISTS ma_insights_select ON ma_monthly_insights;
DROP POLICY IF EXISTS ma_insights_insert ON ma_monthly_insights;
DROP POLICY IF EXISTS ma_insights_update ON ma_monthly_insights;
DROP POLICY IF EXISTS ma_insights_delete ON ma_monthly_insights;

DROP POLICY IF EXISTS ma_benchmarks_select ON ma_industry_benchmarks;
DROP POLICY IF EXISTS ma_benchmarks_insert ON ma_industry_benchmarks;
DROP POLICY IF EXISTS ma_benchmarks_update ON ma_industry_benchmarks;
DROP POLICY IF EXISTS ma_benchmarks_delete ON ma_industry_benchmarks;

DROP POLICY IF EXISTS ma_feedback_select ON ma_insight_feedback;
DROP POLICY IF EXISTS ma_feedback_insert ON ma_insight_feedback;
DROP POLICY IF EXISTS ma_feedback_update ON ma_insight_feedback;
DROP POLICY IF EXISTS ma_feedback_delete ON ma_insight_feedback;

-- RLS Policies for ma_engagements
CREATE POLICY ma_engagements_select ON ma_engagements
    FOR SELECT USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_engagements_insert ON ma_engagements
    FOR INSERT WITH CHECK (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_engagements_update ON ma_engagements
    FOR UPDATE USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_engagements_delete ON ma_engagements
    FOR DELETE USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for ma_financial_snapshots
CREATE POLICY ma_snapshots_select ON ma_financial_snapshots
    FOR SELECT USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_snapshots_insert ON ma_financial_snapshots
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_snapshots_update ON ma_financial_snapshots
    FOR UPDATE USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_snapshots_delete ON ma_financial_snapshots
    FOR DELETE USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- RLS Policies for ma_monthly_insights
CREATE POLICY ma_insights_select ON ma_monthly_insights
    FOR SELECT USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_insights_insert ON ma_monthly_insights
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_insights_update ON ma_monthly_insights
    FOR UPDATE USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_insights_delete ON ma_monthly_insights
    FOR DELETE USING (
        engagement_id IN (
            SELECT e.id FROM ma_engagements e
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- RLS Policies for ma_industry_benchmarks (global benchmarks + practice-specific)
CREATE POLICY ma_benchmarks_select ON ma_industry_benchmarks
    FOR SELECT USING (
        practice_id IS NULL OR 
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_benchmarks_insert ON ma_industry_benchmarks
    FOR INSERT WITH CHECK (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_benchmarks_update ON ma_industry_benchmarks
    FOR UPDATE USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ma_benchmarks_delete ON ma_industry_benchmarks
    FOR DELETE USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for ma_insight_feedback
CREATE POLICY ma_feedback_select ON ma_insight_feedback
    FOR SELECT USING (
        insight_id IN (
            SELECT i.id FROM ma_monthly_insights i
            JOIN ma_engagements e ON i.engagement_id = e.id
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_feedback_insert ON ma_insight_feedback
    FOR INSERT WITH CHECK (
        insight_id IN (
            SELECT i.id FROM ma_monthly_insights i
            JOIN ma_engagements e ON i.engagement_id = e.id
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_feedback_update ON ma_insight_feedback
    FOR UPDATE USING (
        insight_id IN (
            SELECT i.id FROM ma_monthly_insights i
            JOIN ma_engagements e ON i.engagement_id = e.id
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY ma_feedback_delete ON ma_insight_feedback
    FOR DELETE USING (
        insight_id IN (
            SELECT i.id FROM ma_monthly_insights i
            JOIN ma_engagements e ON i.engagement_id = e.id
            JOIN practice_members pm ON e.practice_id = pm.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_ma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS trg_ma_engagements_updated ON ma_engagements;
CREATE TRIGGER trg_ma_engagements_updated
    BEFORE UPDATE ON ma_engagements
    FOR EACH ROW EXECUTE FUNCTION update_ma_updated_at();

DROP TRIGGER IF EXISTS trg_ma_snapshots_updated ON ma_financial_snapshots;
CREATE TRIGGER trg_ma_snapshots_updated
    BEFORE UPDATE ON ma_financial_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_ma_updated_at();

DROP TRIGGER IF EXISTS trg_ma_insights_updated ON ma_monthly_insights;
CREATE TRIGGER trg_ma_insights_updated
    BEFORE UPDATE ON ma_monthly_insights
    FOR EACH ROW EXECUTE FUNCTION update_ma_updated_at();

DROP TRIGGER IF EXISTS trg_ma_benchmarks_updated ON ma_industry_benchmarks;
CREATE TRIGGER trg_ma_benchmarks_updated
    BEFORE UPDATE ON ma_industry_benchmarks
    FOR EACH ROW EXECUTE FUNCTION update_ma_updated_at();

-- ============================================================================
-- AUTO-GENERATE INSIGHTS TRIGGER
-- ============================================================================
-- Creates a placeholder insight record when a snapshot is created
-- The edge function will be triggered via webhook to populate it

CREATE OR REPLACE FUNCTION trigger_ma_insight_generation()
RETURNS TRIGGER AS $$
DECLARE
    engagement_settings JSONB;
    auto_generate BOOLEAN;
BEGIN
    -- Get engagement settings
    SELECT settings INTO engagement_settings
    FROM ma_engagements WHERE id = NEW.engagement_id;
    
    -- Check if auto-generation is enabled (default to true)
    auto_generate := COALESCE((engagement_settings->>'autoGenerateInsights')::boolean, true);
    
    IF auto_generate = true THEN
        -- Insert placeholder insight record (will be populated by edge function)
        INSERT INTO ma_monthly_insights (
            snapshot_id,
            engagement_id,
            period_end_date,
            headline_text,
            headline_sentiment,
            status
        ) VALUES (
            NEW.id,
            NEW.engagement_id,
            NEW.period_end_date,
            'Generating insights...',
            'neutral',
            'generating'
        )
        ON CONFLICT (snapshot_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_snapshot_created_generate_insights ON ma_financial_snapshots;
CREATE TRIGGER trg_snapshot_created_generate_insights
    AFTER INSERT ON ma_financial_snapshots
    FOR EACH ROW EXECUTE FUNCTION trigger_ma_insight_generation();

-- ============================================================================
-- SERVICE ROLE BYPASS POLICIES
-- ============================================================================
-- Allow service role full access for edge functions

CREATE POLICY ma_engagements_service ON ma_engagements
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY ma_snapshots_service ON ma_financial_snapshots
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY ma_insights_service ON ma_monthly_insights
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY ma_benchmarks_service ON ma_industry_benchmarks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY ma_feedback_service ON ma_insight_feedback
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON ma_engagements TO authenticated;
GRANT ALL ON ma_engagements TO service_role;
GRANT ALL ON ma_financial_snapshots TO authenticated;
GRANT ALL ON ma_financial_snapshots TO service_role;
GRANT ALL ON ma_monthly_insights TO authenticated;
GRANT ALL ON ma_monthly_insights TO service_role;
GRANT ALL ON ma_industry_benchmarks TO authenticated;
GRANT ALL ON ma_industry_benchmarks TO service_role;
GRANT ALL ON ma_insight_feedback TO authenticated;
GRANT ALL ON ma_insight_feedback TO service_role;

