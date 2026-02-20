-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 7: MANUFACTURING
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5 and 6 have been applied

-- SECTOR CONTEXT NOTE:
-- UK manufacturing resilient with output +9%, but margins tight
-- "Triple threat": energy costs, wage inflation, EPR regulations
-- OEE averages 60-75%, only 6% of firms hit "World Class" 85%+
-- Food & Drink confidence plummeted to -47% due to retailer price wars
-- Precision engineering outperforming (£75k GVA/job = 33% above national avg)

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('MFG_GEN', 'General Manufacturing', 'manufacturing', 'General manufacturing, factory production and assembly', ARRAY['10000', '33000'], ARRAY['manufacturing', 'factory', 'production', 'maker'], true),
  ('MFG_FOOD', 'Food & Beverage Manufacturing', 'manufacturing', 'Food manufacturing, beverage production, bakery and food processing', ARRAY['10110', '10890', '11010', '11070'], ARRAY['food manufacturing', 'beverage', 'bakery', 'food production'], true),
  ('MFG_PREC', 'Precision Engineering', 'manufacturing', 'Precision engineering, CNC machining, toolmaking and precision components', ARRAY['25620', '28410', '28990'], ARRAY['precision engineering', 'CNC', 'machining', 'toolmaking'], true),
  ('PRINT', 'Print & Packaging', 'manufacturing', 'Printing, packaging, labels and print production services', ARRAY['17210', '17230', '17290', '18110', '18120', '18130', '18140'], ARRAY['print', 'printing', 'packaging', 'labels'], true)
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
  -- General Manufacturing
  ('oee_score', 'OEE Score', 'Overall Equipment Effectiveness (Availability × Performance × Quality)', 'percent', true, '{value}%'),
  ('export_percent', 'Export %', 'Exports as percentage of total sales', 'percent', true, '{value}%'),
  ('capacity_utilisation', 'Capacity Utilisation', 'Percentage of production capacity in use', 'percent', true, '{value}%'),
  
  -- Food Manufacturing
  ('labour_vacancy_rate', 'Labour Vacancy Rate', 'Unfilled positions as percentage of workforce', 'percent', false, '{value}%'),
  ('waste_percent', 'Waste %', 'Production waste/yield loss as percentage', 'percent', false, '{value}%'),
  ('input_cost_inflation', 'Input Cost Inflation', 'Year-on-year input cost change', 'percent', false, '{value}%'),
  
  -- Precision Engineering
  ('machine_hourly_rate', 'Machine Hourly Rate', 'Charge-out rate per machine hour', 'currency', true, '£{value}/hr'),
  ('investment_percent', 'Investment %', 'Capital investment as percentage of revenue', 'percent', true, '{value}%'),
  
  -- Print & Packaging
  ('substrate_waste_percent', 'Substrate Waste %', 'Paper/substrate waste as percentage of input', 'percent', false, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. GENERAL MANUFACTURING (MFG_GEN)
-- Source: Make UK Manufacturing Outlook Q2 2024, Netstock, Upflow
-- Reliability: Tier 2 | Sample: ~20,000 Manufacturers
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin
  ('MFG_GEN', 'gross_margin', 'all', 'all', 20, 28, 35, 20000, 2024, 'Make UK Manufacturing Outlook Q2 2024', 'https://www.makeuk.org', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (energy intensive sectors at lower end)
  ('MFG_GEN', 'net_margin', 'all', 'all', 2, 6, 10, 20000, 2024, 'Make UK Manufacturing Outlook Q2 2024', 'https://www.makeuk.org', 'high', '2024-03-01', true),
  
  -- OEE Score (85% = "World Class" but only 6% of firms achieve it)
  ('MFG_GEN', 'oee_score', 'all', 'all', 55, 67.5, 85, 20000, 2024, 'Make UK Manufacturing Outlook Q2 2024', 'https://www.makeuk.org', 'high', '2024-03-01', true),
  
  -- Inventory Days (post-pandemic destocking trend)
  ('MFG_GEN', 'inventory_days', 'all', 'all', 45, 60, 90, 20000, 2024, 'Netstock Inventory Report', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (58% of SMEs wait on late payments)
  ('MFG_GEN', 'debtor_days', 'all', 'all', 45, 57, 75, 20000, 2024, 'Upflow', NULL, 'high', '2024-03-01', true),
  
  -- Revenue per Employee
  ('MFG_GEN', 'revenue_per_employee', 'all', 'all', 90000, 140000, 200000, 20000, 2024, 'Make UK Manufacturing Outlook Q2 2024', 'https://www.makeuk.org', 'high', '2024-03-01', true),
  
  -- Export % of Sales (export orders +10% outpacing domestic +2%)
  ('MFG_GEN', 'export_percent', 'all', 'all', 10, 30, 60, 20000, 2024, 'Make UK Manufacturing Outlook Q2 2024', 'https://www.makeuk.org', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('MFG_GEN', 'employee_turnover', 'all', 'all', 8, 12, 18, NULL, 2024, 'Make UK', 'https://www.makeuk.org', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FOOD & BEVERAGE MANUFACTURING (MFG_FOOD)
-- Source: FDF State of Industry Q2/Q3 2024, Make UK
-- Reliability: Tier 2 | Sample: 12,500 Food & Drink Manufacturers
-- NOTE: Confidence at -47%, EPR adds £1.4bn packaging tax cost
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (retailer buyer power caps upside)
  ('MFG_FOOD', 'gross_margin', 'all', 'all', 18, 23.5, 30, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (extremely volume-dependent)
  ('MFG_FOOD', 'net_margin', 'all', 'all', 1, 3.5, 6, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'high', '2024-03-01', true),
  
  -- Labour Vacancy Rate (twice national manufacturing avg of 2.6%)
  ('MFG_FOOD', 'labour_vacancy_rate', 'all', 'all', 3, 5.1, 8, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'high', '2024-03-01', true),
  
  -- Waste % / Yield Loss (rising focus due to ESG/cost pressures)
  ('MFG_FOOD', 'waste_percent', 'all', 'all', 1.5, 4, 8, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (supermarkets pay slowly 45-60 days)
  ('MFG_FOOD', 'debtor_days', 'all', 'all', 30, 45, 60, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'high', '2024-03-01', true),
  
  -- Input Cost Inflation (EPR packaging tax adds £1.4bn)
  ('MFG_FOOD', 'input_cost_inflation', 'all', 'all', 0, 2.9, 5, 12500, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('MFG_FOOD', 'employee_turnover', 'all', 'all', 15, 22, 30, NULL, 2024, 'FDF State of Industry Q2 2024', 'https://www.fdf.org.uk', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. PRECISION ENGINEERING (MFG_PREC)
-- Source: MTA UK Machine Tool Statistics 2024, IBISWorld
-- Reliability: Tier 2 | Sample: Engineering Supply Chain
-- NOTE: GVA per job £75k = 33% above national average
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee (GVA/job 33% above national avg)
  ('MFG_PREC', 'revenue_per_employee', 'all', 'all', 80000, 110000, 150000, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin (higher value-add than general fabrication)
  ('MFG_PREC', 'gross_margin', 'all', 'all', 25, 35, 45, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'high', '2024-03-01', true),
  
  -- Capacity Utilisation (>85% requires overtime)
  ('MFG_PREC', 'capacity_utilisation', 'all', 'all', 60, 75, 85, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'high', '2024-03-01', true),
  
  -- Machine Hourly Rate (5-axis/CNC rates, manual turning £45-55)
  ('MFG_PREC', 'machine_hourly_rate', 'all', 'all', 60, 85, 120, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'medium', '2024-03-01', true),
  
  -- Order Book (doubling reported in Q2 2024)
  ('MFG_PREC', 'order_book_months', 'all', 'all', 1, 3.5, 6, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'medium', '2024-03-01', true),
  
  -- Investment % of Revenue (full capital expensing driving automation)
  ('MFG_PREC', 'investment_percent', 'all', 'all', 2, 5, 10, NULL, 2024, 'MTA UK Machine Tool Statistics 2024', 'https://www.mta.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days
  ('MFG_PREC', 'debtor_days', 'all', 'all', 40, 55, 70, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. PRINT & PACKAGING (PRINT)
-- Source: BPIF Printing Outlook Q4 2024, Two Sides
-- Reliability: Tier 2 | Sample: UK Print Industry
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (paper price stability in 2024 helped)
  ('PRINT', 'gross_margin', 'all', 'all', 20, 28, 35, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (highly commoditised, niche packaging does better)
  ('PRINT', 'net_margin', 'all', 'all', 1, 3.5, 8, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'high', '2024-03-01', true),
  
  -- Capacity Utilisation (recovered strongly Q3 2024)
  ('PRINT', 'capacity_utilisation', 'all', 'all', 65, 77.5, 90, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'high', '2024-03-01', true),
  
  -- Debtor Days (long payment terms standard)
  ('PRINT', 'debtor_days', 'all', 'all', 45, 60, 75, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'high', '2024-03-01', true),
  
  -- Revenue per Employee (digital print higher than litho)
  ('PRINT', 'revenue_per_employee', 'all', 'all', 85000, 115000, 145000, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'high', '2024-03-01', true),
  
  -- Substrate Waste % (digital presses <2%)
  ('PRINT', 'substrate_waste_percent', 'all', 'all', 2, 5, 10, NULL, 2024, 'BPIF Printing Outlook Q4 2024', 'https://www.britishprint.com', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('PRINT', 'employee_turnover', 'all', 'all', 10, 15, 22, NULL, 2024, 'BPIF', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Food Manufacturing Margin Crisis',
  'research',
  ARRAY['MFG_FOOD'],
  ARRAY['net_margin', 'gross_margin'],
  'urgent',
  'pending',
  'CRITICAL: Sector confidence at -47%. EPR packaging tax adds £1.4bn cost burden. Retailer price wars squeezing margins to 1-3.5%. Labour vacancy rate (5.1%) is twice national manufacturing avg. Monitor for further deterioration.',
  '2025-03-01'
),
(
  'Manufacturing Debtor Days Standard',
  'research',
  ARRAY['MFG_GEN', 'MFG_FOOD', 'MFG_PREC', 'PRINT'],
  ARRAY['debtor_days'],
  'medium',
  'pending',
  '57-day debtor days is the manufacturing standard. Construction supply chain worst (60-75 days). 58% of SME manufacturers waiting on late payments. Consider adding cash flow impact calculations.',
  '2025-06-01'
);

