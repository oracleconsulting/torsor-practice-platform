-- ============================================================================
-- BI PHASE 3: REPORT SCHEDULING & AUTOMATION
-- ============================================================================
-- Adds tables for scheduled report delivery and automation
-- ============================================================================

-- ============================================================================
-- REPORT SCHEDULES TABLE
-- ============================================================================
-- Stores scheduled report configurations
CREATE TABLE IF NOT EXISTS bi_report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES bi_engagements(id) ON DELETE CASCADE,
    
    -- Schedule configuration
    schedule_name TEXT NOT NULL,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('monthly', 'weekly', 'quarterly', 'on_completion')),
    
    -- Report configuration
    report_types TEXT[] NOT NULL DEFAULT ARRAY['summary']::TEXT[],
    include_pdf BOOLEAN DEFAULT true,
    include_dashboard_link BOOLEAN DEFAULT true,
    
    -- Delivery configuration
    delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'slack', 'webhook')),
    recipients JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- recipients format: [{ "type": "email", "address": "...", "name": "..." }]
    
    -- Timing
    delivery_day INTEGER, -- 1-7 for weekly (Mon=1), 1-28 for monthly
    delivery_time TIME DEFAULT '09:00:00',
    timezone TEXT DEFAULT 'Europe/London',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    next_scheduled_at TIMESTAMPTZ,
    send_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SCHEDULED REPORT HISTORY
-- ============================================================================
-- Tracks all sent scheduled reports
CREATE TABLE IF NOT EXISTS bi_scheduled_report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES bi_report_schedules(id) ON DELETE CASCADE,
    period_id UUID REFERENCES bi_periods(id) ON DELETE SET NULL,
    
    -- Delivery details
    sent_at TIMESTAMPTZ DEFAULT now(),
    recipients_count INTEGER NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'failed', 'partial')),
    
    -- Report details
    report_types TEXT[] NOT NULL,
    pdf_storage_path TEXT,
    
    -- Results
    delivery_results JSONB,
    -- format: [{ "recipient": "...", "status": "delivered|failed", "error": "..." }]
    
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================
-- User notification preferences for BI reports
CREATE TABLE IF NOT EXISTS bi_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    engagement_id UUID REFERENCES bi_engagements(id) ON DELETE CASCADE,
    
    -- Notification types
    notify_report_ready BOOLEAN DEFAULT true,
    notify_kpi_alerts BOOLEAN DEFAULT true,
    notify_insight_generated BOOLEAN DEFAULT true,
    notify_period_due BOOLEAN DEFAULT true,
    
    -- Delivery preferences
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    slack_enabled BOOLEAN DEFAULT false,
    
    -- Thresholds
    kpi_alert_threshold TEXT DEFAULT 'red', -- 'red', 'amber', 'all'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, engagement_id)
);

-- ============================================================================
-- KPI ALERTS
-- ============================================================================
-- Stores triggered KPI alerts
CREATE TABLE IF NOT EXISTS bi_kpi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
    kpi_code TEXT NOT NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_breach', 'trend_change', 'target_miss', 'anomaly')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Values
    current_value NUMERIC,
    threshold_value NUMERIC,
    previous_value NUMERIC,
    
    -- Message
    title TEXT NOT NULL,
    description TEXT,
    recommendation TEXT,
    
    -- Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- CLIENT PROFITABILITY DATA
-- ============================================================================
-- Stores client-level profitability data for analysis
CREATE TABLE IF NOT EXISTS bi_client_profitability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
    
    -- Client identification
    client_ref TEXT NOT NULL, -- External client reference
    client_name TEXT NOT NULL,
    segment TEXT,
    
    -- Financial data
    revenue NUMERIC NOT NULL DEFAULT 0,
    direct_costs NUMERIC NOT NULL DEFAULT 0,
    gross_profit NUMERIC GENERATED ALWAYS AS (revenue - direct_costs) STORED,
    gross_margin_pct NUMERIC GENERATED ALWAYS AS (
        CASE WHEN revenue > 0 THEN ((revenue - direct_costs) / revenue) * 100 ELSE 0 END
    ) STORED,
    
    -- Allocated costs (optional)
    allocated_overheads NUMERIC,
    net_contribution NUMERIC GENERATED ALWAYS AS (
        revenue - direct_costs - COALESCE(allocated_overheads, 0)
    ) STORED,
    
    -- Metrics
    hours_worked NUMERIC,
    effective_rate NUMERIC GENERATED ALWAYS AS (
        CASE WHEN hours_worked > 0 THEN revenue / hours_worked ELSE NULL END
    ) STORED,
    
    -- Analysis
    status TEXT CHECK (status IN ('top_performer', 'average', 'needs_attention', 'at_risk')),
    trend TEXT CHECK (trend IN ('up', 'down', 'flat')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(period_id, client_ref)
);

