-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 4: CONSTRUCTION & PROPERTY
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2 and 3 have been applied

-- SECTOR CONTEXT NOTE:
-- "Profitless boom" in 2024 - turnover stable but main contractor margins razor-thin (~2%)
-- Supply chain insolvencies (ISG) and Building Safety Act delays
-- Specialist contractors & trades saw record rate increases
-- Estate agent fees stable at 1.4-1.5%, 31% fall-through rate
-- Lettings: severe supply shortage, void periods down, yields up

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('CONST_MAIN', 'Main Contractor / Builder', 'construction_property', 'Main contractors, builders and general construction firms', ARRAY['41201', '41202'], ARRAY['builder', 'contractor', 'construction', 'building'], true),
  ('CONST_SPEC', 'Specialist Contractor', 'construction_property', 'Electrical, plumbing, HVAC, roofing, flooring and specialist contractors', ARRAY['43210', '43220', '43290', '43310', '43320', '43341', '43390'], ARRAY['electrical', 'plumbing', 'HVAC', 'roofing', 'flooring', 'specialist'], true),
  ('ESTATE', 'Estate Agency', 'construction_property', 'Estate agents, property sales and lettings agents', ARRAY['68310'], ARRAY['estate agent', 'property sales', 'lettings', 'real estate'], true),
  ('PROP_MGMT', 'Property Management', 'construction_property', 'Property management, lettings and block management', ARRAY['68320'], ARRAY['property management', 'lettings', 'block management', 'landlord'], true),
  ('TRADES', 'Trade Services (Plumber, Electrician, etc.)', 'construction_property', 'Plumbers, electricians, gas engineers, heating engineers and tradespeople', ARRAY['43210', '43220'], ARRAY['plumber', 'electrician', 'tradesman', 'gas engineer', 'heating'], true)
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
  -- Main Contractor
  ('liquidity_ratio', 'Liquidity Ratio', 'Current assets / current liabilities', 'ratio', true, '{value}x'),
  ('subcontractor_ratio', 'Subcontractor Ratio', 'Percentage of work outsourced', 'percent', false, '{value}%'),
  
  -- Specialist Contractor
  ('productivity_hourly', 'Productivity (Hourly)', 'Revenue generated per labour hour', 'currency', true, '£{value}/hr'),
  ('retention_held', 'Retention Held', 'Cash retention percentage by main contractor', 'percent', false, '{value}%'),
  ('order_book_months', 'Order Book', 'Months of secured work pipeline', 'number', true, '{value} months'),
  
  -- Estate Agent
  ('sales_commission_percent', 'Sales Commission %', 'Commission as percentage of sale price', 'percent', true, '{value}%'),
  ('revenue_per_branch', 'Revenue per Branch', 'Annual revenue per office/branch', 'currency', true, '£{value}'),
  ('listings_to_sales', 'Listings to Sales', 'Sell-through rate (SSTC as % of listings)', 'percent', true, '{value}%'),
  ('fall_through_rate', 'Fall-Through Rate', 'Percentage of sales that fail before completion', 'percent', false, '{value}%'),
  ('time_to_sell_days', 'Time to Sell', 'Average days from listing to SSTC', 'days', false, '{value} days'),
  ('local_market_share', 'Local Market Share', 'Share of local property transactions', 'percent', true, '{value}%'),
  
  -- Property Management
  ('management_fee_percent', 'Management Fee %', 'Monthly management fee as % of rent', 'percent', true, '{value}%'),
  ('tenant_find_fee', 'Tenant Find Fee', 'Fee for finding new tenant (% annual rent or £)', 'percent', true, '{value}%'),
  ('void_period_days', 'Void Period', 'Average days between tenancies', 'days', false, '{value} days'),
  ('rent_arrears_rate', 'Rent Arrears Rate', 'Percentage of rent in arrears', 'percent', false, '{value}%'),
  ('tenant_retention', 'Tenant Retention', 'Percentage of tenants renewing', 'percent', true, '{value}%'),
  ('portfolio_per_manager', 'Portfolio per Manager', 'Units managed per property manager', 'number', true, '{value}'),
  
  -- Trades
  ('daily_rate', 'Daily Rate', 'Day rate for tradesperson', 'currency', true, '£{value}/day'),
  ('hourly_rate', 'Hourly Rate', 'Hourly rate for tradesperson', 'currency', true, '£{value}/hr'),
  ('jobs_per_day', 'Jobs per Day', 'Average number of jobs completed daily', 'number', true, '{value}'),
  ('avg_job_value', 'Average Job Value', 'Average revenue per job', 'currency', true, '£{value}'),
  ('callback_rate', 'Callback Rate', 'Percentage of jobs requiring return visit', 'percent', false, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. MAIN CONTRACTORS / BUILDERS (CONST_MAIN)
-- Source: Build UK / Construction Index Top 100 2024, Opus Business Advisory
-- Reliability: Tier 2 | Sample: Top 100 UK Contractors (£76.5bn aggregate turnover)
-- WARNING: 43% of Top 100 firms had margins <2%
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (project level before overheads)
  ('CONST_MAIN', 'gross_margin', 'all', 'all', 5.0, 7.5, 10.0, 100, 2024, 'Build UK / Construction Index Top 100 2024', 'https://www.theconstructionindex.co.uk', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (43% of Top 100 had <2%)
  ('CONST_MAIN', 'net_margin', 'all', 'all', 0.5, 2.4, 4.0, 100, 2024, 'Build UK / Construction Index Top 100 2024', 'https://www.theconstructionindex.co.uk', 'high', '2024-03-01', true),
  
  -- Operating Margin
  ('CONST_MAIN', 'operating_margin', 'all', 'all', 1.0, 2.5, 5.0, 100, 2024, 'Build UK / Construction Index Top 100 2024', 'https://www.theconstructionindex.co.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days (statutory 30 days but "pay when paid" persists)
  ('CONST_MAIN', 'debtor_days', 'all', 'all', 35, 45, 60, 100, 2024, 'Build UK / Construction Index Top 100 2024', 'https://www.theconstructionindex.co.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('CONST_MAIN', 'employee_turnover', 'all', 'all', 15, 22, 30, 100, 2024, 'Opus Business Advisory', NULL, 'medium', '2024-03-01', true),
  
  -- Liquidity Ratio (<1.0 = high insolvency risk)
  ('CONST_MAIN', 'liquidity_ratio', 'all', 'all', 0.8, 1.1, 1.4, 100, 2024, 'Opus Business Advisory', NULL, 'high', '2024-03-01', true),
  
  -- Subcontractor Ratio (% of work outsourced)
  ('CONST_MAIN', 'subcontractor_ratio', 'all', 'all', 60, 75, 90, 100, 2024, 'Build UK / Construction Index Top 100 2024', 'https://www.theconstructionindex.co.uk', 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SPECIALIST CONTRACTORS - M&E (CONST_SPEC)
-- Source: BESA Top 30 M&E Report 2024, ECA Benchmarking
-- Reliability: Tier 2 | Sample: 30-50 Major M&E Firms + SME survey
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (M&E benchmarks)
  ('CONST_SPEC', 'gross_margin', 'all', 'all', 15, 22.5, 30, 50, 2024, 'BESA Top 30 M&E Report 2024', 'https://www.thebesa.com', 'high', '2024-03-01', true),
  
  -- Net Profit Margin
  ('CONST_SPEC', 'net_margin', 'all', 'all', 2.0, 3.5, 8.0, 50, 2024, 'ECA Benchmarking', 'https://www.eca.co.uk', 'high', '2024-03-01', true),
  
  -- Revenue per Employee
  ('CONST_SPEC', 'revenue_per_employee', 'all', 'all', 120000, 180000, 250000, 50, 2024, 'BESA Top 30 M&E Report 2024', 'https://www.thebesa.com', 'high', '2024-03-01', true),
  
  -- Productivity (revenue per labour hour)
  ('CONST_SPEC', 'productivity_hourly', 'all', 'all', 45, 55, 65, 50, 2024, 'ECA Benchmarking', 'https://www.eca.co.uk', 'medium', '2024-03-01', true),
  
  -- Retention Held (cash held by main contractor)
  ('CONST_SPEC', 'retention_held', 'all', 'all', 3, 5, 5, 50, 2024, 'BESA Top 30 M&E Report 2024', 'https://www.thebesa.com', 'high', '2024-03-01', true),
  
  -- Order Book (>9 months = "good" visibility)
  ('CONST_SPEC', 'order_book_months', 'all', 'all', 3, 7.5, 12, 50, 2024, 'BESA Top 30 M&E Report 2024', 'https://www.thebesa.com', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ESTATE AGENTS (ESTATE)
-- Source: Propertymark Housing Insight 2024, Rightmove HPI, GetAgent
-- Reliability: Tier 2 | Sample: ~13,000 Branches
-- NOTE: 31% fall-through rate = 1/3 of work generates £0 revenue
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Sales Commission (% of sale price, excl VAT)
  ('ESTATE', 'sales_commission_percent', 'all', 'all', 1.1, 1.43, 1.7, 13000, 2024, 'Propertymark Housing Insight 2024', 'https://www.propertymark.co.uk', 'high', '2024-03-01', true),
  
  -- Revenue per Branch
  ('ESTATE', 'revenue_per_branch', 'all', 'all', 250000, 380000, 600000, 13000, 2024, 'Propertymark Housing Insight 2024', 'https://www.propertymark.co.uk', 'high', '2024-03-01', true),
  
  -- Listings to Sales (sell-through rate)
  ('ESTATE', 'listings_to_sales', 'all', 'all', 15, 25, 35, 13000, 2024, 'Rightmove HPI', 'https://www.rightmove.co.uk', 'high', '2024-03-01', true),
  
  -- Fall-Through Rate (~1 in 3 sales fail)
  ('ESTATE', 'fall_through_rate', 'all', 'all', 20, 31.3, 35, 13000, 2024, 'Propertymark Housing Insight 2024', 'https://www.propertymark.co.uk', 'high', '2024-03-01', true),
  
  -- Time to Sell (days) - "priced right" = 32 days, overpriced = 112+
  ('ESTATE', 'time_to_sell_days', 'all', 'all', 32, 65, 112, 13000, 2024, 'Rightmove HPI', 'https://www.rightmove.co.uk', 'high', '2024-03-01', true),
  
  -- Local Market Share (highly fragmented)
  ('ESTATE', 'local_market_share', 'all', 'all', 2, 8, 15, 13000, 2024, 'GetAgent', 'https://www.getagent.co.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (typically completion funds are immediate)
  ('ESTATE', 'debtor_days', 'all', 'all', 0, 7, 14, NULL, 2024, 'Industry standard', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. PROPERTY MANAGEMENT / LETTINGS (PROP_MGMT)
-- Source: ARLA Propertymark, Landlord Studio, Reposit
-- Reliability: Tier 3 | Sample: UK Private Rented Sector
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Management Fee (% of monthly rent + VAT)
  ('PROP_MGMT', 'management_fee_percent', 'all', 'all', 10, 12, 15, NULL, 2024, 'ARLA Propertymark', 'https://www.propertymark.co.uk', 'high', '2024-03-01', true),
  
  -- Tenant Find Fee (often 1 month rent = ~8-10% annual)
  ('PROP_MGMT', 'tenant_find_fee', 'all', 'all', 500, 8.33, 10, NULL, 2024, 'ARLA Propertymark', 'https://www.propertymark.co.uk', 'medium', '2024-03-01', true),
  
  -- Void Period (days between tenancies)
  ('PROP_MGMT', 'void_period_days', 'all', 'all', 10, 18, 25, NULL, 2024, 'Landlord Studio', NULL, 'medium', '2024-03-01', true),
  
  -- Rent Arrears Rate (claims jumped 22% in 2024)
  ('PROP_MGMT', 'rent_arrears_rate', 'all', 'all', 2, 2.5, 5, NULL, 2024, 'Reposit', 'https://www.reposit.co.uk', 'medium', '2024-03-01', true),
  
  -- Tenant Retention (avg tenancy = 20-24 months)
  ('PROP_MGMT', 'tenant_retention', 'all', 'all', 40, 55, 70, NULL, 2024, 'ARLA Propertymark', 'https://www.propertymark.co.uk', 'medium', '2024-03-01', true),
  
  -- Portfolio per Manager (units per property manager)
  ('PROP_MGMT', 'portfolio_per_manager', 'all', 'all', 80, 120, 150, NULL, 2024, 'ARLA Propertymark', 'https://www.propertymark.co.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (rent is typically paid in advance)
  ('PROP_MGMT', 'debtor_days', 'all', 'all', 0, 5, 14, NULL, 2024, 'Industry standard', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TRADES - Plumbers, Electricians (TRADES)
-- Source: Checkatrade Cost Guide 2025, ONS Earnings
-- Reliability: Tier 3 | Sample: ~50,000+ Tradespeople
-- NOTE: Record daily rates in 2024, particularly electrical
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Daily Rate (sole trader)
  ('TRADES', 'daily_rate', 'all', 'all', 250, 350, 500, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'high', '2024-03-01', true),
  
  -- Hourly Rate
  ('TRADES', 'hourly_rate', 'all', 'all', 40, 55, 80, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'high', '2024-03-01', true),
  
  -- Gross Margin (high due to low COGS - labour intensive)
  ('TRADES', 'gross_margin', 'all', 'all', 30, 45, 60, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'medium', '2024-03-01', true),
  
  -- Net Profit Margin (sole trader take-home after costs)
  ('TRADES', 'net_margin', 'all', 'all', 15, 25, 35, 50000, 2024, 'ONS Earnings / Checkatrade', NULL, 'medium', '2024-03-01', true),
  
  -- Jobs per Day
  ('TRADES', 'jobs_per_day', 'all', 'all', 1, 2.5, 4, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'medium', '2024-03-01', true),
  
  -- Average Job Value
  ('TRADES', 'avg_job_value', 'all', 'all', 150, 350, 2500, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'medium', '2024-03-01', true),
  
  -- Callback Rate (first-time fix is key quality metric)
  ('TRADES', 'callback_rate', 'all', 'all', 1, 3, 5, 50000, 2024, 'Checkatrade Cost Guide 2025', 'https://www.checkatrade.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (typically COD or card payment)
  ('TRADES', 'debtor_days', 'all', 'all', 0, 2, 7, NULL, 2024, 'Industry standard (COD)', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Main Contractor Margin Crisis',
  'research',
  ARRAY['CONST_MAIN'],
  ARRAY['net_margin', 'liquidity_ratio'],
  'urgent',
  'pending',
  'CRITICAL: 43% of Top 100 contractors have margins <2%. "Profitless boom" conditions persist. ISG insolvency shows systemic risk. Monitor for further insolvencies and update benchmarks. Consider adding "insolvency risk" segment.',
  '2025-03-01'
),
(
  'Estate Agent Fall-Through Monitoring',
  'research',
  ARRAY['ESTATE'],
  ARRAY['fall_through_rate', 'time_to_sell_days'],
  'medium',
  'pending',
  '31% fall-through rate means 1 in 3 deals fail. This is a key inefficiency metric - monitor quarterly for changes. "No sale, no fee" model means 1/3 of agent work generates zero revenue.',
  '2025-06-01'
),
(
  'Lettings Arrears Rise',
  'research',
  ARRAY['PROP_MGMT'],
  ARRAY['rent_arrears_rate'],
  'medium',
  'pending',
  'Rent arrears claims jumped 22% in 2024. Monitor for continued deterioration. May need to update P75 threshold.',
  '2025-06-01'
);

