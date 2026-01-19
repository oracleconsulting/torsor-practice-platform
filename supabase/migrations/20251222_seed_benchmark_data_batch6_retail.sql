-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 6: RETAIL
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4 and 5 have been applied

-- SECTOR CONTEXT NOTE:
-- "Volume stagnation but value growth" - inflation-driven
-- Footfall remains ~10% below pre-pandemic levels
-- Online stabilised at 26-28%
-- SHRINKAGE CRISIS: £1.8bn+ losses, rate rising to 1.4-2.0%
-- Motor trade: Post-Covid margin boom normalised (used car GP £2k → £1,400)

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('RETAIL_GEN', 'General Retail', 'retail', 'General retail stores, high street shops and mixed retail', ARRAY['47190'], ARRAY['shop', 'retail', 'store', 'high street'], true),
  ('RETAIL_FOOD', 'Food Retail / Convenience', 'retail', 'Food retail, convenience stores, grocery and newsagents', ARRAY['47110', '47210', '47220', '47230', '47240', '47250', '47290'], ARRAY['convenience store', 'grocery', 'newsagent', 'off-licence'], true),
  ('RETAIL_SPEC', 'Specialist Retail', 'retail', 'Specialist and boutique retail stores, niche retail businesses', ARRAY['47410', '47510', '47530', '47540', '47590', '47710', '47720', '47750', '47770', '47780', '47790'], ARRAY['specialist', 'boutique', 'niche retail'], true),
  ('AUTO_RETAIL', 'Motor Trade / Dealership', 'retail', 'Car dealerships, motor trade, used cars and garages', ARRAY['45111', '45112', '45200', '45310', '45320', '45400'], ARRAY['car dealer', 'motor trade', 'garage', 'dealership', 'used cars'], true)
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
  -- General Retail
  ('sales_per_sqft', 'Sales per Sq Ft', 'Annual revenue per square foot of retail space', 'currency', true, '£{value}'),
  ('shrinkage_rate', 'Shrinkage Rate', 'Loss from theft, error, and waste as % of sales', 'percent', false, '{value}%'),
  ('online_sales_percent', 'Online Sales %', 'Online as percentage of total sales', 'percent', true, '{value}%'),
  ('return_rate_online', 'Return Rate (Online)', 'Percentage of online orders returned', 'percent', false, '{value}%'),
  ('stock_turn', 'Stock Turn', 'Number of times inventory sold per year', 'number', true, '{value}x'),
  
  -- Food Retail
  ('basket_size_items', 'Basket Size (Items)', 'Average items per transaction', 'number', true, '{value}'),
  ('sales_per_sqft_weekly', 'Sales per Sq Ft (Weekly)', 'Weekly revenue per square foot', 'currency', true, '£{value}'),
  ('food_to_go_percent', 'Food-to-Go %', 'Food-to-go as percentage of sales', 'percent', true, '{value}%'),
  ('delivery_revenue_percent', 'Delivery Revenue %', 'Delivery as percentage of revenue', 'percent', true, '{value}%'),
  
  -- Specialist Retail
  ('inventory_days', 'Inventory Days', 'Average days stock held before sale', 'days', false, '{value} days'),
  ('return_rate', 'Return Rate', 'Percentage of products returned', 'percent', false, '{value}%'),
  
  -- Motor Trade
  ('used_car_gp_per_unit', 'Used Car GP per Unit', 'Gross profit per used vehicle sold', 'currency', true, '£{value}'),
  ('used_stock_turn', 'Used Stock Turn', 'Used vehicle inventory turnover per year', 'number', true, '{value}x'),
  ('parts_margin', 'Parts Margin', 'Gross margin on parts sales', 'percent', true, '{value}%'),
  ('aftersales_absorption', 'Aftersales Absorption', 'Overheads covered by service/parts profit', 'percent', true, '{value}%'),
  ('finance_penetration', 'Finance Penetration', 'Percentage of sales with finance', 'percent', true, '{value}%'),
  ('sales_per_employee', 'Sales per Employee', 'Annual sales revenue per employee', 'currency', true, '£{value}')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. GENERAL RETAIL (RETAIL_GEN)
