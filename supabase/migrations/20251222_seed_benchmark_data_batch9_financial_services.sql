-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 9: FINANCIAL SERVICES
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5, 6, 7 and 8 have been applied

-- SECTOR CONTEXT NOTE:
-- "Regulatory Pressure and Retention" defines 2024
-- IFAs: FCA Ongoing Advice Review - 83% deemed suitable but consolidation continues
-- Mortgages: Product Transfers = 83% of deals, decimating broker income
-- Fintech: Investment stabilised at £2bn H1, valuation multiples reset (6-8x vs 20x+ in 2021)

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('IFA', 'Financial Advice / IFA', 'financial_services', 'Independent financial advisers, wealth management and financial planning', ARRAY['66190'], ARRAY['IFA', 'financial adviser', 'wealth management', 'financial planning'], true),
  ('MORTGAGE', 'Mortgage Broker', 'financial_services', 'Mortgage brokers, mortgage advisers and home loan services', ARRAY['66190'], ARRAY['mortgage broker', 'mortgage adviser', 'home loans'], true),
  ('INSURANCE', 'Insurance Broker', 'financial_services', 'Insurance brokers, commercial insurance and insurance advisory services', ARRAY['66220'], ARRAY['insurance broker', 'commercial insurance', 'insurance'], true),
  ('FINTECH', 'Fintech / Payments', 'financial_services', 'Fintech companies, payment services and financial technology platforms', ARRAY['64190', '66190'], ARRAY['fintech', 'payments', 'financial technology'], true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sic_codes = EXCLUDED.sic_codes,
  keywords = EXCLUDED.keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECOND: INSERT METRIC DEFINITIONS
-- Ensure all metric codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_metrics (code, name, description, unit, higher_is_better, display_format)
VALUES
  -- IFA
  ('total_client_cost_percent', 'Total Client Cost %', 'All-in cost (Advice + Platform + Fund)', 'percent', false, '{value}%'),
  ('ongoing_advice_fee', 'Ongoing Advice Fee', 'Annual fee as percentage of AUM', 'percent', true, '{value}%'),
  ('revenue_per_adviser', 'Revenue per Adviser', 'Annual revenue per financial adviser', 'currency', true, '£{value}'),
  ('clients_per_adviser', 'Clients per Adviser', 'Active clients per adviser', 'number', true, '{value}'),
  ('assets_per_client', 'Assets per Client', 'Average assets under advice per client', 'currency', true, '£{value}'),
  ('exit_valuation_multiple', 'Exit Valuation Multiple', 'Business value as multiple of recurring revenue', 'ratio', true, '{value}x'),
  
  -- Mortgage Broker
  ('completions_per_year', 'Completions per Year', 'Mortgage completions per broker annually', 'number', true, '{value}'),
  ('proc_fee_purchase', 'Proc Fee (Purchase)', 'Lender procuration fee for purchases', 'percent', true, '{value}%'),
  ('proc_fee_transfer', 'Proc Fee (Transfer)', 'Lender procuration fee for product transfers', 'percent', true, '{value}%'),
  ('broker_fee_client', 'Broker Fee (Client)', 'Fee charged directly to client', 'currency', true, '£{value}'),
  ('product_transfer_percent', 'Product Transfer %', 'Product transfers as % of total business', 'percent', false, '{value}%'),
  
  -- Insurance Broker
  ('gwp_per_employee', 'GWP per Employee', 'Gross Written Premium handled per employee', 'currency', true, '£{value}'),
  ('commission_rate', 'Commission Rate', 'Commission as percentage of premium', 'percent', true, '{value}%'),
  ('organic_growth', 'Organic Growth', 'Year-on-year organic revenue growth', 'percent', true, '{value}%'),
  
  -- Fintech
  ('deal_size_seed_a', 'Deal Size (Seed/A)', 'Average Seed or Series A funding round', 'currency', true, '£{value}'),
  ('take_rate', 'Take Rate', 'Fee as percentage of transaction value', 'percent', true, '{value}%'),
  ('runway_months', 'Cash Runway', 'Months of cash remaining at current burn', 'number', true, '{value} months'),
  ('valuation_multiple', 'Valuation Multiple', 'Business value as multiple of revenue', 'ratio', true, '{value}x')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. IFAs / FINANCIAL ADVISERS (IFA)
-- Source: NextWealth Benchmarks 2024, FTAdviser Top 100, FCA Financial Lives
-- Reliability: Tier 2 | Sample: 5,805 Authorised Firms
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Recurring Revenue % (the "Holy Grail" metric, >90% is acquirer target)
  ('IFA', 'recurring_revenue_percent', 'all', 'all', 75, 85, 95, 5805, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'high', '2024-03-01', true),
  
  -- Total Client Cost (all-in: Advice + Platform + Fund)
  ('IFA', 'total_client_cost_percent', 'all', 'all', 1.60, 1.89, 2.20, 5805, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'high', '2024-03-01', true),
  
  -- Ongoing Advice Fee (under pressure, 0.50% becoming standard for >£500k)
  ('IFA', 'ongoing_advice_fee', 'all', 'all', 0.50, 0.75, 1.00, 5805, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'high', '2024-03-01', true),
  
  -- Revenue per Adviser (solo practices can hit £400k+)
  ('IFA', 'revenue_per_adviser', 'all', 'all', 180000, 250000, 350000, 5805, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'high', '2024-03-01', true),
  
  -- Clients per Adviser (FCA concern grows >150)
  ('IFA', 'clients_per_adviser', 'all', 'all', 80, 110, 150, 5805, 2024, 'FCA Financial Lives', 'https://www.fca.org.uk', 'high', '2024-03-01', true),
  
  -- Assets per Client ("mass affluent" threshold rising to £250k+)
  ('IFA', 'assets_per_client', 'all', 'all', 150000, 280000, 500000, 5805, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'high', '2024-03-01', true),
  
  -- Exit Valuation (multiple of recurring revenue)
  ('IFA', 'exit_valuation_multiple', 'all', 'all', 2.5, 3.2, 4.0, NULL, 2024, 'FTAdviser Top 100', NULL, 'high', '2024-03-01', true),
  
  -- Client Retention
  ('IFA', 'client_retention', 'all', 'all', 90, 95, 98, NULL, 2024, 'NextWealth Benchmarks 2024', 'https://www.nextwealth.co.uk', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('IFA', 'employee_turnover', 'all', 'all', 8, 12, 18, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. MORTGAGE BROKERS (MORTGAGE)
-- Source: AMI / IMLA Market Data, Mortgage Advice Bureau 2023/24, Boon Brokers
-- Reliability: Tier 2 | Sample: ~16,000 Brokers
-- NOTE: Product Transfers = 83% of business, decimating broker income
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Completions per Year (top producers = 100+)
  ('MORTGAGE', 'completions_per_year', 'all', 'all', 40, 65, 90, 16000, 2024, 'AMI / IMLA Market Data', 'https://www.a-m-i.org.uk', 'high', '2024-03-01', true),
  
  -- Proc Fee - Purchase (fees stagnated despite workload increase)
  ('MORTGAGE', 'proc_fee_purchase', 'all', 'all', 0.35, 0.40, 0.45, 16000, 2024, 'AMI / IMLA Market Data', 'https://www.a-m-i.org.uk', 'high', '2024-03-01', true),
  
  -- Proc Fee - Transfer (37% less revenue for same work)
  ('MORTGAGE', 'proc_fee_transfer', 'all', 'all', 0.20, 0.25, 0.35, 16000, 2024, 'AMI / IMLA Market Data', 'https://www.a-m-i.org.uk', 'high', '2024-03-01', true),
  
  -- Broker Fee to Client
  ('MORTGAGE', 'broker_fee_client', 'all', 'all', 200, 500, 995, 16000, 2024, 'Boon Brokers Survey', NULL, 'medium', '2024-03-01', true),
  
  -- Product Transfer % (MAB reported 75% increase in PT volume)
  ('MORTGAGE', 'product_transfer_percent', 'all', 'all', 40, 53, 75, 16000, 2024, 'Mortgage Advice Bureau 2024', NULL, 'high', '2024-03-01', true),
  
  -- Conversion Rate (lower in 2024 due to affordability declines)
  ('MORTGAGE', 'conversion_rate', 'all', 'all', 30, 45, 60, 16000, 2024, 'AMI / IMLA Market Data', 'https://www.a-m-i.org.uk', 'high', '2024-03-01', true),
  
  -- Client Retention
  ('MORTGAGE', 'client_retention', 'all', 'all', 60, 72, 85, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('MORTGAGE', 'employee_turnover', 'all', 'all', 12, 18, 28, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. INSURANCE BROKERS (INSURANCE)
-- Source: Insurance Insider 2024, IDEX Consulting
-- Reliability: Tier 2 | Sample: UK Insurance Market
-- NOTE: Highly profitable sector - 25% EBITDA median, 30%+ for consolidators
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- GWP per Employee (Gross Written Premium handled per head)
  ('INSURANCE', 'gwp_per_employee', 'all', 'all', 350000, 500000, 750000, NULL, 2024, 'Insurance Insider 2024', NULL, 'high', '2024-03-01', true),
  
  -- Commission Rate (Commercial ~20%, Personal ~10-15%)
  ('INSURANCE', 'commission_rate', 'all', 'all', 12, 17.5, 25, NULL, 2024, 'Insurance Insider 2024', NULL, 'high', '2024-03-01', true),
  
  -- Retention Rate (high retention critical for valuation)
  ('INSURANCE', 'client_retention', 'all', 'all', 80, 88, 95, NULL, 2024, 'Insurance Insider 2024', NULL, 'high', '2024-03-01', true),
  
  -- EBITDA Margin (30%+ common for consolidators)
  ('INSURANCE', 'ebitda_margin', 'all', 'all', 18, 25, 35, NULL, 2024, 'IDEX Consulting', NULL, 'high', '2024-03-01', true),
  
  -- Employee Turnover (talent war for account execs)
  ('INSURANCE', 'employee_turnover', 'all', 'all', 10, 15, 20, NULL, 2024, 'IDEX Consulting', NULL, 'medium', '2024-03-01', true),
  
  -- Organic Growth (soft market rate rises inflated GWP)
  ('INSURANCE', 'organic_growth', 'all', 'all', 3, 6, 10, NULL, 2024, 'Insurance Insider 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days
  ('INSURANCE', 'debtor_days', 'all', 'all', 25, 35, 50, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. FINTECH / PAYMENT SERVICES (FINTECH)
-- Source: Innovate Finance H1 2024, Augmentum VC
-- Reliability: Tier 2 | Sample: UK Fintech Ecosystem
-- NOTE: "Growth at all costs" era is OVER - profitability is new north star
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Deal Size - Seed/Series A (early stage healthy, late stage dried up)
  ('FINTECH', 'deal_size_seed_a', 'all', 'all', 2000000, 4000000, 8000000, NULL, 2024, 'Innovate Finance H1 2024', 'https://www.innovatefinance.com', 'high', '2024-03-01', true),
  
  -- CAC Payback (focus shifted to unit economics)
  ('FINTECH', 'cac_payback_months', 'all', 'all', 18, 12, 6, NULL, 2024, 'Augmentum VC', NULL, 'medium', '2024-03-01', true),
  
  -- Revenue Growth (slower than 2021/22 when it was 100%+)
  ('FINTECH', 'revenue_growth', 'all', 'all', 20, 40, 80, NULL, 2024, 'Innovate Finance H1 2024', 'https://www.innovatefinance.com', 'medium', '2024-03-01', true),
  
  -- Take Rate - Payments (dependent on value-add like FX, Credit)
  ('FINTECH', 'take_rate', 'all', 'all', 0.5, 1.2, 2.5, NULL, 2024, 'Innovate Finance H1 2024', 'https://www.innovatefinance.com', 'medium', '2024-03-01', true),
  
  -- Cash Runway (critical as funding rounds take 6-9 months)
  ('FINTECH', 'runway_months', 'all', 'all', 6, 12, 18, NULL, 2024, 'Augmentum VC', NULL, 'medium', '2024-03-01', true),
  
  -- Valuation Multiple (revenue multiple, down from 20x+ in 2021)
  ('FINTECH', 'valuation_multiple', 'all', 'all', 4, 7, 12, NULL, 2024, 'Innovate Finance H1 2024', 'https://www.innovatefinance.com', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('FINTECH', 'employee_turnover', 'all', 'all', 12, 18, 28, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Mortgage Product Transfer Impact',
  'research',
  ARRAY['MORTGAGE'],
  ARRAY['proc_fee_transfer', 'product_transfer_percent'],
  'urgent',
  'pending',
  'CRITICAL BUSINESS MODEL SHIFT: Product Transfers now 83% of deals. Proc fee gap (0.40% vs 0.25%) means 37% less revenue for same work volume. Monitor for broker consolidation/exit and fee model changes.',
  '2025-03-01'
),
(
  'IFA Fee Pressure Monitoring',
  'research',
  ARRAY['IFA'],
  ARRAY['ongoing_advice_fee', 'total_client_cost_percent'],
  'medium',
  'pending',
  'FCA Ongoing Advice Review creating fee pressure. 0.50% becoming standard for >£500k portfolios (down from 0.75%). Total client cost rose to 1.89%. Consolidation continues (5,805 firms vs 6,240 in 2022).',
  '2025-06-01'
),
(
  'Fintech Valuation Reset',
  'research',
  ARRAY['FINTECH'],
  ARRAY['valuation_multiple', 'revenue_growth'],
  'medium',
  'pending',
  'Valuation multiples reset from 20x+ (2021) to 6-8x (2024). Late-stage funding dried up. Growth slowed from 100%+ to 40%. "Growth at all costs" era definitively over. Monitor for continued normalisation.',
  '2025-06-01'
);


