-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 8: WHOLESALE & LOGISTICS
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5, 6 and 7 have been applied

-- SECTOR CONTEXT NOTE:
-- "Profit squeeze": Turnover +3.5% but operating costs +10% (exc. fuel)
-- Net margins down to wafer-thin 1.5-2.1%
-- Wholesale: Digital ordering now 58% of volume
-- Haulage: Empty running stuck at 30% - massive efficiency drag
-- Freight: Air volumes +5.5% but yields collapsed -1.1%

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('WHOLESALE', 'Wholesale Distribution', 'wholesale', 'Wholesale distribution, trade suppliers and cash & carry', ARRAY['46110', '46900'], ARRAY['wholesale', 'distributor', 'trade supplier'], true),
  ('LOGISTICS', 'Logistics & Haulage', 'wholesale', 'Logistics, haulage, transport, courier and freight services', ARRAY['49410', '49420', '52100', '52210', '52290'], ARRAY['logistics', 'haulage', 'transport', 'courier', 'freight'], true),
  ('IMPORT_EXPORT', 'Import/Export Trading', 'wholesale', 'Import/export trading, international trade and freight forwarding', ARRAY['46900'], ARRAY['import', 'export', 'trading', 'international trade'], true)
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
  -- Wholesale
  ('delivery_cost_percent', 'Delivery Cost %', 'Last-mile delivery as percentage of revenue', 'percent', false, '{value}%'),
  ('digital_ordering_percent', 'Digital Ordering %', 'Orders via app/web as percentage of total', 'percent', true, '{value}%'),
  ('drop_size_minimum', 'Drop Size Minimum', 'Minimum order value for delivery', 'currency', true, '£{value}'),
  ('creditor_days', 'Creditor Days', 'Average days to pay suppliers', 'days', true, '{value} days'),
  
  -- Haulage
  ('empty_running_percent', 'Empty Running %', 'Percentage of miles driven with no load', 'percent', false, '{value}%'),
  ('cost_per_mile', 'Cost per Mile', 'Operating cost per mile (44t artic)', 'currency', false, '£{value}'),
  ('revenue_per_vehicle', 'Revenue per Vehicle', 'Annual revenue per vehicle', 'currency', true, '£{value}'),
  ('driver_salary', 'Driver Salary', 'Average HGV driver annual salary', 'currency', true, '£{value}'),
  ('roce', 'Return on Capital Employed', 'Profit as percentage of capital employed', 'percent', true, '{value}%'),
  ('operating_margin', 'Operating Margin', 'Operating profit as percentage of revenue', 'percent', true, '{value}%'),
  
  -- Freight
  ('ebit_margin', 'EBIT Margin', 'Earnings before interest and tax as % of revenue', 'percent', true, '{value}%'),
  ('air_freight_yield_change', 'Air Freight Yield Change', 'Year-on-year change in air freight yields', 'percent', true, '{value}%'),
  ('revenue_per_shipment', 'Revenue per Shipment', 'Average revenue per shipment', 'currency', true, '£{value}'),
  ('customs_entries_per_fte', 'Customs Entries per FTE', 'Customs entries processed per employee', 'number', true, '{value}'),
  ('dwell_time_days', 'Dwell Time', 'Average days cargo spends at port', 'days', false, '{value} days')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. WHOLESALE DISTRIBUTION (WHOLESALE)
