-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 12: OTHER SERVICES (FINAL)
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 and 11 have been applied

-- SECTOR CONTEXT NOTE:
-- Divergent fortunes in 2024:
-- Travel: Fully recovered, exceeding 2019 levels. Agents booking 38% (up from 26%)
-- Security: "Margin crunch" - demand high but net margins <2% on fixed contracts
-- Cleaning: Staffing crisis acute - 200-400% turnover, turning down contracts
-- Hair & Beauty: "Perfect storm" - 54% did NOT make a profit in 2024

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('TRAVEL_AGENT', 'Travel Agency / Tour Operator', 'travel', 'Travel agencies, tour operators, holiday bookings and travel services', ARRAY['79110', '79120'], ARRAY['travel agent', 'tour operator', 'holidays', 'travel'], true),
  ('SECURITY', 'Security Services', 'other_services', 'Security services, guarding, door supervision and CCTV services', ARRAY['80100', '80200', '80300'], ARRAY['security', 'guarding', 'door supervision', 'CCTV'], true),
  ('CLEANING', 'Cleaning Services', 'other_services', 'Cleaning services, janitorial, commercial cleaning and window cleaning', ARRAY['81210', '81220', '81290'], ARRAY['cleaning', 'janitorial', 'commercial cleaning', 'window cleaning'], true),
  ('PERSONAL', 'Personal Services (Hair, Beauty, etc.)', 'other_services', 'Hair salons, hairdressers, beauty salons, barbers and nail services', ARRAY['96020', '96040'], ARRAY['salon', 'hairdresser', 'beauty', 'barber', 'nails'], true)
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
  -- Travel
  ('avg_booking_value', 'Average Booking Value', 'Average value per booking', 'currency', true, '£{value}'),
  ('cancellation_rate', 'Cancellation Rate', 'Percentage of bookings cancelled', 'percent', false, '{value}%'),
  
  -- Security
  ('charge_rate_hourly', 'Charge Rate (Hourly)', 'Hourly rate charged to client', 'currency', true, '£{value}/hr'),
  ('pay_rate_hourly', 'Pay Rate (Hourly)', 'Hourly rate paid to staff', 'currency', true, '£{value}/hr'),
  ('contract_retention', 'Contract Retention', 'Percentage of contracts renewed', 'percent', true, '{value}%'),
  
  -- Cleaning
  ('wage_percent_of_revenue', 'Wage % of Revenue', 'Total wages as percentage of revenue', 'percent', false, '{value}%'),
  
  -- Hair & Beauty
  ('revenue_per_chair_daily', 'Revenue per Chair (Daily)', 'Daily revenue per styling chair', 'currency', true, '£{value}'),
  ('average_spend', 'Average Spend', 'Average customer spend per visit', 'currency', true, '£{value}'),
  ('retail_percent', 'Retail %', 'Retail product sales as % of revenue', 'percent', true, '{value}%'),
  ('staff_cost_percent', 'Staff Cost %', 'Staff costs as percentage of revenue', 'percent', false, '{value}%'),
  ('rebooking_rate', 'Rebooking Rate', 'Percentage of clients rebooking before leaving', 'percent', true, '{value}%'),
  ('rent_percent', 'Rent %', 'Rent as percentage of revenue', 'percent', false, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TRAVEL AGENTS / TOUR OPERATORS (TRAVEL_AGENT)
-- Source: ABTA Holiday Habits 2024, Travel Weekly / TTG Data
-- Reliability: Tier 2 | Sample: UK Travel Trade
-- NOTE: Traditional agents resurgent - 38% of bookings (up from 26%)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Commission Rate (OTAs charge 15-25%)
  ('TRAVEL_AGENT', 'commission_rate', 'all', 'all', 8, 12, 15, NULL, 2024, 'ABTA Holiday Habits 2024', 'https://www.abta.com', 'high', '2024-03-01', true),
  
  -- Average Booking Value (high-value, complex itineraries drive agent usage)
  ('TRAVEL_AGENT', 'avg_booking_value', 'all', 'all', 2500, 4000, 6500, NULL, 2024, 'ABTA Holiday Habits 2024', 'https://www.abta.com', 'high', '2024-03-01', true),
  
  -- Cancellation Rate (OTAs 40% vs Agents 10-15%)
  ('TRAVEL_AGENT', 'cancellation_rate', 'all', 'all', 10, 20, 40, NULL, 2024, 'Travel Weekly', NULL, 'medium', '2024-03-01', true),
  
  -- Revenue per Employee (high turnover, low margin model)
  ('TRAVEL_AGENT', 'revenue_per_employee', 'all', 'all', 150000, 250000, 400000, NULL, 2024, 'TTG Data', NULL, 'medium', '2024-03-01', true),
  
  -- Gross Margin (service fees increasingly added on top)
  ('TRAVEL_AGENT', 'gross_margin', 'all', 'all', 8, 11, 18, NULL, 2024, 'ABTA Holiday Habits 2024', 'https://www.abta.com', 'high', '2024-03-01', true),
  
  -- Debtor Days (typically upfront payment from customers)
  ('TRAVEL_AGENT', 'debtor_days', 'all', 'all', 0, 7, 21, NULL, 2024, 'Industry standard', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('TRAVEL_AGENT', 'employee_turnover', 'all', 'all', 15, 22, 35, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SECURITY SERVICES (SECURITY)
-- Source: SIA Annual Report 2024, SIRV Profitability Report, Imperial Security
-- Reliability: Tier 2 | Sample: ~4,200 Security Companies
-- NOTE: "Margin crunch" - NLW squeezing margins on fixed-price contracts
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Charge Rate (hourly - manned guarding, event/close protection higher)
  ('SECURITY', 'charge_rate_hourly', 'all', 'all', 18.00, 22.00, 30.00, 4200, 2024, 'SIRV Profitability Report', NULL, 'high', '2024-03-01', true),
  
  -- Pay Rate (guard - margins squeezed by NLW)
  ('SECURITY', 'pay_rate_hourly', 'all', 'all', 11.44, 12.50, 14.00, 4200, 2024, 'SIA Annual Report 2024', 'https://www.sia.gov.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin (volume driven, niche K9 etc. has higher margins)
  ('SECURITY', 'gross_margin', 'all', 'all', 12, 18, 25, 4200, 2024, 'SIRV Profitability Report', NULL, 'high', '2024-03-01', true),
  
  -- Net Profit Margin (major players operate on thin margins)
  ('SECURITY', 'net_margin', 'all', 'all', 1.0, 2.5, 5.0, 4200, 2024, 'SIRV Profitability Report', NULL, 'high', '2024-03-01', true),
  
  -- Staff Turnover ("churn and burn" remains major issue)
  ('SECURITY', 'employee_turnover', 'all', 'all', 20, 40, 60, 4200, 2024, 'SIA Annual Report 2024', 'https://www.sia.gov.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days (FM sectors face slow payment)
  ('SECURITY', 'debtor_days', 'all', 'all', 45, 56, 70, 4200, 2024, 'Imperial Security', NULL, 'medium', '2024-03-01', true),
  
  -- Contract Retention
  ('SECURITY', 'contract_retention', 'all', 'all', 75, 85, 92, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CLEANING SERVICES (CLEANING)
-- Source: BICSc Research 2024, Cleaning Matters, PolicyBee
-- Reliability: Tier 2 | Sample: ~75,000 Cleaning Businesses
-- WARNING: Staffing crisis - 200-400% turnover, turning down contracts
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Gross Margin (commercial contracts, domestic ~40%)
  ('CLEANING', 'gross_margin', 'all', 'all', 15, 22, 30, 75000, 2024, 'BICSc Research 2024', 'https://www.bics.org.uk', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (forecast 6.2% average)
  ('CLEANING', 'net_margin', 'all', 'all', 3, 6.2, 10, 75000, 2024, 'BICSc Research 2024', 'https://www.bics.org.uk', 'high', '2024-03-01', true),
  
  -- Staff Turnover (CRISIS: 400% = replacing staff quarterly)
  ('CLEANING', 'employee_turnover', 'all', 'all', 50, 200, 400, 75000, 2024, 'Cleaning Matters', NULL, 'high', '2024-03-01', true),
  
  -- Revenue per Employee (low due to part-time workforce)
  ('CLEANING', 'revenue_per_employee', 'all', 'all', 25000, 36900, 45000, 75000, 2024, 'PolicyBee', NULL, 'high', '2024-03-01', true),
  
  -- Wage % of Revenue (extreme labour intensity)
  ('CLEANING', 'wage_percent_of_revenue', 'all', 'all', 65, 75, 85, 75000, 2024, 'BICSc Research 2024', 'https://www.bics.org.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days (similar to security, often same FM contract)
  ('CLEANING', 'debtor_days', 'all', 'all', 30, 45, 60, 75000, 2024, 'Cleaning Matters', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. PERSONAL SERVICES - HAIR & BEAUTY (PERSONAL)
-- Source: NHBF State of Industry 2024, Salon Today
-- Reliability: Tier 2 | Sample: ~48,000 Salons
-- WARNING: 54% did NOT make profit - "perfect storm" of costs
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Chair (daily) - rent-a-chair fees £50-£100/day
  ('PERSONAL', 'revenue_per_chair_daily', 'all', 'all', 150, 250, 400, 48000, 2024, 'NHBF State of Industry 2024', 'https://www.nhbf.co.uk', 'high', '2024-03-01', true),
  
  -- Average Spend (women who visit regularly ~£1,000/year)
  ('PERSONAL', 'average_spend', 'all', 'all', 35, 65, 120, 48000, 2024, 'NHBF State of Industry 2024', 'https://www.nhbf.co.uk', 'high', '2024-03-01', true),
  
  -- Retail % of Revenue (biggest missed opportunity)
  ('PERSONAL', 'retail_percent', 'all', 'all', 2, 6.5, 15, 48000, 2024, 'Salon Today', NULL, 'high', '2024-03-01', true),
  
  -- Staff Cost % (>55% is dangerous for viability)
  ('PERSONAL', 'staff_cost_percent', 'all', 'all', 45, 55, 65, 48000, 2024, 'NHBF State of Industry 2024', 'https://www.nhbf.co.uk', 'high', '2024-03-01', true),
  
  -- Rebooking Rate (key metric for stylist performance)
  ('PERSONAL', 'rebooking_rate', 'all', 'all', 40, 60, 80, 48000, 2024, 'Salon Today', NULL, 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('PERSONAL', 'employee_turnover', 'all', 'all', 20, 30, 45, 48000, 2024, 'NHBF State of Industry 2024', 'https://www.nhbf.co.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (B2C = immediate payment)
  ('PERSONAL', 'debtor_days', 'all', 'all', 0, 0, 3, NULL, 2024, 'Industry standard (B2C)', NULL, 'high', '2024-03-01', true),
  
  -- Rent as % of Revenue
  ('PERSONAL', 'rent_percent', 'all', 'all', 8, 12, 18, 48000, 2024, 'NHBF State of Industry 2024', 'https://www.nhbf.co.uk', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Cleaning Staff Turnover Crisis',
  'research',
  ARRAY['CLEANING'],
  ARRAY['employee_turnover', 'wage_percent_of_revenue'],
  'urgent',
  'pending',
  'CRISIS: 200-400% turnover in some roles (replacing staff quarterly). Firms turning down contracts due to staffing. Wage % at 75% of revenue is extreme. NLW increases will exacerbate. Monitor for sector consolidation.',
  '2025-03-01'
),
(
  'Hair & Beauty Profitability Crisis',
  'research',
  ARRAY['PERSONAL'],
  ARRAY['staff_cost_percent'],
  'urgent',
  'pending',
  'CRITICAL: Only 46% of salons made profit in 2024 (54% loss-making). "Perfect storm" of energy costs, NLW rises, and VAT threshold. Staff cost >55% = danger zone. Retail (6.5% median) is biggest missed opportunity.',
  '2025-03-01'
),
(
  'Security Margin Squeeze',
  'research',
  ARRAY['SECURITY'],
  ARRAY['net_margin', 'pay_rate_hourly'],
  'medium',
  'pending',
  'NLW squeeze on fixed-price contracts. Pay rate £12.50 vs charge rate £22 = 18% gross margin but only 2.5% net. Major players (Mitie, Bidvest) operate on <3% net. Working capital gap (56-day debtors while paying weekly) kills small agencies.',
  '2025-06-01'
),
(
  'Travel Agent Resurgence',
  'research',
  ARRAY['TRAVEL_AGENT'],
  ARRAY['cancellation_rate', 'avg_booking_value'],
  'medium',
  'pending',
  'Traditional agents now booking 38% of holidays (up from 26%). Cancellation rates: Agents 12% vs OTAs 40%. Value of human support recognized. High-value/complex itineraries driving agent usage. Consider tracking agent vs OTA segmentation.',
  '2025-06-01'
);

