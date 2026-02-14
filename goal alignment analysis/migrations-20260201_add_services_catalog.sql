-- ============================================================================
-- Services Catalog and Issue-to-Service Mapping
-- Created: 2026-02-01
-- Purpose: Enable dynamic service management and issue-to-service recommendations
-- ============================================================================

-- =============================================================================
-- SERVICES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'management_accounts', 'advisory', 'fractional', 'audit'
  tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum' for MA
  short_description TEXT,
  what_we_do JSONB, -- Array of bullet points
  price_amount INTEGER NOT NULL,
  price_period TEXT NOT NULL, -- 'month', 'year', 'one-off'
  price_display TEXT, -- e.g., "£1,500/month"
  typical_roi TEXT,
  best_for TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ISSUE TO SERVICE MAPPING TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS issue_service_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  trigger_field TEXT NOT NULL,
  trigger_condition TEXT NOT NULL, -- 'gt', 'lt', 'eq', 'gte', 'lte', 'contains'
  trigger_value TEXT NOT NULL,
  primary_service_code TEXT REFERENCES services(code),
  secondary_service_code TEXT REFERENCES services(code),
  why_it_matters_template TEXT,
  roi_template TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_issue_mappings_active ON issue_service_mappings(is_active) WHERE is_active = true;

-- =============================================================================
-- SEED SERVICES DATA
-- =============================================================================

-- Management Accounts Tiers
INSERT INTO services (code, name, category, tier, short_description, what_we_do, price_amount, price_period, price_display, typical_roi, best_for, display_order) VALUES

('ma_bronze', 'Management Accounts - Bronze', 'management_accounts', 'bronze',
 'Monthly financial visibility with P&L, Balance Sheet and basic commentary.',
 '["Monthly P&L and Balance Sheet", "Basic narrative commentary", "KPI dashboard", "Email delivery"]'::jsonb,
 750, 'month', '£750/month',
 'Foundation for financial decision-making',
 'Businesses wanting basic visibility', 10),

('ma_silver', 'Management Accounts - Silver', 'management_accounts', 'silver',
 'Enhanced reporting with cash flow forecasting and segment analysis.',
 '["Everything in Bronze", "13-week rolling cash forecast", "Revenue by client/segment", "Trend analysis", "Quarterly review call"]'::jsonb,
 1000, 'month', '£1,000/month',
 'Cash flow confidence and better decisions',
 'Growing businesses needing forward visibility', 20),

('ma_gold', 'Management Accounts - Gold', 'management_accounts', 'gold',
 'Full strategic finance support with margin tracking and deep insights.',
 '["Everything in Silver", "Project/client margin tracking", "Strategic narrative and insights", "Monthly review call", "Concentration monitoring", "Custom KPI dashboard"]'::jsonb,
 1500, 'month', '£1,500/month',
 '2-5% margin improvement typical',
 'Ambitious businesses wanting strategic advantage', 30),

('ma_platinum', 'Management Accounts - Platinum', 'management_accounts', 'platinum',
 'Board-level finance support with weekly touchpoints.',
 '["Everything in Gold", "Weekly touchpoints", "Board pack preparation", "Investor/bank reporting", "Ad-hoc analysis", "Direct access to senior accountant"]'::jsonb,
 5000, 'month', '£5,000/month',
 'Full CFO-level support without CFO cost',
 'Complex businesses or those preparing for exit/investment', 40),

-- Advisory Services
('goal_alignment', '365 Alignment Programme', 'advisory', NULL,
 'Strategic clarity with North Star articulation, 90-day sprints, and quarterly reviews.',
 '["North Star destination articulation", "90-day sprint planning", "Quarterly accountability reviews", "Team alignment workshops", "8 psychometric assessments", "Knowledge transfer framework"]'::jsonb,
 4500, 'year', '£4,500/year',
 '+20-40% business value through succession readiness',
 'Businesses seeking strategic clarity or succession planning', 50),

('systems_audit', 'Systems Audit', 'audit', NULL,
 'Process mapping and gap analysis with implementation roadmap.',
 '["Full process mapping", "System inventory and assessment", "Integration gap analysis", "Efficiency opportunities", "Implementation roadmap", "Vendor recommendations"]'::jsonb,
 2500, 'one-off', '£2,500',
 '10-20% operational efficiency improvement',
 'Businesses with manual processes or system fragmentation', 60),