-- Source: FWD Going for Growth 2024, IBISWorld, ACS Local Shop Report
-- Reliability: Tier 2 | Sample: Major Cash & Carry / Delivered Wholesalers
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (volume-driven, delivered slightly higher than C&C)
  ('WHOLESALE', 'gross_margin', 'all', 'all', 8, 13, 18, NULL, 2024, 'FWD Going for Growth 2024', 'https://www.fwd.co.uk', 'high', '2024-03-01', true),
  
  -- Net Profit Margin ("wafer thin" is standard)
  ('WHOLESALE', 'net_margin', 'all', 'all', 0.5, 1.5, 2.5, NULL, 2024, 'FWD Going for Growth 2024', 'https://www.fwd.co.uk', 'high', '2024-03-01', true),
  
  -- Stock Turn (high turnover essential, fresh food often 50x+)
  ('WHOLESALE', 'stock_turn', 'all', 'all', 12, 16, 24, NULL, 2024, 'IBISWorld Grocery Wholesaling 2025', 'https://www.ibisworld.com', 'high', '2024-03-01', true),
  
  -- Delivery Cost % (last-mile costs rose >10% for 39% of firms)
  ('WHOLESALE', 'delivery_cost_percent', 'all', 'all', 3, 6.5, 12, NULL, 2024, 'FWD Going for Growth 2024', 'https://www.fwd.co.uk', 'high', '2024-03-01', true),
  
  -- Digital Ordering % (now dominant channel)
  ('WHOLESALE', 'digital_ordering_percent', 'all', 'all', 40, 58, 75, NULL, 2024, 'FWD Going for Growth 2024', 'https://www.fwd.co.uk', 'high', '2024-03-01', true),
  
  -- Drop Size Minimum (rising to combat fuel costs)
  ('WHOLESALE', 'drop_size_minimum', 'all', 'all', 500, 1000, 2000, NULL, 2024, 'ACS Local Shop Report', 'https://www.acs.org.uk', 'medium', '2024-03-01', true),
  
  -- Creditor Days (wholesalers hold cash longer than stock turns)
  ('WHOLESALE', 'creditor_days', 'all', 'all', 30, 45, 60, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days
  ('WHOLESALE', 'debtor_days', 'all', 'all', 20, 30, 45, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. LOGISTICS / HAULAGE (LOGISTICS)
-- Source: RHA Cost Movement Survey 2024, Motor Transport Top 100, DfT Statistics
-- Reliability: Tier 2 | Sample: Top 100 Hauliers + RHA Membership
-- NOTE: Empty running 30% = 5.8bn km driven empty in 2024
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Operating Margin (down from 3.3% in 2023)
  ('LOGISTICS', 'operating_margin', 'all', 'all', 0.5, 2.1, 4.0, NULL, 2024, 'RHA Cost Movement Survey 2024', 'https://www.rha.uk.net', 'high', '2024-03-01', true),
  
  -- Empty Running % (5.8bn km driven empty - 30% of total)
  ('LOGISTICS', 'empty_running_percent', 'all', 'all', 20, 30, 40, NULL, 2024, 'DfT Statistics', 'https://www.gov.uk/dft', 'high', '2024-03-01', true),
  
  -- Cost per Mile (44t artic - operating cost exc. fuel rose 9.2%)
  ('LOGISTICS', 'cost_per_mile', 'all', 'all', 1.80, 2.20, 2.80, NULL, 2024, 'RHA Cost Movement Survey 2024', 'https://www.rha.uk.net', 'high', '2024-03-01', true),
  
  -- Revenue per Vehicle
  ('LOGISTICS', 'revenue_per_vehicle', 'all', 'all', 120000, 155000, 185000, NULL, 2024, 'Motor Transport Top 100', NULL, 'high', '2024-03-01', true),
  
  -- Driver Salary (stabilised in 2024 after 2022 spikes)
  ('LOGISTICS', 'driver_salary', 'all', 'all', 32000, 42000, 50000, NULL, 2024, 'RHA Cost Movement Survey 2024', 'https://www.rha.uk.net', 'high', '2024-03-01', true),
  
  -- Return on Capital Employed (dropped from 7.4%)
  ('LOGISTICS', 'roce', 'all', 'all', 2, 4.8, 8, NULL, 2024, 'Motor Transport Top 100', NULL, 'high', '2024-03-01', true),
  
  -- Debtor Days
  ('LOGISTICS', 'debtor_days', 'all', 'all', 30, 45, 60, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover (driver retention challenge)
  ('LOGISTICS', 'employee_turnover', 'all', 'all', 15, 22, 35, NULL, 2024, 'RHA', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. IMPORT/EXPORT / FREIGHT FORWARDING (IMPORT_EXPORT)
-- Source: Transport Intelligence 2024, Kuehne+Nagel, BIFA
-- Reliability: Tier 2 | Sample: Global Freight Forwarders (UK Operations)
-- NOTE: Air yields collapsed -1.1% despite volume +5.5%
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Profit Margin ("Net Revenue" = Rev - Carrier Cost)
  ('IMPORT_EXPORT', 'gross_margin', 'all', 'all', 12, 16.5, 22, NULL, 2024, 'Transport Intelligence 2024', NULL, 'high', '2024-03-01', true),
  
  -- EBIT Margin (declining as rates "normalise" post-pandemic)
  ('IMPORT_EXPORT', 'ebit_margin', 'all', 'all', 3, 6.5, 9, NULL, 2024, 'Kuehne+Nagel 2024 Results', NULL, 'high', '2024-03-01', true),
  
  -- Air Freight Yield Change (collapsed in 2024)
  ('IMPORT_EXPORT', 'air_freight_yield_change', 'all', 'all', -3, -1.1, 0.5, NULL, 2024, 'Transport Intelligence 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Revenue per Shipment (highly variable mix)
  ('IMPORT_EXPORT', 'revenue_per_shipment', 'all', 'all', 250, 600, 1500, NULL, 2024, 'BIFA', 'https://www.bifa.org', 'medium', '2024-03-01', true),
  
  -- Customs Entries per FTE (productivity metric)
  ('IMPORT_EXPORT', 'customs_entries_per_fte', 'all', 'all', 2000, 3500, 5000, NULL, 2024, 'BIFA', 'https://www.bifa.org', 'medium', '2024-03-01', true),
  
  -- Dwell Time at Port (sea - UK ports stabilised in 2024)
  ('IMPORT_EXPORT', 'dwell_time_days', 'all', 'all', 3, 6, 10, NULL, 2024, 'Transport Intelligence 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (trade finance dependent)
  ('IMPORT_EXPORT', 'debtor_days', 'all', 'all', 35, 50, 70, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Haulage Empty Running Benchmark',
  'research',
  ARRAY['LOGISTICS'],
  ARRAY['empty_running_percent'],
  'medium',
  'pending',
  'The 30% empty running statistic is THE key inefficiency in UK logistics. 5.8bn km driven empty in 2024. Getting to <15% via backhaul networks is often the difference between profit and loss. Consider creating "efficiency tier" segmentation: <15%, 15-25%, 25-35%, >35%.',
  '2025-06-01'
),
(
  'Logistics Margin Squeeze Monitoring',
  'research',
  ARRAY['LOGISTICS', 'WHOLESALE', 'IMPORT_EXPORT'],
  ARRAY['operating_margin', 'net_margin'],
  'medium',
  'pending',
  'Sector-wide "profit squeeze": Turnover +3.5% but operating costs +10%. Haulage margins down to 2.1% from 3.3%. ROCE dropped from 7.4% to 4.8%. Monitor for continued deterioration.',
  '2025-06-01'
);

