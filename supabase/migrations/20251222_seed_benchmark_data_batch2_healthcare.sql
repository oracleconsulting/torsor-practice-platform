-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 2: HEALTHCARE
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration and batch 1 have been applied

-- SECTOR CONTEXT NOTE:
-- Healthcare sector shows divergence between private and public-funded streams.
-- Private dentistry and vet maintain 70%+ gross margins but net margins tightening
-- due to wage inflation (staff costs often exceeding 45% of revenue).
-- Care homes recovered to 88%+ occupancy. Pharmacies face margin compression.

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('DENTAL', 'Dental Practice', 'healthcare', 'Dental practices, orthodontics and oral health services', ARRAY['86230'], ARRAY['dentist', 'dental', 'orthodontics', 'oral health'], true),
  ('VET', 'Veterinary Practice', 'healthcare', 'Veterinary practices, animal health and pet care', ARRAY['75000'], ARRAY['vet', 'veterinary', 'animal', 'pet'], true),
  ('OPTOM', 'Optometry Practice', 'healthcare', 'Optometry practices, eye care and vision services', ARRAY['86900'], ARRAY['optician', 'optometrist', 'eye care', 'glasses', 'contact lenses'], true),
  ('CARE', 'Care Home / Domiciliary Care', 'healthcare', 'Care homes, nursing homes, domiciliary care and elderly care', ARRAY['87100', '87200', '87300', '88100'], ARRAY['care home', 'nursing home', 'domiciliary', 'home care', 'elderly care'], true),
  ('PRIVATE_HEALTH', 'Private Healthcare / Clinic', 'healthcare', 'Private hospitals, clinics, cosmetic and specialist healthcare', ARRAY['86210', '86220', '86900'], ARRAY['clinic', 'private hospital', 'cosmetic', 'aesthetics', 'specialist'], true),
  ('PHARMA', 'Pharmacy', 'healthcare', 'Community pharmacies, dispensing and prescription services', ARRAY['47730'], ARRAY['pharmacy', 'chemist', 'dispensing', 'prescription'], true),
  ('FITNESS', 'Gym / Fitness', 'healthcare', 'Gyms, fitness centres, health clubs and personal training', ARRAY['93130'], ARRAY['gym', 'fitness', 'personal trainer', 'health club', 'studio'], true)
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
  -- Dental
  ('revenue_per_principal', 'Revenue per Principal', 'Net profit per practice principal/owner', 'currency', true, '£{value}'),
  ('expense_ratio', 'Expense Ratio', 'Total costs as percentage of fees', 'percent', false, '{value}%'),
  ('ebitda_margin', 'EBITDA Margin', 'Earnings before interest, tax, depreciation, amortisation', 'percent', true, '{value}%'),
  ('associate_remuneration', 'Associate Remuneration', 'Average associate dentist earnings', 'currency', true, '£{value}'),
  ('uda_value', 'UDA Value', 'Value per Unit of Dental Activity (NHS)', 'currency', true, '£{value}'),
  ('hygiene_revenue_percent', 'Hygiene Revenue %', 'Hygiene services as percentage of revenue', 'percent', true, '{value}%'),
  
  -- Veterinary
  ('revenue_per_vet', 'Revenue per Vet', 'Revenue per FTE veterinarian', 'currency', true, '£{value}'),
  ('staff_cost_percent', 'Staff Cost %', 'Staff costs as percentage of revenue', 'percent', false, '{value}%'),
  ('fee_to_drug_ratio', 'Fee to Drug Ratio', 'Professional fees vs drug sales ratio', 'ratio', true, '{value}'),
  ('active_client_growth', 'Active Client Growth', 'Year-on-year change in active clients', 'percent', true, '{value}%'),
  ('revenue_growth', 'Revenue Growth', 'Year-on-year revenue growth', 'percent', true, '{value}%'),
  
  -- Optometry
  ('revenue_per_practice', 'Revenue per Practice', 'Total practice revenue', 'currency', true, '£{value}'),
  ('sight_test_conversion_rate', 'Sight Test Conversion', 'Sight test to dispense conversion rate', 'percent', true, '{value}%'),
  ('nhs_revenue_percent', 'NHS Revenue %', 'NHS-funded revenue as percentage', 'percent', false, '{value}%'),
  ('clinical_vs_retail_split', 'Clinical vs Retail Split', 'Clinical revenue as % of total', 'percent', true, '{value}%'),
  
  -- Care Homes
  ('occupancy_rate', 'Occupancy Rate', 'Percentage of beds occupied', 'percent', true, '{value}%'),
  ('weekly_fee', 'Weekly Fee', 'Average fee per resident per week', 'currency', true, '£{value}'),
  ('ebitdarm_margin', 'EBITDARM Margin', 'Earnings before interest, tax, dep, amort, rent, management', 'percent', true, '{value}%'),
  ('agency_staff_percent', 'Agency Staff %', 'Agency staff as percentage of workforce', 'percent', false, '{value}%'),
  ('cqc_rating_margin_outstanding', 'CQC Outstanding Margin', 'Margin for Outstanding-rated homes', 'percent', true, '{value}%'),
  ('cqc_rating_margin_inadequate', 'CQC Inadequate Margin', 'Margin for Inadequate-rated homes', 'percent', true, '{value}%'),
  
  -- Private Healthcare
  ('ebit_margin', 'EBIT Margin', 'Operating profit margin', 'percent', true, '{value}%'),
  ('revenue_per_consultant', 'Revenue per Consultant', 'Revenue per consulting clinician', 'currency', true, '£{value}'),
  
  -- Pharmacy
  ('monthly_items_dispensed', 'Monthly Items Dispensed', 'NHS prescription items per month', 'number', true, '{value}'),
  ('services_revenue_percent', 'Services Revenue %', 'Non-dispensing services as % of revenue', 'percent', true, '{value}%'),
  ('locum_hourly_rate', 'Locum Hourly Rate', 'Locum pharmacist hourly rate', 'currency', false, '£{value}/hr'),
  ('prescription_margin_per_item', 'Prescription Margin per Item', 'Net margin per dispensed item', 'currency', true, '£{value}'),
  
  -- Fitness
  ('member_retention', 'Member Retention', 'Annual member retention rate', 'percent', true, '{value}%'),
  ('revenue_per_member', 'Revenue per Member', 'Annual revenue per member', 'currency', true, '£{value}'),
  ('members_per_gym', 'Members per Gym', 'Average membership per location', 'number', true, '{value}'),
  ('secondary_spend_percent', 'Secondary Spend %', 'Non-membership revenue as %', 'percent', true, '{value}%'),
  ('yield_per_sqft', 'Yield per Sq Ft', 'Revenue per square foot', 'currency', true, '£{value}'),
  ('market_penetration', 'Market Penetration', 'Population with gym membership', 'percent', true, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. DENTAL PRACTICES (DENTAL)
-- Source: NASDAL Benchmarking Report 2024, Dental Elite Goodwill Report 2024
-- Reliability: Tier 2 | Sample: ~600-700 practices
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Principal (used as proxy for revenue per senior employee)
  ('DENTAL', 'revenue_per_principal', 'all', 'all', 141000, 165871, 190000, 650, 2024, 'NASDAL Benchmarking Report 2024', 'https://www.nasdal.org.uk', 'high', '2024-03-01', true),
  
  -- Net Margin (derived from expense ratio: 100% - 73.3% = 26.7%)
  ('DENTAL', 'net_margin', 'all', 'all', 22, 26.7, 35, 650, 2024, 'NASDAL Benchmarking Report 2024', 'https://www.nasdal.org.uk', 'high', '2024-03-01', true),
  
  -- EBITDA Margin (segmented by ownership model - using 'all' as revenue_band doesn't fit)
  ('DENTAL', 'ebitda_margin', 'all', 'all', 18, 20.8, 33, 650, 2024, 'Dental Elite Goodwill Report 2024', 'https://www.dentalelite.co.uk', 'high', '2024-03-01', true),
  
  -- Expense Ratio (costs as % of fees - inverse of margin)
  ('DENTAL', 'expense_ratio', 'all', 'all', 65, 73.3, 78, 650, 2024, 'NASDAL Benchmarking Report 2024', 'https://www.nasdal.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('DENTAL', 'employee_turnover', 'all', 'all', 15, 20, 30, 650, 2024, 'NASDAL Benchmarking Report 2024', 'https://www.nasdal.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (payment at point of service for private)
  ('DENTAL', 'debtor_days', 'all', 'all', 2, 5, 10, NULL, 2024, 'Industry standard (payment at service)', NULL, 'medium', '2024-03-01', true);

-- Dental Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('DENTAL', 'associate_remuneration', 'all', 'all', 75000, 90161, 110000, 650, 2024, 'NASDAL Benchmarking Report 2024', 'high', '2024-03-01', true),
  ('DENTAL', 'uda_value', 'all', 'all', 28, 32, 38, 650, 2024, 'NASDAL Benchmarking Report 2024', 'high', '2024-03-01', true),
  ('DENTAL', 'hygiene_revenue_percent', 'all', 'all', 8, 13.5, 20, 650, 2024, 'NASDAL Benchmarking Report 2024', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. VETERINARY PRACTICES (VET)
-- Source: SPVS/VMG Profitability Survey 2024 (using 2023 data), Vet Dynamics Index
-- Reliability: Tier 2 | Sample: ~350-500 practices
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per FTE Vet
  ('VET', 'revenue_per_vet', 'all', 'all', 250000, 320000, 400000, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'medium', '2024-03-01', true),
  
  -- Gross Margin (Small Animal - using 'all' as revenue_band)
  ('VET', 'gross_margin', 'all', 'all', 70, 75.5, 78, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'high', '2024-03-01', true),
  
  -- Staff Costs as % of Revenue
  ('VET', 'staff_cost_percent', 'all', 'all', 40, 47.1, 55, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'high', '2024-03-01', true),
  
  -- EBITDA Margin (Small Animal - using 'all' as revenue_band)
  ('VET', 'ebitda_margin', 'all', 'all', 8, 17.0, 23, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'high', '2024-03-01', true),
  
  -- Net Margin
  ('VET', 'net_margin', 'all', 'all', 5, 11.9, 18, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'high', '2024-03-01', true),
  
  -- Revenue Growth
  ('VET', 'revenue_growth', 'all', 'all', 5, 15, 20, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (payment at point of service)
  ('VET', 'debtor_days', 'all', 'all', 2, 5, 10, NULL, 2024, 'Industry standard (payment at service)', NULL, 'medium', '2024-03-01', true),
  
  -- Client Growth
  ('VET', 'active_client_growth', 'all', 'all', -2, 0, 3, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'https://www.spvs.org.uk', 'medium', '2024-03-01', true);

-- Vet Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('VET', 'fee_to_drug_ratio', 'all', 'all', 0.45, 0.54, 0.65, 425, 2024, 'SPVS/VMG Profitability Survey 2024', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. OPTOMETRY PRACTICES (OPTOM)
-- Source: Myers La Roche Valuation Guide 2024, FODO Annual Report 2023
-- Reliability: Tier 3 | Sample: Industry aggregates
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue per Practice
  ('OPTOM', 'revenue_per_practice', 'all', 'all', 350000, 550000, 800000, NULL, 2024, 'Myers La Roche Valuation Guide 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Gross Margin
  ('OPTOM', 'gross_margin', 'all', 'all', 65, 70, 75, NULL, 2024, 'Myers La Roche Valuation Guide 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Net Margin (adjusted for director drawings)
  ('OPTOM', 'net_margin', 'all', 'all', 12, 18, 22, NULL, 2024, 'Myers La Roche Valuation Guide 2024', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (payment at point of service)
  ('OPTOM', 'debtor_days', 'all', 'all', 2, 5, 10, NULL, 2024, 'Industry standard (payment at service)', NULL, 'medium', '2024-03-01', true);

-- Optometry Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('OPTOM', 'sight_test_conversion_rate', 'all', 'all', 45, 57.5, 70, NULL, 2024, 'Myers La Roche Valuation Guide 2024', 'medium', '2024-03-01', true),
  ('OPTOM', 'nhs_revenue_percent', 'all', 'all', 20, 50, 80, NULL, 2024, 'FODO Annual Report 2023', 'medium', '2024-03-01', true),
  ('OPTOM', 'clinical_vs_retail_split', 'all', 'all', 20, 30, 40, NULL, 2024, 'Myers La Roche Valuation Guide 2024', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CARE HOMES (CARE)
-- Source: Knight Frank UK Care Homes Trading Performance Review 2024, LaingBuisson
-- Reliability: Tier 3 | Sample: 100,000+ beds (80% of corporate market)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Occupancy Rate (highest since 2019 - full recovery)
  ('CARE', 'occupancy_rate', 'all', 'all', 82, 88.3, 95, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'https://www.knightfrank.co.uk', 'high', '2024-03-01', true),
  
  -- Average Weekly Fee (all types)
  ('CARE', 'weekly_fee', 'all', 'all', 908, 1182, 1594, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'https://www.knightfrank.co.uk', 'high', '2024-03-01', true),
  
  -- EBITDARM Margin (Earnings Before Interest, Tax, Dep, Amort, Rent, Management)
  ('CARE', 'ebitdarm_margin', 'all', 'all', 18, 26.1, 32, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'https://www.knightfrank.co.uk', 'high', '2024-03-01', true),
  
  -- Staff Costs as % of Revenue
  ('CARE', 'staff_cost_percent', 'all', 'all', 50, 59, 65, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'https://www.knightfrank.co.uk', 'high', '2024-03-01', true),
  
  -- Agency Staff Usage (stabilising but still a margin drag)
  ('CARE', 'agency_staff_percent', 'all', 'all', 2, 8, 15, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'https://www.knightfrank.co.uk', 'medium', '2024-03-01', true),
  
  -- Employee Turnover (highest in healthcare sector)
  ('CARE', 'employee_turnover', 'all', 'all', 25, 30, 40, NULL, 2024, 'Skills for Care workforce data', 'https://www.skillsforcare.org.uk', 'medium', '2024-03-01', true),
  
  -- Debtor Days (LA and NHS funded have longer payment cycles)
  ('CARE', 'debtor_days', 'all', 'all', 30, 45, 60, NULL, 2024, 'LaingBuisson', 'https://www.laingbuisson.com', 'medium', '2024-03-01', true);

-- Care Home Industry-Specific Metrics (nursing/personal_care segments commented out as they don't fit revenue_band schema)
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  -- CQC Rating Premium (Outstanding = 30% margin vs Inadequate = 2%)
  ('CARE', 'cqc_rating_margin_outstanding', 'all', 'all', 25, 30, 35, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'medium', '2024-03-01', true),
  ('CARE', 'cqc_rating_margin_inadequate', 'all', 'all', 0, 2, 5, NULL, 2024, 'Knight Frank UK Care Homes Trading Performance Review 2024', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PRIVATE HEALTHCARE / CLINICS (PRIVATE_HEALTH)
-- Source: Spire Healthcare Annual Report 2023, LaingBuisson Private Acute Market 2024
-- Reliability: Tier 3 | Sample: Major hospital groups (proxy for sector)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Revenue Growth
  ('PRIVATE_HEALTH', 'revenue_growth', 'all', 'all', 5, 13.4, 15, NULL, 2024, 'Spire Healthcare Annual Report 2023', 'https://www.spirehealthcare.com', 'high', '2024-03-01', true),
  
  -- Gross Margin
  ('PRIVATE_HEALTH', 'gross_margin', 'all', 'all', 42, 45.9, 50, NULL, 2024, 'Spire Healthcare Annual Report 2023', 'https://www.spirehealthcare.com', 'high', '2024-03-01', true),
  
  -- EBITDA Margin
  ('PRIVATE_HEALTH', 'ebitda_margin', 'all', 'all', 12, 17.6, 20, NULL, 2024, 'Spire Healthcare Annual Report 2023', 'https://www.spirehealthcare.com', 'high', '2024-03-01', true),
  
  -- EBIT Margin (Operating Profit)
  ('PRIVATE_HEALTH', 'ebit_margin', 'all', 'all', 6, 9.9, 12, NULL, 2024, 'Spire Healthcare Annual Report 2023', 'https://www.spirehealthcare.com', 'high', '2024-03-01', true),
  
  -- Revenue per Consultant
  ('PRIVATE_HEALTH', 'revenue_per_consultant', 'all', 'all', 150000, 250000, 400000, NULL, 2024, 'LaingBuisson Private Acute Market 2024', 'https://www.laingbuisson.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (PMI insurers pay on slower cycles)
  ('PRIVATE_HEALTH', 'debtor_days', 'all', 'all', 40, 50, 65, NULL, 2024, 'Spire Healthcare Annual Report 2023', 'https://www.spirehealthcare.com', 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. PHARMACIES (PHARMA)
-- Source: Christie & Co Pharmacy Market Review 2024, NHSBSA Data
-- Reliability: Tier 1 (Government) & Tier 3 (Brokerage)
-- NOTE: Sector facing significant margin compression
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Monthly Items Dispensed
  ('PHARMA', 'monthly_items_dispensed', 'all', 'all', 5000, 7000, 9000, NULL, 2024, 'NHSBSA Data', 'https://www.nhsbsa.nhs.uk', 'high', '2024-03-01', true),
  
  -- Gross Margin (declining ~1.7% YoY, some report 5-7% drops)
  ('PHARMA', 'gross_margin', 'all', 'all', 28, 31.9, 34, NULL, 2024, 'Christie & Co Pharmacy Market Review 2024', 'https://www.christie.com', 'high', '2024-03-01', true),
  
  -- Services Revenue % (growing reliance on Pharmacy First/Flu jabs)
  ('PHARMA', 'services_revenue_percent', 'all', 'all', 5, 10, 15, NULL, 2024, 'Christie & Co Pharmacy Market Review 2024', 'https://www.christie.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (NHS payments)
  ('PHARMA', 'debtor_days', 'all', 'all', 25, 30, 40, NULL, 2024, 'Industry standard', NULL, 'medium', '2024-03-01', true);

-- Pharmacy Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('PHARMA', 'locum_hourly_rate', 'all', 'all', 30, 40, 50, NULL, 2024, 'Christie & Co Pharmacy Market Review 2024', 'medium', '2024-03-01', true),
  ('PHARMA', 'prescription_margin_per_item', 'all', 'all', 0.90, 1.20, 1.50, NULL, 2024, 'Industry estimate', 'low', '2024-03-01', true);

-- Add context note about pharmacy margin compression
INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES (
  'Pharmacy Margin Monitoring',
  'research',
  ARRAY['PHARMA'],
  ARRAY['gross_margin', 'net_margin'],
  'normal',
  'pending',
  'Pharmacy sector facing significant margin compression (1.7-7% YoY declines reported). Monitor for further deterioration and update benchmarks accordingly. National Living Wage increases creating additional pressure.',
  '2025-06-01'
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. GYMS & FITNESS (FITNESS)
-- Source: Leisure DB State of the UK Fitness Industry 2024, Clubwise
-- Reliability: Tier 3 | Sample: 7,009 gyms
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Member Retention Rate (NOTE: 50% quit in first 6 months)
  ('FITNESS', 'member_retention', 'all', 'all', 50, 60, 75, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'https://www.leisuredb.com', 'high', '2024-03-01', true),
  
  -- Revenue per Member (blended across models)
  ('FITNESS', 'revenue_per_member', 'all', 'all', 300, 550, 800, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'https://www.leisuredb.com', 'high', '2024-03-01', true),
  
  -- Members per Gym
  ('FITNESS', 'members_per_gym', 'all', 'all', 800, 1400, 2500, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'https://www.leisuredb.com', 'high', '2024-03-01', true),
  
  -- Secondary Spend (PT, Retail, F&B as % of total)
  ('FITNESS', 'secondary_spend_percent', 'all', 'all', 5, 15, 25, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'https://www.leisuredb.com', 'medium', '2024-03-01', true),
  
  -- Yield per sq ft
  ('FITNESS', 'yield_per_sqft', 'all', 'all', 15, 25, 40, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'https://www.leisuredb.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (membership payments typically direct debit)
  ('FITNESS', 'debtor_days', 'all', 'all', 2, 5, 10, NULL, 2024, 'Industry standard (DD payments)', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover (instructors often freelance)
  ('FITNESS', 'employee_turnover', 'all', 'all', 25, 35, 50, NULL, 2024, 'Clubwise industry data', NULL, 'medium', '2024-03-01', true);

-- Fitness Industry-Specific Metrics
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('FITNESS', 'market_penetration', 'all', 'all', 14, 15.9, 18, 7009, 2024, 'Leisure DB State of the UK Fitness Industry 2024', 'high', '2024-03-01', true);