-- ============================================================================
-- CASH FLOW CATEGORIES
-- ============================================================================
-- Stores detailed cash flow breakdown
CREATE TABLE IF NOT EXISTS bi_cash_flow_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES bi_periods(id) ON DELETE CASCADE,
    
    -- Categorization
    flow_type TEXT NOT NULL CHECK (flow_type IN ('inflow', 'outflow')),
    category TEXT NOT NULL CHECK (category IN ('operating', 'investing', 'financing')),
    
    -- Details
    label TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_item_id UUID REFERENCES bi_cash_flow_items(id),
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Report schedules
CREATE INDEX IF NOT EXISTS idx_bi_schedules_engagement ON bi_report_schedules(engagement_id);
CREATE INDEX IF NOT EXISTS idx_bi_schedules_next ON bi_report_schedules(next_scheduled_at) WHERE is_active = true;

-- Report history
CREATE INDEX IF NOT EXISTS idx_bi_report_history_schedule ON bi_scheduled_report_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bi_report_history_sent ON bi_scheduled_report_history(sent_at DESC);

-- Notification preferences
CREATE INDEX IF NOT EXISTS idx_bi_notif_prefs_user ON bi_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bi_notif_prefs_engagement ON bi_notification_preferences(engagement_id);

-- KPI alerts
CREATE INDEX IF NOT EXISTS idx_bi_kpi_alerts_period ON bi_kpi_alerts(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_kpi_alerts_unacked ON bi_kpi_alerts(is_acknowledged, created_at DESC) 
    WHERE is_acknowledged = false;

-- Client profitability
CREATE INDEX IF NOT EXISTS idx_bi_client_profit_period ON bi_client_profitability(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_client_profit_status ON bi_client_profitability(status);

-- Cash flow items
CREATE INDEX IF NOT EXISTS idx_bi_cash_flow_period ON bi_cash_flow_items(period_id);
CREATE INDEX IF NOT EXISTS idx_bi_cash_flow_category ON bi_cash_flow_items(category, flow_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE bi_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_scheduled_report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_kpi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_client_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_cash_flow_items ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY bi_schedules_access ON bi_report_schedules
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY bi_report_history_access ON bi_scheduled_report_history
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY bi_notif_prefs_access ON bi_notification_preferences
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY bi_kpi_alerts_access ON bi_kpi_alerts
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY bi_client_profit_access ON bi_client_profitability
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY bi_cash_flow_access ON bi_cash_flow_items
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate next scheduled time
CREATE OR REPLACE FUNCTION calculate_next_schedule_time(
    p_schedule_type TEXT,
    p_delivery_day INTEGER,
    p_delivery_time TIME,
    p_timezone TEXT DEFAULT 'Europe/London'
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_next TIMESTAMPTZ;
    v_now TIMESTAMPTZ;
    v_target_day INTEGER;
BEGIN
    v_now := now() AT TIME ZONE p_timezone;
    
    CASE p_schedule_type
        WHEN 'weekly' THEN
            -- Find next occurrence of delivery_day (1=Mon, 7=Sun)
            v_target_day := COALESCE(p_delivery_day, 1);
            v_next := date_trunc('week', v_now) + ((v_target_day - 1) * INTERVAL '1 day') + p_delivery_time;
            IF v_next <= v_now THEN
                v_next := v_next + INTERVAL '1 week';
            END IF;
            
        WHEN 'monthly' THEN
            -- Find next occurrence of delivery_day (1-28)
            v_target_day := LEAST(COALESCE(p_delivery_day, 1), 28);
            v_next := date_trunc('month', v_now) + ((v_target_day - 1) * INTERVAL '1 day') + p_delivery_time;
            IF v_next <= v_now THEN
                v_next := v_next + INTERVAL '1 month';
            END IF;
            
        WHEN 'quarterly' THEN
            -- First day of next quarter
            v_next := date_trunc('quarter', v_now) + INTERVAL '3 months' + p_delivery_time;
            
        ELSE
            -- on_completion - no fixed schedule
            v_next := NULL;
    END CASE;
    
    RETURN v_next AT TIME ZONE p_timezone AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_scheduled_at
CREATE OR REPLACE FUNCTION update_schedule_next_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active AND NEW.schedule_type != 'on_completion' THEN
        NEW.next_scheduled_at := calculate_next_schedule_time(
            NEW.schedule_type,
            NEW.delivery_day,
            NEW.delivery_time,
            NEW.timezone
        );
    ELSE
        NEW.next_scheduled_at := NULL;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bi_schedule_update_next
    BEFORE INSERT OR UPDATE OF schedule_type, delivery_day, delivery_time, timezone, is_active
    ON bi_report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_next_time();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bi_report_schedules IS 'Scheduled report delivery configurations';
COMMENT ON TABLE bi_scheduled_report_history IS 'History of sent scheduled reports';
COMMENT ON TABLE bi_notification_preferences IS 'User notification preferences for BI';
COMMENT ON TABLE bi_kpi_alerts IS 'Triggered KPI alerts and threshold breaches';
COMMENT ON TABLE bi_client_profitability IS 'Client-level profitability analysis data';
COMMENT ON TABLE bi_cash_flow_items IS 'Detailed cash flow breakdown items';

