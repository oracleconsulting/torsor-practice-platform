-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 3: HOSPITALITY
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1 and batch 2 have been applied

-- SECTOR CONTEXT NOTE:
-- Sharp divergence in 2024. Turnover up (price-driven, not volume) but margins
-- under "triple whammy" pressure: wage inflation (+9.8% NLW), energy, food costs.
-- Restaurants: Delivery = 27% of revenue but dilutes margins
-- Pubs: Wet-led struggling, Food-led resilient. Premiumisation is growth driver.
-- Hotels: Strongest performer - London occupancy >80%, direct bookings +30% value

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('RESTAURANT', 'Restaurant / Café', 'hospitality', 'Restaurants, cafes, dining and food service establishments', ARRAY['56101', '56102', '56103'], ARRAY['restaurant', 'cafe', 'dining', 'food service'], true),
  ('PUB', 'Pub / Bar', 'hospitality', 'Pubs, bars, inns and taverns', ARRAY['56301', '56302'], ARRAY['pub', 'bar', 'inn', 'tavern'], true),
  ('HOTEL', 'Hotel / B&B', 'hospitality', 'Hotels, B&Bs, accommodation and boutique hotels', ARRAY['55100', '55201', '55202'], ARRAY['hotel', 'B&B', 'accommodation', 'boutique hotel'], true),
  ('CATERING', 'Catering / Events', 'hospitality', 'Catering services, events, wedding and corporate catering', ARRAY['56210'], ARRAY['catering', 'events', 'wedding', 'corporate catering'], true)
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
  -- Restaurant
  ('revenue_per_cover', 'Revenue per Cover', 'Average spend per customer', 'currency', true, '£{value}'),
  ('food_cost_percent', 'Food Cost %', 'Food costs as percentage of revenue', 'percent', false, '{value}%'),
  ('labour_cost_percent', 'Labour Cost %', 'Labour costs as percentage of revenue', 'percent', false, '{value}%'),
  ('table_turn', 'Table Turn', 'Number of sittings per table per service', 'number', true, '{value}'),
  ('delivery_revenue_percent', 'Delivery Revenue %', 'Delivery as percentage of total revenue', 'percent', false, '{value}%'),
  
  -- Pub
  ('weekly_wet_turnover', 'Weekly Wet Turnover', 'Weekly drinks sales', 'currency', true, '£{value}'),
  ('gross_margin_wet', 'Gross Margin (Wet)', 'Gross margin on drinks sales', 'percent', true, '{value}%'),
  ('operating_margin', 'Operating Margin', 'Operating profit margin', 'percent', true, '{value}%'),
  ('gaming_revenue_weekly', 'Gaming Revenue (Weekly)', 'Weekly gaming machine income', 'currency', true, '£{value}'),
  ('wet_revenue_percent', 'Wet Revenue %', 'Drinks sales as percentage of total', 'percent', false, '{value}%'),
  
  -- Hotel
  ('occupancy_rate', 'Occupancy Rate', 'Percentage of rooms occupied', 'percent', true, '{value}%'),
  ('adr', 'Average Daily Rate', 'Average revenue per occupied room', 'currency', true, '£{value}'),
  ('revpar', 'RevPAR', 'Revenue per available room', 'currency', true, '£{value}'),
  ('gop_margin', 'GOP Margin', 'Gross operating profit margin', 'percent', true, '{value}%'),
  ('payroll_percent', 'Payroll %', 'Payroll as percentage of revenue', 'percent', false, '{value}%'),
  ('direct_booking_percent', 'Direct Booking %', 'Direct bookings as percentage of total', 'percent', true, '{value}%'),
  ('employee_turnover_monthly', 'Employee Turnover (Monthly)', 'Monthly staff attrition rate', 'percent', false, '{value}%'),
  
  -- Catering
  ('revenue_per_head', 'Revenue per Head', 'Revenue per person per event', 'currency', true, '£{value}'),
  ('lfl_sales_growth', 'Like-for-Like Sales Growth', 'Year-on-year sales growth (same estate)', 'percent', true, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. RESTAURANTS (RESTAURANT)
-- Source: UKHospitality / CGA by NIQ, Food Council UK 2025 Report, Fourth Analytics
-- Reliability: Tier 2 | Sample: ~10,000+ units
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Cover
  ('RESTAURANT', 'revenue_per_cover', 'all', 'all', 18.50, 21.45, 35.00, 10000, 2024, 'UKHospitality / CGA by NIQ', 'https://www.ukhospitality.org.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin (Food) - inverse of food cost %
  ('RESTAURANT', 'gross_margin', 'all', 'all', 68, 71.1, 75, 10000, 2024, 'Food Council UK 2025 Report', NULL, 'high', '2024-03-01', true),
  
  -- Food Cost %
  ('RESTAURANT', 'food_cost_percent', 'all', 'all', 25, 28.9, 32, 10000, 2024, 'Food Council UK 2025 Report', NULL, 'high', '2024-03-01', true),
  
  -- Labour Cost %
  ('RESTAURANT', 'labour_cost_percent', 'all', 'all', 28, 32, 38, 10000, 2024, 'Fourth Analytics', 'https://www.fourth.com', 'high', '2024-03-01', true),
  
  -- Net Profit Margin
  ('RESTAURANT', 'net_margin', 'all', 'all', 3, 7.5, 15, 10000, 2024, 'UKHospitality / CGA by NIQ', 'https://www.ukhospitality.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('RESTAURANT', 'employee_turnover', 'all', 'all', 30, 38, 52, 10000, 2024, 'Fourth Analytics', 'https://www.fourth.com', 'high', '2024-03-01', true),
  
  -- Table Turn (turns per night)
  ('RESTAURANT', 'table_turn', 'all', 'all', 1.0, 1.75, 3.0, 10000, 2024, 'CGA by NIQ', NULL, 'medium', '2024-03-01', true),
  
  -- Delivery % of Revenue
  ('RESTAURANT', 'delivery_revenue_percent', 'all', 'all', 10, 27, 35, 10000, 2024, 'CGA by NIQ', NULL, 'high', '2024-03-01', true),
  
  -- Debtor Days (effectively cash business)
  ('RESTAURANT', 'debtor_days', 'all', 'all', 0, 1, 5, NULL, 2024, 'Industry standard (cash/card settlement)', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PUBS & BARS (PUB)
-- Source: BBPA Statistical Handbook 2024, Morning Advertiser, Young's Pubs
-- Reliability: Tier 2 | Sample: ~4,000 pubs
-- NOTE: Highest staff turnover in entire UK economy (47% median)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Weekly Turnover (Wet/Drinks only)
  ('PUB', 'weekly_wet_turnover', 'all', 'all', 5000, 8150, 15000, 4000, 2024, 'BBPA Statistical Handbook 2024', 'https://www.beerandpub.com', 'high', '2024-03-01', true),
  
  -- Gross Margin (Wet)
  ('PUB', 'gross_margin_wet', 'all', 'all', 55, 62, 70, 4000, 2024, 'BBPA Statistical Handbook 2024', 'https://www.beerandpub.com', 'high', '2024-03-01', true),
  
  -- Operating Margin
  ('PUB', 'operating_margin', 'all', 'all', 8, 13.7, 15.2, 4000, 2024, 'BBPA Statistical Handbook 2024', 'https://www.beerandpub.com', 'high', '2024-03-01', true),
  
  -- Employee Turnover (HIGHEST IN UK ECONOMY)
  ('PUB', 'employee_turnover', 'all', 'all', 40, 47, 60, 4000, 2024, 'Morning Advertiser / BBPA', 'https://www.morningadvertiser.co.uk', 'high', '2024-03-01', true),
  
  -- Gaming Revenue (per week)
  ('PUB', 'gaming_revenue_weekly', 'all', 'all', 0, 118, 250, 4000, 2024, 'BBPA Statistical Handbook 2024', 'https://www.beerandpub.com', 'medium', '2024-03-01', true),
  
  -- Wet/Dry Split (wet %)
  ('PUB', 'wet_revenue_percent', 'all', 'all', 50, 70, 90, 4000, 2024, 'BBPA Statistical Handbook 2024', 'https://www.beerandpub.com', 'high', '2024-03-01', true),
  
  -- Debtor Days (effectively cash business)
  ('PUB', 'debtor_days', 'all', 'all', 0, 1, 2, NULL, 2024, 'Industry standard (cash/card settlement)', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. HOTELS & B&Bs (HOTEL)
-- Source: RSM Hotels Tracker / HotStats 2024, Knight Frank Hotel Dashboard
-- Reliability: Tier 3 | Sample: Major UK chains and independents
-- NOTE: Strongest performer in hospitality sector
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Occupancy Rate
  ('HOTEL', 'occupancy_rate', 'all', 'all', 65, 71.6, 81.4, NULL, 2024, 'RSM Hotels Tracker / HotStats 2024', 'https://www.rsmuk.com', 'high', '2024-03-01', true),
  
  -- ADR (Average Daily Rate)
  ('HOTEL', 'adr', 'all', 'all', 95, 155.22, 230.73, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'high', '2024-03-01', true),
  
  -- RevPAR (Revenue per Available Room)
  ('HOTEL', 'revpar', 'all', 'all', 60, 111, 170, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'high', '2024-03-01', true),
  
  -- GOP Margin (Gross Operating Profit - before fixed costs)
  ('HOTEL', 'gop_margin', 'all', 'all', 25, 34.7, 43.3, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'high', '2024-03-01', true),
  
  -- Payroll % of Revenue
  ('HOTEL', 'payroll_percent', 'all', 'all', 24, 27.8, 32, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'high', '2024-03-01', true),
  
  -- Direct Booking % (direct = 30% higher value than OTA)
  ('HOTEL', 'direct_booking_percent', 'all', 'all', 20, 27.5, 50, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'medium', '2024-03-01', true),
  
  -- Employee Turnover (monthly figure - annualised ~60%)
  ('HOTEL', 'employee_turnover_monthly', 'all', 'all', 3, 5, 8, NULL, 2024, 'HotStats 2024', 'https://www.hotstats.com', 'medium', '2024-03-01', true),
  ('HOTEL', 'employee_turnover', 'all', 'all', 36, 60, 96, NULL, 2024, 'Industry estimate (annualised)', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (mixed - transient = 0, corporate/MICE = 30-60)
  ('HOTEL', 'debtor_days', 'all', 'all', 5, 15, 35, NULL, 2024, 'Blended estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CATERING & EVENTS (CATERING)
-- Source: IBISWorld 2025 Catering Services, Food Champs Profit Guide
-- Reliability: Tier 3 | Sample: Census/ONS sector analysis
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Head (blended average across event types)
  ('CATERING', 'revenue_per_head', 'all', 'all', 12, 30, 75, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Gross Margin
  ('CATERING', 'gross_margin', 'all', 'all', 60, 65, 75, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Food Cost %
  ('CATERING', 'food_cost_percent', 'all', 'all', 25, 29, 35, NULL, 2024, 'Food Champs Profit Guide', NULL, 'medium', '2024-03-01', true),
  
  -- Net Profit Margin
  ('CATERING', 'net_margin', 'all', 'all', 5, 8.5, 15, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('CATERING', 'employee_turnover', 'all', 'all', 25, 34, 45, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (B2B/Corporate - slow payers)
  ('CATERING', 'debtor_days', 'all', 'all', 30, 56, 78, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true),
  
  -- Like-for-Like Sales Growth
  ('CATERING', 'lfl_sales_growth', 'all', 'all', 2, 7, 10, NULL, 2024, 'IBISWorld 2025 Catering Services', 'https://www.ibisworld.com', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS - Add monitoring items
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Hospitality Labour Cost Monitoring',
  'research',
  ARRAY['RESTAURANT', 'PUB', 'HOTEL', 'CATERING'],
  ARRAY['labour_cost_percent', 'employee_turnover', 'net_margin'],
  'medium',
  'pending',
  'National Living Wage increased 9.8% in 2024. Monitor impact on margins across sector. Labour costs now critical threshold (>35% = "danger zone" for restaurants). Pub sector has highest turnover in UK economy (47%).',
  '2025-06-01'
),
(
  'Pub Wet vs Food Model Analysis',
  'research',
  ARRAY['PUB'],
  ARRAY['wet_revenue_percent', 'operating_margin', 'gross_margin_wet'],
  'low',
  'pending',
  'Clear divergence between wet-led (struggling) and food-led (resilient) pubs. Consider creating sub-segments in taxonomy: community_wet, gastropub, managed_chain.',
  '2025-03-01'
);

