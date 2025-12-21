-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 10: CHARITIES & EDUCATION
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5, 6, 7, 8 and 9 have been applied

-- SECTOR CONTEXT NOTE:
-- "Resilience crisis" in 2024
-- Charities: 43% spent more than earned, reserves at dangerous 2 months median
-- Donor retention: 30% first-time, 72% never give again - acquisition 5x more expensive
-- Social Enterprises: 30% made loss, local gov contracts squeezed
-- Training: Achievement rates recovered to 60.5%, margins capped by fixed funding bands

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('CHARITY', 'Charity / Non-Profit', 'charity', 'Charities, non-profit organisations, NGOs, foundations and trusts', ARRAY['88990', '94110', '94120', '94200', '94910', '94920', '94990'], ARRAY['charity', 'non-profit', 'NGO', 'foundation', 'trust'], true),
  ('SOCIAL_ENT', 'Social Enterprise', 'charity', 'Social enterprises, CICs and community interest companies', ARRAY['88990'], ARRAY['social enterprise', 'CIC', 'community interest', 'impact'], true),
  ('EDUCATION', 'Education & Training Provider', 'charity', 'Education and training providers, academies, schools and course providers', ARRAY['85310', '85320', '85410', '85420', '85590'], ARRAY['training', 'education', 'courses', 'academy', 'school'], true)
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
  -- Charity
  ('reserves_months', 'Reserves (Months)', 'Unrestricted reserves as months of expenditure', 'number', true, '{value} months'),
  ('fundraising_cost_percent', 'Fundraising Cost %', 'Cost of generating funds as % of income', 'percent', false, '{value}%'),
  ('admin_cost_ratio', 'Admin Cost Ratio', 'Administrative costs as % of total expenditure', 'percent', false, '{value}%'),
  ('donor_retention_new', 'Donor Retention (New)', 'First-time donor retention rate', 'percent', true, '{value}%'),
  ('donor_retention_regular', 'Donor Retention (Regular)', 'Regular donor retention rate', 'percent', true, '{value}%'),
  ('fundraising_roi', 'Fundraising ROI', 'Return per £1 spent on fundraising', 'ratio', true, '£{value}:£1'),
  ('income_from_public_percent', 'Income from Public %', 'Public donations as % of income', 'percent', true, '{value}%'),
  
  -- Social Enterprise
  ('trading_income_percent', 'Trading Income %', 'Income from trading as % of total', 'percent', true, '{value}%'),
  ('turnover_growth', 'Turnover Growth', 'Year-on-year turnover change', 'percent', true, '{value}%'),
  ('public_sector_revenue_percent', 'Public Sector Revenue %', 'Revenue from public sector as % of total', 'percent', false, '{value}%'),
  
  -- Training Provider
  ('achievement_rate', 'Achievement Rate', 'Percentage of learners achieving qualification', 'percent', true, '{value}%'),
  ('revenue_per_learner', 'Revenue per Learner', 'Average revenue per learner', 'currency', true, '£{value}'),
  ('staff_utilisation', 'Staff Utilisation', 'Trainer/assessor caseload utilisation', 'percent', true, '{value}%'),
  ('admin_cost_percent', 'Admin Cost %', 'Administrative costs as % of revenue', 'percent', false, '{value}%'),
  ('employer_retention', 'Employer Retention', 'Repeat booking rate from employers', 'percent', true, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CHARITIES / NON-PROFITS (CHARITY)
-- Source: NCVO Almanac 2024, Teque Charity Health 2025, Dataro 2024
-- Reliability: Tier 2 | Sample: ~160,000 UK Charities
-- WARNING: 43% spending more than earning, reserves critically low
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Reserves (months) - "Healthy" is 3-6 months, 30% have <6 months
  ('CHARITY', 'reserves_months', 'all', 'all', 2.0, 3.2, 6.0, 160000, 2024, 'NCVO Almanac 2024', 'https://www.ncvo.org.uk', 'high', '2024-03-01', true),
  
  -- Fundraising Cost % ("Cost of Generating Funds" vs Income)
  ('CHARITY', 'fundraising_cost_percent', 'all', 'all', 10, 12, 25, 160000, 2024, 'NCVO Almanac 2024', 'https://www.ncvo.org.uk', 'high', '2024-03-01', true),
  
  -- Admin Cost Ratio (larger charities achieve <5%)
  ('CHARITY', 'admin_cost_ratio', 'all', 'all', 4, 8, 12, 160000, 2024, 'Teque Charity Health 2025', NULL, 'high', '2024-03-01', true),
  
  -- Donor Retention - New (72% of first-time donors never give again)
  ('CHARITY', 'donor_retention_new', 'all', 'all', 20, 27, 35, 160000, 2024, 'Dataro 2024', NULL, 'high', '2024-03-01', true),
  
  -- Donor Retention - Regular (monthly DD donors 2x more loyal)
  ('CHARITY', 'donor_retention_regular', 'all', 'all', 70, 83, 90, 160000, 2024, 'Dataro 2024', NULL, 'high', '2024-03-01', true),
  
  -- Fundraising ROI (return per £1 spent)
  ('CHARITY', 'fundraising_roi', 'all', 'all', 3.0, 4.0, 6.0, 160000, 2024, 'NCVO Almanac 2024', 'https://www.ncvo.org.uk', 'high', '2024-03-01', true),
  
  -- Income from Public % (public donations = largest income source)
  ('CHARITY', 'income_from_public_percent', 'all', 'all', 30, 48, 70, 160000, 2024, 'NCVO Almanac 2024', 'https://www.ncvo.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('CHARITY', 'employee_turnover', 'all', 'all', 12, 18, 25, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SOCIAL ENTERPRISES (SOCIAL_ENT)
-- Source: Social Enterprise UK Barometer 2024, SEUK State of Social Enterprise
-- Reliability: Tier 2 | Sample: UK Social Enterprise Sector (~100k businesses)
-- NOTE: 30% made loss in 2024 (up from 26%), local gov contracts squeezed
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Trading Income % (majority income must come from trade)
  ('SOCIAL_ENT', 'trading_income_percent', 'all', 'all', 50, 75, 95, 100000, 2024, 'SEUK State of Social Enterprise', 'https://www.socialenterprise.org.uk', 'high', '2024-03-01', true),
  
  -- Turnover Growth (50% grew in 2024, down from 65% in 2023)
  ('SOCIAL_ENT', 'turnover_growth', 'all', 'all', -5, 0, 10, 100000, 2024, 'SEUK Barometer 2024', 'https://www.socialenterprise.org.uk', 'high', '2024-03-01', true),
  
  -- Public Sector Revenue % (52% trade with local gov, 19% rely on it heavily)
  ('SOCIAL_ENT', 'public_sector_revenue_percent', 'all', 'all', 0, 19, 52, 100000, 2024, 'SEUK State of Social Enterprise', 'https://www.socialenterprise.org.uk', 'high', '2024-03-01', true),
  
  -- Employee Turnover
  ('SOCIAL_ENT', 'employee_turnover', 'all', 'all', 10, 15, 22, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TRAINING PROVIDERS / EDUCATION (EDUCATION)
-- Source: AELP 2024/25, RSM Financial Handbook
-- Reliability: Tier 2 | Sample: ~1,000 Independent Training Providers
-- NOTE: Achievement rates recovered to 60.5%, margins capped by fixed funding bands
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Achievement Rate (apprenticeships, target is 67%)
  ('EDUCATION', 'achievement_rate', 'all', 'all', 52, 60.5, 67, 1000, 2024, 'AELP 2024/25', 'https://www.aelp.org.uk', 'high', '2024-03-01', true),
  
  -- Revenue per Learner (varies by Standard - Care vs Engineering)
  ('EDUCATION', 'revenue_per_learner', 'all', 'all', 3000, 6000, 12000, 1000, 2024, 'AELP 2024/25', 'https://www.aelp.org.uk', 'high', '2024-03-01', true),
  
  -- Staff Utilisation (trainer/assessor caseload)
  ('EDUCATION', 'staff_utilisation', 'all', 'all', 65, 75, 85, 1000, 2024, 'RSM Financial Handbook', NULL, 'medium', '2024-03-01', true),
  
  -- Admin Cost % (compliance burden from ESFA rules is high)
  ('EDUCATION', 'admin_cost_percent', 'all', 'all', 15, 20, 25, 1000, 2024, 'RSM Financial Handbook', NULL, 'medium', '2024-03-01', true),
  
  -- Repeat Business from Employers (key for Levy account growth)
  ('EDUCATION', 'employer_retention', 'all', 'all', 40, 60, 80, 1000, 2024, 'AELP 2024/25', 'https://www.aelp.org.uk', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('EDUCATION', 'employee_turnover', 'all', 'all', 12, 18, 25, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (government funding cycles)
  ('EDUCATION', 'debtor_days', 'all', 'all', 30, 45, 60, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Charity Reserves Crisis',
  'research',
  ARRAY['CHARITY'],
  ARRAY['reserves_months', 'donor_retention_new'],
  'urgent',
  'pending',
  'CRITICAL: 43% of charities spent more than earned in 2023/24. Median reserves at dangerous 2-3 months. 72% of first-time donors never give again (acquisition 5x more expensive than retention). Monitor for sector consolidation/closures.',
  '2025-03-01'
),
(
  'Social Enterprise Loss Trend',
  'research',
  ARRAY['SOCIAL_ENT'],
  ARRAY['public_sector_revenue_percent'],
  'medium',
  'pending',
  '30% made loss in 2024 (up from 26%). Local government contract squeeze is key driver. 19% heavily reliant on public sector revenue. Monitor for continued deterioration.',
  '2025-06-01'
);