-- Source: BRC Retail Sales Monitor 2024, Centre for Retail Research, Knight Frank
-- Reliability: Tier 2 | Sample: Major UK High Street & Online Retailers
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Sales per Sq Ft
  ('RETAIL_GEN', 'sales_per_sqft', 'all', 'all', 174, 350, 650, NULL, 2024, 'Knight Frank Retail Report', 'https://www.knightfrank.co.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin
  ('RETAIL_GEN', 'gross_margin', 'all', 'all', 42, 50, 58, NULL, 2024, 'BRC Retail Sales Monitor 2024', 'https://www.brc.org.uk', 'high', '2024-03-01', true),
  
  -- Shrinkage Rate (CRISIS LEVEL - highest on record)
  ('RETAIL_GEN', 'shrinkage_rate', 'all', 'all', 0.8, 1.42, 2.5, NULL, 2024, 'Centre for Retail Research', 'https://www.retailresearch.org', 'high', '2024-03-01', true),
  
  -- Online % of Sales
  ('RETAIL_GEN', 'online_sales_percent', 'all', 'all', 15, 28, 40, NULL, 2024, 'BRC Retail Sales Monitor 2024', 'https://www.brc.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover (cost to replace = ~£30k)
  ('RETAIL_GEN', 'employee_turnover', 'all', 'all', 20, 25.2, 40, NULL, 2024, 'BRC Retail Sales Monitor 2024', 'https://www.brc.org.uk', 'high', '2024-03-01', true),
  
  -- Return Rate (Online)
  ('RETAIL_GEN', 'return_rate_online', 'all', 'all', 10, 16.9, 28, NULL, 2024, 'ZigZag Returns Report', NULL, 'high', '2024-03-01', true),
  
  -- Stock Turn
  ('RETAIL_GEN', 'stock_turn', 'all', 'all', 4.0, 8.5, 11.3, NULL, 2024, 'BRC Retail Sales Monitor 2024', 'https://www.brc.org.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days (typically immediate payment in retail)
  ('RETAIL_GEN', 'debtor_days', 'all', 'all', 0, 2, 7, NULL, 2024, 'Industry standard', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FOOD RETAIL / CONVENIENCE (RETAIL_FOOD)
-- Source: ACS Local Shop Report 2024, IGD, Lumina Intelligence
-- Reliability: Tier 2 | Sample: 48,000 Convenience Stores
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Basket Size (items per visit) - avg spend £8.04
  ('RETAIL_FOOD', 'basket_size_items', 'all', 'all', 2.1, 2.8, 3.5, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin (lower than general retail due to price sensitivity)
  ('RETAIL_FOOD', 'gross_margin', 'all', 'all', 20, 24.7, 30, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'high', '2024-03-01', true),
  
  -- Sales per Sq Ft (weekly)
  ('RETAIL_FOOD', 'sales_per_sqft_weekly', 'all', 'all', 15, 22, 30, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'high', '2024-03-01', true),
  
  -- Food-to-Go % (high margin category)
  ('RETAIL_FOOD', 'food_to_go_percent', 'all', 'all', 8, 15, 25, 48000, 2024, 'Lumina Intelligence', NULL, 'medium', '2024-03-01', true),
  
  -- Delivery Revenue %
  ('RETAIL_FOOD', 'delivery_revenue_percent', 'all', 'all', 2, 7, 15, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'medium', '2024-03-01', true),
  
  -- Shrinkage % (food/alcohol highly targeted)
  ('RETAIL_FOOD', 'shrinkage_rate', 'all', 'all', 1.0, 1.75, 3.0, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover (445,000 employees in sector)
  ('RETAIL_FOOD', 'employee_turnover', 'all', 'all', 15, 25, 35, 48000, 2024, 'ACS Local Shop Report 2024', 'https://www.acs.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (cash business)
  ('RETAIL_FOOD', 'debtor_days', 'all', 'all', 0, 1, 3, NULL, 2024, 'Industry standard', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. SPECIALIST RETAIL (RETAIL_SPEC)
-- Source: Unleashed Inventory Benchmarks 2024, IBISWorld, ZigZag Returns
-- Reliability: Tier 3 | Sample: Sector-specific datasets
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin
  ('RETAIL_SPEC', 'gross_margin', 'all', 'all', 35, 47.5, 65, NULL, 2024, 'IBISWorld', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Inventory Days (UK retail avg lead time 17.2 days)
  ('RETAIL_SPEC', 'inventory_days', 'all', 'all', 30, 54, 90, NULL, 2024, 'Unleashed Inventory Benchmarks 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Return Rate
  ('RETAIL_SPEC', 'return_rate', 'all', 'all', 4, 12, 30, NULL, 2024, 'ZigZag Returns Report', NULL, 'high', '2024-03-01', true),
  
  -- Debtor Days
  ('RETAIL_SPEC', 'debtor_days', 'all', 'all', 0, 3, 10, NULL, 2024, 'Industry standard', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. MOTOR TRADE / DEALERSHIPS (AUTO_RETAIL)
-- Source: ASE Automotive Global Benchmark 2024, NFDA Summer Survey 2024
-- Reliability: Tier 2 | Sample: Franchised Dealer Networks
-- NOTE: Post-Covid margin boom has normalised
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Return on Sales (Net Margin)
  ('AUTO_RETAIL', 'net_margin', 'all', 'all', 0.5, 1.24, 2.5, NULL, 2024, 'ASE Automotive Global Benchmark 2024', 'https://www.aseglobal.com', 'high', '2024-03-01', true),
  
  -- Used Car Gross Profit per Unit (normalised from £2k+ peaks)
  ('AUTO_RETAIL', 'used_car_gp_per_unit', 'all', 'all', 1100, 1437, 1800, NULL, 2024, 'NFDA Summer Survey 2024', 'https://www.nfda.co.uk', 'high', '2024-03-01', true),
  
  -- Used Stock Turn (target 8x = 45 days, current avg ~57 days)
  ('AUTO_RETAIL', 'used_stock_turn', 'all', 'all', 5.0, 6.38, 8.0, NULL, 2024, 'ASE Automotive Global Benchmark 2024', 'https://www.aseglobal.com', 'high', '2024-03-01', true),
  
  -- Parts Margin (consistent profit centre)
  ('AUTO_RETAIL', 'parts_margin', 'all', 'all', 18, 22, 25, NULL, 2024, 'ASE Automotive Global Benchmark 2024', 'https://www.aseglobal.com', 'high', '2024-03-01', true),
  
  -- Aftersales Absorption (% of overheads covered by Service/Parts)
  ('AUTO_RETAIL', 'aftersales_absorption', 'all', 'all', 45, 53.4, 80, NULL, 2024, 'ASE Automotive Global Benchmark 2024', 'https://www.aseglobal.com', 'high', '2024-03-01', true),
  
  -- Finance Penetration (critical for dealer profitability)
  ('AUTO_RETAIL', 'finance_penetration', 'all', 'all', 40, 65, 80, NULL, 2024, 'NFDA Summer Survey 2024', 'https://www.nfda.co.uk', 'high', '2024-03-01', true),
  
  -- Sales per Employee (high revenue, low margin model)
  ('AUTO_RETAIL', 'sales_per_employee', 'all', 'all', 500000, 750000, 1000000, NULL, 2024, 'ASE Automotive Global Benchmark 2024', 'https://www.aseglobal.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (mixed - retail immediate, fleet/business on terms)
  ('AUTO_RETAIL', 'debtor_days', 'all', 'all', 5, 15, 30, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('AUTO_RETAIL', 'employee_turnover', 'all', 'all', 15, 22, 30, NULL, 2024, 'NFDA Summer Survey 2024', 'https://www.nfda.co.uk', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Retail Shrinkage Crisis',
  'research',
  ARRAY['RETAIL_GEN', 'RETAIL_FOOD'],
  ARRAY['shrinkage_rate'],
  'urgent',
  'pending',
  'CRISIS: Shrinkage hit record levels (1.42% median, up to 2.5% P75). Total cost £5.5bn including error. Food/alcohol highly targeted for resale theft. Monitor for continued escalation and update benchmarks.',
  '2025-03-01'
),
(
  'Motor Trade Margin Normalisation',
  'research',
  ARRAY['AUTO_RETAIL'],
  ARRAY['used_car_gp_per_unit', 'net_margin'],
  'medium',
  'pending',
  'Post-Covid used car margin boom has normalised. GP per unit dropped from £2k+ to £1,437. Stock turn slowed (avg 57 days vs 45 day target). Any car >90 days typically loss-making due to depreciation.',
  '2025-06-01'
);


