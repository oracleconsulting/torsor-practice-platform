-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 1: PROFESSIONAL SERVICES
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration has been applied

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('ACCT', 'Accountancy & Tax Services', 'professional_services', 'Professional accountancy, tax advisory, audit and bookkeeping services', ARRAY['69201', '69202'], ARRAY['accountant', 'tax', 'audit', 'bookkeeping', 'payroll'], true),
  ('LEGAL', 'Legal Services', 'professional_services', 'Solicitors, barristers, legal advisory and conveyancing services', ARRAY['69101', '69102', '69109'], ARRAY['solicitor', 'lawyer', 'law firm', 'legal', 'barrister', 'conveyancing'], true),
  ('CONSULT', 'Management Consultancy', 'professional_services', 'Business strategy, operations and management consulting', ARRAY['70229'], ARRAY['consultant', 'consulting', 'advisory', 'strategy'], true),
  ('RECRUIT', 'Recruitment & Staffing', 'professional_services', 'Recruitment agencies, executive search and temporary staffing', ARRAY['78109', '78200', '78300'], ARRAY['recruitment', 'staffing', 'headhunter', 'executive search', 'temp agency'], true),
  ('MARKET', 'Marketing & PR Agencies', 'professional_services', 'Marketing, PR, advertising and branding agencies', ARRAY['73110', '73120', '70210'], ARRAY['marketing', 'PR', 'public relations', 'advertising', 'branding', 'digital marketing'], true),
  ('ARCH', 'Architecture & Design', 'professional_services', 'Architectural design, planning and building design services', ARRAY['71111'], ARRAY['architect', 'architecture', 'building design', 'planning'], true),
  ('ENG', 'Engineering Consultancy', 'professional_services', 'Engineering consulting, structural, civil and mechanical engineering', ARRAY['71121', '71122', '71129'], ARRAY['engineer', 'engineering', 'structural', 'civil', 'mechanical'], true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sic_codes = EXCLUDED.sic_codes,
  keywords = EXCLUDED.keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ACCOUNTANCY & TAX SERVICES (ACCT)
-- Source: Law Society Financial Benchmarking Survey 2024 (Hazlewoods LLP)
-- Reliability: Tier 2 | Sample: 147 firms, £1.5bn combined fee income
-- ═══════════════════════════════════════════════════════════════════════════════

-- Universal Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee (segmented by size)
  ('ACCT', 'revenue_per_employee', '500k_1m', 'all', 62000, 78000, 95000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'revenue_per_employee', '2m_5m', 'all', 68400, 91600, 124800, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'revenue_per_employee', '5m_10m', 'all', 85000, 105000, 135000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'revenue_per_employee', '10m_plus', 'all', 95000, 118000, 155000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin
  ('ACCT', 'gross_margin', 'all', 'all', 42, 48, 55, 147, 2023, 'Law Society Financial Benchmarking Survey 2024 (estimated)', 'https://www.hazlewoods.co.uk', 'medium', '2024-03-01', true),
  
  -- Net Margin (segmented by size)
  ('ACCT', 'net_margin', '500k_1m', 'all', 14, 19, 25, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'net_margin', '2m_5m', 'all', 18, 24, 31, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'net_margin', '5m_10m', 'all', 22, 28, 35, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  ('ACCT', 'net_margin', '10m_plus', 'all', 26, 32, 40, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days
  ('ACCT', 'debtor_days', 'all', 'all', 68, 85, 102, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  
  -- Creditor Days
  ('ACCT', 'creditor_days', 'all', 'all', 45, 52, 61, 147, 2023, 'Industry standard assumptions', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('ACCT', 'employee_turnover', 'all', 'all', 12, 18, 25, NULL, 2023, 'ICAEW member survey', 'https://www.icaew.com', 'medium', '2024-03-01', true),
  
  -- Client Retention
  ('ACCT', 'client_retention', 'all', 'all', 85, 92, 97, NULL, 2023, 'AVN member benchmarks', 'https://www.avn.co.uk', 'medium', '2024-03-01', true);

-- Accountancy Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('ACCT', 'fee_income_per_partner', 'all', 'all', 450000, 750000, 1200000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('ACCT', 'charge_out_rate_qualified', 'all', 'all', 95, 125, 165, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('ACCT', 'audit_fee_percent', 'all', 'all', 25, 35, 45, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'medium', '2024-03-01', true),
  ('ACCT', 'advisory_service_percent', 'all', 'all', 15, 22, 30, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'medium', '2024-03-01', true),
  ('ACCT', 'recurring_revenue_percent', 'all', 'all', 40, 60, 80, NULL, 2023, 'AVN member benchmarks', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. LEGAL SERVICES (LEGAL)
-- Source: Law Society Financial Benchmarking Survey 2024 (Hazlewoods LLP)
-- Reliability: Tier 2 | Sample: 147 firms
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee
  ('LEGAL', 'revenue_per_employee', 'all', 'all', 72000, 98500, 136000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'https://www.hazlewoods.co.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin
  ('LEGAL', 'gross_margin', 'all', 'all', 38, 45, 52, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  
  -- Net Margin (segmented)
  ('LEGAL', 'net_margin', '2m_5m', 'all', 14, 19, 25, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'net_margin', '5m_10m', 'all', 18, 23, 29, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'net_margin', '10m_plus', 'all', 22, 27, 33, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  
  -- Debtor Days (Lock-up)
  ('LEGAL', 'debtor_days', 'all', 'all', 125, 146, 168, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  
  -- Creditor Days
  ('LEGAL', 'creditor_days', 'all', 'all', 38, 45, 53, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('LEGAL', 'employee_turnover', 'all', 'all', 15, 22, 28, NULL, 2023, 'Law Society attrition data', 'https://www.lawsociety.org.uk', 'medium', '2024-03-01', true),
  
  -- Client Retention
  ('LEGAL', 'client_retention', 'all', 'all', 78, 88, 95, NULL, 2023, 'Law Society Financial Benchmarking Survey 2024', 'medium', '2024-03-01', true);

-- Legal Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('LEGAL', 'fee_income_per_equity_partner', 'all', 'all', 650000, 1120000, 1850000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'profit_per_equity_partner', 'all', 'all', 145000, 210000, 385000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'cost_per_fee_earner', 'all', 'all', 58000, 67500, 78000, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'billable_hours_target', 'all', 'all', 1200, 1350, 1500, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true),
  ('LEGAL', 'lock_up_days', 'all', 'all', 130, 146, 165, 147, 2023, 'Law Society Financial Benchmarking Survey 2024', 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. MANAGEMENT CONSULTANCY (CONSULT)
-- Source: MCA Annual Report 2025 + SPI Research Professional Services Maturity Benchmark
-- Reliability: Tier 2 (MCA) / Tier 3 (SPI)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee
  ('CONSULT', 'revenue_per_employee', 'all', 'all', 95000, 142000, 198000, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'high', '2024-11-01', true),
  
  -- Gross Margin
  ('CONSULT', 'gross_margin', 'all', 'all', 32, 38, 45, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'medium', '2024-11-01', true),
  
  -- Net Margin
  ('CONSULT', 'net_margin', 'all', 'all', 8, 12, 18, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'medium', '2024-11-01', true),
  
  -- Debtor Days
  ('CONSULT', 'debtor_days', 'all', 'all', 55, 72, 90, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'medium', '2024-11-01', true),
  
  -- Creditor Days
  ('CONSULT', 'creditor_days', 'all', 'all', 42, 50, 58, NULL, 2024, 'Industry standard', NULL, 'low', '2024-11-01', true),
  
  -- Employee Turnover
  ('CONSULT', 'employee_turnover', 'all', 'all', 18, 25, 32, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'medium', '2024-11-01', true),
  
  -- Client Retention
  ('CONSULT', 'client_retention', 'all', 'all', 70, 82, 91, NULL, 2024, 'MCA Annual Report 2025', 'https://www.mca.org.uk', 'medium', '2024-11-01', true);

-- Consultancy by Segment (Note: Using 'all' revenue_band as segments are not revenue-based)
-- These could be stored as separate industry codes or in a segment field in the future
-- For now, commenting out as they don't fit the revenue_band schema
-- INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
-- VALUES
--   -- Strategy Consulting
--   ('CONSULT', 'revenue_per_employee', 'all', 'all', 145000, 185000, 245000, NULL, 2024, 'MCA Annual Report 2025 (Strategy)', 'high', '2024-11-01', true),
--   ('CONSULT', 'net_margin', 'all', 'all', 14, 18, 24, NULL, 2024, 'MCA Annual Report 2025 (Strategy)', 'medium', '2024-11-01', true),
--   
--   -- IT/Digital Consulting
--   ('CONSULT', 'revenue_per_employee', 'all', 'all', 115000, 145000, 190000, NULL, 2024, 'MCA Annual Report 2025 (IT/Digital)', 'high', '2024-11-01', true),
--   ('CONSULT', 'net_margin', 'all', 'all', 8, 12, 16, NULL, 2024, 'MCA Annual Report 2025 (IT/Digital)', 'medium', '2024-11-01', true),
--   
--   -- Operations Consulting
--   ('CONSULT', 'revenue_per_employee', 'all', 'all', 95000, 125000, 165000, NULL, 2024, 'MCA Annual Report 2025 (Operations)', 'high', '2024-11-01', true),
--   ('CONSULT', 'net_margin', 'all', 'all', 6, 10, 14, NULL, 2024, 'MCA Annual Report 2025 (Operations)', 'medium', '2024-11-01', true);

-- Consultancy Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('CONSULT', 'billable_revenue_per_consultant', 'all', 'all', 125000, 165000, 212000, NULL, 2024, 'SPI Research (UK-adjusted)', 'medium', '2024-11-01', true),
  ('CONSULT', 'utilisation_rate', 'all', 'all', 65, 71, 78, NULL, 2024, 'SPI Research (UK-adjusted)', 'medium', '2024-11-01', true),
  ('CONSULT', 'project_margin', 'all', 'all', 28, 35, 42, NULL, 2024, 'SPI Research (UK-adjusted)', 'medium', '2024-11-01', true),
  ('CONSULT', 'pipeline_coverage', 'all', 'all', 1.2, 1.8, 2.5, NULL, 2024, 'SPI Research (UK-adjusted)', 'medium', '2024-11-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. RECRUITMENT & STAFFING (RECRUIT)
-- Source: REC + CIPD Labour Market Outlook + Signature Recruitment Market Update 2024
-- Reliability: Tier 2 (REC) / Tier 3 (Industry surveys)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee
  ('RECRUIT', 'revenue_per_employee', 'all', 'all', 85000, 118000, 165000, NULL, 2024, 'REC Industry Benchmarks', 'https://www.rec.uk.com', 'medium', '2024-12-01', true),
  
  -- Gross Margin
  ('RECRUIT', 'gross_margin', 'all', 'all', 18, 25, 32, NULL, 2024, 'REC Industry Benchmarks', 'https://www.rec.uk.com', 'medium', '2024-12-01', true),
  
  -- Net Margin
  ('RECRUIT', 'net_margin', 'all', 'all', 4, 8, 14, NULL, 2024, 'REC Industry Benchmarks', 'https://www.rec.uk.com', 'medium', '2024-12-01', true),
  
  -- Debtor Days
  ('RECRUIT', 'debtor_days', 'all', 'all', 35, 45, 58, NULL, 2024, 'REC Industry Benchmarks', 'https://www.rec.uk.com', 'medium', '2024-12-01', true),
  
  -- Creditor Days
  ('RECRUIT', 'creditor_days', 'all', 'all', 28, 35, 42, NULL, 2024, 'Industry standard', NULL, 'low', '2024-12-01', true),
  
  -- Employee Turnover (notoriously high in recruitment)
  ('RECRUIT', 'employee_turnover', 'all', 'all', 28, 38, 48, NULL, 2024, 'CIPD Labour Market Outlook', 'https://www.cipd.co.uk', 'medium', '2024-12-01', true),
  
  -- Client Retention
  ('RECRUIT', 'client_retention', 'all', 'all', 65, 75, 85, NULL, 2024, 'REC Industry Benchmarks', 'https://www.rec.uk.com', 'medium', '2024-12-01', true);

-- Recruitment by Sector (Note: Using 'all' revenue_band as sectors are not revenue-based)
-- These could be stored as separate industry codes or in a segment field in the future
-- For now, commenting out as they don't fit the revenue_band schema
-- INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
-- VALUES
--   -- Tech Recruitment
--   ('RECRUIT', 'revenue_per_employee', 'all', 'all', 115000, 145000, 195000, NULL, 2024, 'Signature Recruitment Market Update 2024 (Tech)', 'medium', '2024-12-01', true),
--   ('RECRUIT', 'net_margin', 'all', 'all', 8, 12, 18, NULL, 2024, 'Signature Recruitment Market Update 2024 (Tech)', 'medium', '2024-12-01', true),
--   
--   -- Healthcare Recruitment
--   ('RECRUIT', 'revenue_per_employee', 'all', 'all', 75000, 95000, 125000, NULL, 2024, 'Signature Recruitment Market Update 2024 (Healthcare)', 'medium', '2024-12-01', true),
--   ('RECRUIT', 'net_margin', 'all', 'all', 3, 6, 10, NULL, 2024, 'Signature Recruitment Market Update 2024 (Healthcare)', 'medium', '2024-12-01', true),
--   
--   -- Finance Recruitment
--   ('RECRUIT', 'revenue_per_employee', 'all', 'all', 105000, 135000, 180000, NULL, 2024, 'Signature Recruitment Market Update 2024 (Finance)', 'medium', '2024-12-01', true),
--   ('RECRUIT', 'net_margin', 'all', 'all', 6, 10, 15, NULL, 2024, 'Signature Recruitment Market Update 2024 (Finance)', 'medium', '2024-12-01', true);

-- Recruitment Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('RECRUIT', 'perm_placement_fee_percent', 'all', 'all', 15, 20, 25, NULL, 2024, 'REC Industry Benchmarks', 'medium', '2024-12-01', true),
  ('RECRUIT', 'temp_contract_margin', 'all', 'all', 12, 18, 25, NULL, 2024, 'REC Industry Benchmarks', 'medium', '2024-12-01', true),
  ('RECRUIT', 'time_to_fill_days', 'all', 'all', 30, 45, 60, NULL, 2024, 'REC Industry Benchmarks', 'medium', '2024-12-01', true),
  ('RECRUIT', 'fill_rate', 'all', 'all', 45, 60, 75, NULL, 2024, 'REC Industry Benchmarks', 'medium', '2024-12-01', true),
  ('RECRUIT', 'candidate_ghosting_rate', 'all', 'all', 15, 22, 30, NULL, 2024, 'CIPD Labour Market Outlook', 'low', '2024-12-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. MARKETING & PR AGENCIES (MARKET)
-- Source: IPA Agency Census 2024 + Marketing Week Salary Survey 2024
-- Reliability: Tier 3 (Limited UK-specific percentile data)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee (segmented by size)
  ('MARKET', 'revenue_per_employee', '2m_5m', 'all', 55000, 75000, 100000, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  ('MARKET', 'revenue_per_employee', '5m_10m', 'all', 72000, 92000, 120000, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  ('MARKET', 'revenue_per_employee', '10m_plus', 'all', 95000, 118000, 150000, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  
  -- Gross Margin
  ('MARKET', 'gross_margin', 'all', 'all', 28, 35, 42, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  
  -- Net Margin (segmented by size)
  ('MARKET', 'net_margin', '2m_5m', 'all', 4, 8, 13, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  ('MARKET', 'net_margin', '5m_10m', 'all', 8, 12, 17, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  ('MARKET', 'net_margin', '10m_plus', 'all', 12, 16, 22, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  
  -- Debtor Days
  ('MARKET', 'debtor_days', 'all', 'all', 48, 62, 78, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true),
  
  -- Creditor Days
  ('MARKET', 'creditor_days', 'all', 'all', 35, 45, 55, NULL, 2024, 'Industry standard', NULL, 'low', '2024-04-01', true),
  
  -- Employee Turnover
  ('MARKET', 'employee_turnover', 'all', 'all', 22, 30, 38, NULL, 2024, 'Marketing Week Salary Survey 2024', NULL, 'medium', '2024-04-01', true),
  
  -- Client Retention
  ('MARKET', 'client_retention', 'all', 'all', 68, 78, 87, NULL, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'medium', '2024-04-01', true);

-- Marketing Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('MARKET', 'client_concentration_top3', 'all', 'all', 25, 35, 50, NULL, 2024, 'IPA Agency Census 2024', 'medium', '2024-04-01', true),
  ('MARKET', 'project_profitability', 'all', 'all', 22, 30, 38, NULL, 2024, 'IPA Agency Census 2024', 'medium', '2024-04-01', true),
  ('MARKET', 'digital_revenue_percent', 'all', 'all', 40, 55, 70, NULL, 2024, 'IPA Agency Census 2024', 'medium', '2024-04-01', true),
  ('MARKET', 'new_business_win_rate', 'all', 'all', 25, 35, 45, NULL, 2024, 'IPA Agency Census 2024', 'low', '2024-04-01', true),
  ('MARKET', 'staff_utilisation', 'all', 'all', 65, 72, 80, NULL, 2024, 'IPA Agency Census 2024', 'medium', '2024-04-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ARCHITECTURE (ARCH)
-- Source: RIBA Business Benchmarking Survey 2023 + ONS Construction Statistics
-- Reliability: Tier 2 (RIBA) / Tier 3 (ONS proxies)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee (segmented by size - mapped from employee-based segments to revenue bands)
  ('ARCH', 'revenue_per_employee', 'under_250k', 'all', 42000, 52000, 65000, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'high', '2023-09-01', true),
  ('ARCH', 'revenue_per_employee', '1m_2m', 'all', 55000, 68000, 85000, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'high', '2023-09-01', true),
  ('ARCH', 'revenue_per_employee', '2m_5m', 'all', 65000, 82000, 105000, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'high', '2023-09-01', true),
  
  -- Gross Margin
  ('ARCH', 'gross_margin', 'all', 'all', 32, 38, 45, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  
  -- Net Margin (segmented by size - mapped from employee-based segments to revenue bands)
  ('ARCH', 'net_margin', 'under_250k', 'all', 10, 15, 22, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  ('ARCH', 'net_margin', '1m_2m', 'all', 7, 11, 16, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  ('ARCH', 'net_margin', '2m_5m', 'all', 9, 13, 18, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  
  -- Debtor Days
  ('ARCH', 'debtor_days', 'all', 'all', 72, 89, 110, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  
  -- Creditor Days
  ('ARCH', 'creditor_days', 'all', 'all', 40, 50, 62, NULL, 2023, 'Industry standard', NULL, 'low', '2023-09-01', true),
  
  -- Employee Turnover
  ('ARCH', 'employee_turnover', 'all', 'all', 12, 16, 22, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true),
  
  -- Client Retention
  ('ARCH', 'client_retention', 'all', 'all', 75, 83, 90, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'https://www.architecture.com', 'medium', '2023-09-01', true);

-- Architecture Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('ARCH', 'fee_income_per_architect', 'all', 'all', 65000, 82000, 105000, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'high', '2023-09-01', true),
  ('ARCH', 'project_win_rate', 'all', 'all', 20, 30, 40, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'medium', '2023-09-01', true),
  ('ARCH', 'overhead_rate', 'all', 'all', 120, 145, 170, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'medium', '2023-09-01', true),
  ('ARCH', 'wip_days', 'all', 'all', 35, 45, 55, NULL, 2023, 'RIBA Business Benchmarking Survey 2023', 'medium', '2023-09-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. ENGINEERING CONSULTANCY (ENG)
-- Source: ACE Benchmarking Report 2016 + ECUK survey + ONS proxies (2024 adjusted)
-- Reliability: Tier 3 (Dated primary source with estimates)
-- Note: Primary ACE source is 8 years old - flagged for manual refresh
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Employee
  ('ENG', 'revenue_per_employee', 'all', 'all', 72000, 95000, 128000, NULL, 2024, 'ACE Benchmarking 2016 (CPI-adjusted)', 'https://www.acenet.co.uk', 'low', '2024-01-01', true),
  
  -- Gross Margin
  ('ENG', 'gross_margin', 'all', 'all', 28, 34, 41, NULL, 2024, 'ACE Benchmarking 2016 (estimated)', 'https://www.acenet.co.uk', 'low', '2024-01-01', true),
  
  -- Net Margin
  ('ENG', 'net_margin', 'all', 'all', 6, 10, 15, NULL, 2024, 'ACE Benchmarking 2016 (estimated)', 'https://www.acenet.co.uk', 'low', '2024-01-01', true),
  
  -- Debtor Days
  ('ENG', 'debtor_days', 'all', 'all', 65, 82, 101, NULL, 2024, 'ACE Benchmarking 2016 (estimated)', 'https://www.acenet.co.uk', 'low', '2024-01-01', true),
  
  -- Creditor Days
  ('ENG', 'creditor_days', 'all', 'all', 38, 48, 58, NULL, 2024, 'Industry standard', NULL, 'low', '2024-01-01', true),
  
  -- Employee Turnover
  ('ENG', 'employee_turnover', 'all', 'all', 10, 14, 19, NULL, 2024, 'ECUK survey data', 'https://www.engc.org.uk', 'medium', '2024-01-01', true),
  
  -- Client Retention
  ('ENG', 'client_retention', 'all', 'all', 80, 87, 93, NULL, 2024, 'ACE Benchmarking 2016 (estimated)', 'https://www.acenet.co.uk', 'low', '2024-01-01', true);

-- Engineering Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('ENG', 'revenue_per_fee_earner', 'all', 'all', 81000, 102000, 135000, NULL, 2024, 'ACE Benchmarking 2016 (CPI-adjusted)', 'low', '2024-01-01', true),
  ('ENG', 'utilisation_rate', 'all', 'all', 65, 72, 80, NULL, 2024, 'Industry estimate', 'low', '2024-01-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE benchmark_manual_queue TABLE (if not exists)
-- Queue for tracking manual benchmark data refresh tasks
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS benchmark_manual_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ons', 'trade_association', 'companies_house', 'internal', 'research')),
  industries_affected TEXT[] NOT NULL,
  metrics_affected TEXT[] NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  due_date DATE,
  assigned_to UUID REFERENCES practice_members(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD TO MANUAL QUEUE: Engineering data refresh needed
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES (
  'ACE Engineering Benchmarking',
  'trade_association',
  ARRAY['ENG'],
  ARRAY['revenue_per_employee', 'gross_margin', 'net_margin', 'debtor_days', 'client_retention'],
  'urgent',
  'pending',
  'Primary ACE source is from 2016 - 8 years old. Need to contact ACE for updated benchmarks or find alternative source. Current data has low confidence.',
  '2025-01-31'
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- ENSURE METRIC DEFINITIONS EXIST
-- Run this to create any missing metric definitions
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_metrics (code, name, description, unit, higher_is_better, display_format)
VALUES
  ('revenue_per_employee', 'Revenue per Employee', 'Total revenue divided by headcount', 'currency', true, '£{value}'),
  ('gross_margin', 'Gross Margin', 'Gross profit as percentage of revenue', 'percent', true, '{value}%'),
  ('net_margin', 'Net Margin', 'Net profit as percentage of revenue', 'percent', true, '{value}%'),
  ('debtor_days', 'Debtor Days', 'Average time to collect receivables', 'days', false, '{value} days'),
  ('creditor_days', 'Creditor Days', 'Average time to pay suppliers', 'days', true, '{value} days'),
  ('employee_turnover', 'Employee Turnover Rate', 'Annual staff attrition percentage', 'percent', false, '{value}%'),
  ('client_retention', 'Client Retention Rate', 'Percentage of clients retained year-on-year', 'percent', true, '{value}%'),
  
  -- Accountancy specific
  ('fee_income_per_partner', 'Fee Income per Partner', 'Total fees divided by equity partners', 'currency', true, '£{value}'),
  ('charge_out_rate_qualified', 'Charge-out Rate (Qualified)', 'Hourly rate for qualified staff', 'currency', true, '£{value}/hr'),
  ('audit_fee_percent', 'Audit Fee %', 'Audit fees as percentage of total', 'percent', false, '{value}%'),
  ('advisory_service_percent', 'Advisory Service %', 'Advisory fees as percentage of total', 'percent', true, '{value}%'),
  ('recurring_revenue_percent', 'Recurring Revenue %', 'Percentage of revenue that is recurring', 'percent', true, '{value}%'),
  
  -- Legal specific
  ('fee_income_per_equity_partner', 'Fee Income per Equity Partner', 'Total fees divided by equity partners', 'currency', true, '£{value}'),
  ('profit_per_equity_partner', 'Profit per Equity Partner', 'Net profit divided by equity partners', 'currency', true, '£{value}'),
  ('cost_per_fee_earner', 'Cost per Fee Earner', 'Total costs per billing staff member', 'currency', false, '£{value}'),
  ('billable_hours_target', 'Billable Hours Target', 'Annual chargeable hours target', 'number', true, '{value} hrs'),
  ('lock_up_days', 'Lock-up Days', 'WIP plus debtor days', 'days', false, '{value} days'),
  
  -- Consultancy specific
  ('billable_revenue_per_consultant', 'Billable Revenue per Consultant', 'Fee revenue per consulting staff', 'currency', true, '£{value}'),
  ('utilisation_rate', 'Utilisation Rate', 'Percentage of time spent on billable work', 'percent', true, '{value}%'),
  ('project_margin', 'Project Margin', 'Average margin on individual projects', 'percent', true, '{value}%'),
  ('pipeline_coverage', 'Pipeline Coverage', 'Pipeline value as multiple of annual revenue', 'ratio', true, '{value}x'),
  
  -- Recruitment specific
  ('perm_placement_fee_percent', 'Perm Placement Fee %', 'Fee as percentage of candidate salary', 'percent', true, '{value}%'),
  ('temp_contract_margin', 'Temp/Contract Margin', 'Markup on contractor pay rates', 'percent', true, '{value}%'),
  ('time_to_fill_days', 'Time to Fill', 'Average days to fill a role', 'days', false, '{value} days'),
  ('fill_rate', 'Fill Rate', 'Percentage of roles successfully filled', 'percent', true, '{value}%'),
  ('candidate_ghosting_rate', 'Candidate Ghosting Rate', 'Percentage of candidates who disappear', 'percent', false, '{value}%'),
  
  -- Marketing specific
  ('client_concentration_top3', 'Client Concentration (Top 3)', 'Revenue from top 3 clients as %', 'percent', false, '{value}%'),
  ('project_profitability', 'Project Profitability', 'Average margin on campaigns', 'percent', true, '{value}%'),
  ('digital_revenue_percent', 'Digital Revenue %', 'Digital vs traditional revenue split', 'percent', true, '{value}%'),
  ('new_business_win_rate', 'New Business Win Rate', 'Pitch success rate', 'percent', true, '{value}%'),
  ('staff_utilisation', 'Staff Utilisation', 'Billable vs non-billable time', 'percent', true, '{value}%'),
  
  -- Architecture specific
  ('fee_income_per_architect', 'Fee Income per Architect', 'Fees per qualified architect', 'currency', true, '£{value}'),
  ('project_win_rate', 'Project Win Rate', 'Tender success rate', 'percent', true, '{value}%'),
  ('overhead_rate', 'Overhead Rate', 'Overhead as % of direct salary costs', 'percent', false, '{value}%'),
  ('wip_days', 'WIP Days', 'Work in progress days', 'days', false, '{value} days'),
  
  -- Engineering specific
  ('revenue_per_fee_earner', 'Revenue per Fee Earner', 'Revenue per billing engineer', 'currency', true, '£{value}')
ON CONFLICT (code) DO NOTHING;