('benchmarking', 'Benchmarking Deep Dive', 'advisory', NULL,
 'Quarterly benchmark refresh with trend analysis and action tracking.',
 '["Quarterly industry comparison", "Trend analysis vs benchmarks", "Action plan tracking", "Gap closure monitoring", "Board-ready presentation"]'::jsonb,
 2000, 'quarter', '£2,000/quarter',
 'Clear visibility of competitive position',
 'Businesses wanting ongoing competitive insight', 65),

('business_intelligence', 'Business Intelligence', 'advisory', NULL,
 'Monthly financial clarity with KPIs, True Cash position, and actionable insights.',
 '["Monthly KPI dashboard", "True Cash calculation", "Trend analysis", "Exception alerting", "Quarterly strategy review"]'::jsonb,
 1500, 'month', '£1,500/month',
 'Decision confidence and early warning system',
 'Businesses wanting data-driven decisions', 68),

('profit_extraction', 'Profit Extraction Strategy', 'advisory', NULL,
 'Tax-efficient profit distribution and remuneration planning.',
 '["Remuneration structure review", "Dividend planning", "Pension contribution optimisation", "Tax efficiency analysis", "Implementation support"]'::jsonb,
 2000, 'one-off', '£2,000',
 'Typical 5-15% tax efficiency improvement',
 'Directors wanting to optimise personal wealth extraction', 70),

('ffi_advisory', 'Future Financial Information', 'advisory', NULL,
 'Forward-looking financial planning with scenario modelling.',
 '["12-month rolling forecast", "Scenario planning", "Cash flow projections", "Investment appraisal", "Bank-ready documentation"]'::jsonb,
 3500, 'one-off', '£3,500',
 'Funding confidence and strategic clarity',
 'Businesses planning investment, funding or exit', 75),

-- Fractional Services
('fractional_cfo', 'Fractional CFO', 'fractional', NULL,
 'Senior financial strategy without full-time cost.',
 '["Financial strategy development", "Pricing and margin optimisation", "Fundraising support", "Exit planning and preparation", "Board/investor presentations", "Cash management"]'::jsonb,
 3000, 'month', '£2,000-5,000/month',
 'Varies by engagement - typically 5-10x ROI',
 'Businesses needing senior financial leadership', 80),

('fractional_coo', 'Fractional COO', 'fractional', NULL,
 'Operational leadership for scaling businesses.',
 '["Process improvement", "Team structure optimisation", "Operational scaling", "Vendor management", "Project oversight"]'::jsonb,
 3000, 'month', '£2,000-5,000/month',
 '10-20 hours/week saved, operational clarity',
 'Businesses with operational chaos or scaling challenges', 85),

-- Automation
('finance_automation', 'Finance Automation', 'audit', NULL,
 'Streamline data capture, reduce manual work, improve accuracy.',
 '["Process analysis", "Tool selection", "Implementation support", "Training and handover", "Ongoing optimisation"]'::jsonb,
 150, 'hour', '£115-180/hour',
 'Typically 40-60% time savings on routine tasks',
 'Businesses drowning in manual finance processes', 90)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  short_description = EXCLUDED.short_description,
  what_we_do = EXCLUDED.what_we_do,
  price_amount = EXCLUDED.price_amount,
  price_period = EXCLUDED.price_period,
  price_display = EXCLUDED.price_display,
  typical_roi = EXCLUDED.typical_roi,
  best_for = EXCLUDED.best_for,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- =============================================================================
-- SEED ISSUE MAPPINGS DATA
-- =============================================================================
INSERT INTO issue_service_mappings (issue_code, title, severity, trigger_field, trigger_condition, trigger_value, primary_service_code, secondary_service_code, why_it_matters_template, roi_template, display_order) VALUES

-- Concentration Risk
('concentration_critical', 'Critical Client Concentration', 'critical',
 'client_concentration_top3', 'gte', '80',
 'ma_gold', 'goal_alignment',
 '{concentration}% of your £{revenue} revenue comes from just 3 clients. Loss of one relationship could be catastrophic.',
 'Protection and monitoring of £{revenue} revenue base',
 10),

('concentration_high', 'High Client Concentration', 'high',
 'client_concentration_top3', 'gte', '60',
 'ma_silver', 'goal_alignment',
 '{concentration}% of revenue from top 3 clients creates dependency risk.',
 'Diversification tracking and strategic planning',
 15),

-- Founder Dependency
('founder_dependency_critical', 'Critical Founder Dependency', 'critical',
 'founder_risk_level', 'eq', 'critical',
 'goal_alignment', 'systems_audit',
 'Critical knowledge and relationships concentrated in founder. {valuation_impact} if not addressed.',
 '+30-50% business value through succession readiness',
 20),

('founder_dependency_high', 'High Founder Dependency', 'high',
 'founder_risk_level', 'eq', 'high',
 'goal_alignment', NULL,
 'Significant founder dependency identified. {valuation_impact}.',
 '+20-30% business value through knowledge transfer',
 25),

-- Margin Issues
('margin_bottom_quartile', 'Margin Significantly Below Peers', 'high',
 'ebitda_percentile', 'lt', '25',
 'fractional_cfo', 'ma_gold',
 'Your EBITDA margin is in the bottom quartile. Closing to median would add £{gap_value}/year.',
 'Potential £{gap_value}/year margin improvement',
 30),

('margin_below_median', 'Margin Below Industry Median', 'medium',
 'ebitda_percentile', 'lt', '50',
 'ma_gold', NULL,
 'Your EBITDA margin of {ebitda}% is below the industry median. Improvement potential: £{gap_value}/year.',
 '£{gap_value}/year margin improvement opportunity',
 35),

('gross_margin_low', 'Low Gross Margin', 'high',
 'gross_margin_gap', 'gt', '5',
 'business_intelligence', 'fractional_cfo',
 'Gross margin {gross_margin}% is more than 5 points below industry median. This suggests pricing or cost issues.',
 'Potential £{gap_value}/year margin recovery',
 38),

-- Cash Flow Issues
('debtor_days_critical', 'Critical Debtor Days', 'high',
 'debtor_days', 'gt', '60',
 'systems_audit', 'ma_silver',
 'Your debtor days of {debtor_days} is critically high, tying up £{cash_tied} in working capital.',
 'Release £{cash_tied} from working capital',
 40),

('debtor_days_high', 'High Debtor Days', 'medium',
 'debtor_days', 'gt', '45',
 'ma_silver', 'finance_automation',
 'Debtor days of {debtor_days} is above industry norm, affecting cash flow.',
 'Improve cash position by £{cash_tied}',
 45),

-- Efficiency Issues  
('revenue_per_employee_low', 'Low Revenue Per Employee', 'high',
 'revenue_per_employee_percentile', 'lt', '25',
 'fractional_coo', 'systems_audit',
 'Revenue per employee of £{rpe} is in the bottom quartile. Indicates utilisation or efficiency issues.',
 '15-25% improvement in revenue per employee achievable',
 50),

-- Financial Visibility
('no_management_accounts', 'No Regular Financial Visibility', 'high',
 'has_management_accounts', 'eq', 'false',
 'ma_silver', NULL,
 'Without regular management information, you are making decisions blind.',
 'Decision confidence and early warning system',
 55),

-- Pricing Issues
('pricing_stale', 'Stale Pricing', 'medium',
 'last_price_increase', 'eq', 'More than 2 years ago',
 'fractional_cfo', NULL,
 'No price increase in over 2 years while costs have risen. You are effectively getting poorer.',
 'Typical 5-10% rate improvement achievable',
 60),

-- Operational Overload
('operational_chaos', 'Operational Overload', 'high',
 'owner_hours_weekly', 'gt', '50',
 'fractional_coo', 'systems_audit',
 'Working {hours}+ hours weekly with constant firefighting indicates operational dysfunction.',
 'Reclaim 10-20 hours/week, reduce stress',
 65),

-- Surplus Cash (Opportunity)
('surplus_cash_opportunity', 'Significant Surplus Cash', 'low',
 'surplus_cash', 'gt', '500000',
 'profit_extraction', 'ffi_advisory',
 'You have £{surplus_cash} cash above operating requirements that could be working harder.',
 'Optimised cash deployment with tax efficiency',
 70)

ON CONFLICT (issue_code) DO UPDATE SET
  title = EXCLUDED.title,
  severity = EXCLUDED.severity,
  trigger_field = EXCLUDED.trigger_field,
  trigger_condition = EXCLUDED.trigger_condition,
  trigger_value = EXCLUDED.trigger_value,
  primary_service_code = EXCLUDED.primary_service_code,
  secondary_service_code = EXCLUDED.secondary_service_code,
  why_it_matters_template = EXCLUDED.why_it_matters_template,
  roi_template = EXCLUDED.roi_template,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_service_mappings ENABLE ROW LEVEL SECURITY;

-- Public read access for services (they're public catalog)
CREATE POLICY "Services are publicly readable" ON services
  FOR SELECT USING (is_active = true);

-- Public read access for mappings
CREATE POLICY "Issue mappings are publicly readable" ON issue_service_mappings
  FOR SELECT USING (is_active = true);

-- Only authenticated users can modify (admin functions)
CREATE POLICY "Authenticated users can manage services" ON services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage mappings" ON issue_service_mappings
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

