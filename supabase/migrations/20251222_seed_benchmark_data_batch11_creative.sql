-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 11: CREATIVE INDUSTRIES
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3, 4, 5, 6, 7, 8, 9 and 10 have been applied

-- SECTOR CONTEXT NOTE:
-- "Correction year" in 2024
-- Agencies: Revenue growth sluggish (+1.4%), profits halved, clients moving in-house
-- Staff turnover dropped to 24.9% as "Great Resignation" ended
-- Production: "Peak TV" bubble deflated, drama commissions -2.8%
-- Secondary rights revenue surged +17% (sweating existing assets)
-- Freelance day rates stagnated while inflation rose

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('DESIGN', 'Graphic & Brand Design', 'creative', 'Graphic design, branding, logo design and creative design services', ARRAY['74100'], ARRAY['design', 'graphic design', 'branding', 'logo', 'creative'], true),
  ('PHOTO', 'Photography & Videography', 'creative', 'Photography, videography, film production and content creation services', ARRAY['74201', '59111'], ARRAY['photographer', 'videographer', 'film', 'production', 'content creation'], true),
  ('MEDIA', 'Media Production', 'creative', 'Media production, film, TV, broadcast and production services', ARRAY['59111', '59112', '59120'], ARRAY['production', 'film', 'TV', 'broadcast', 'media'], true)
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
  -- Design Agency
  ('fee_income_per_head', 'Fee Income per Head', 'Total fee income divided by headcount', 'currency', true, '£{value}'),
  ('staff_cost_ratio', 'Staff Cost Ratio', 'Total staff costs as % of gross income', 'percent', false, '{value}%'),
  ('new_business_percent', 'New Business %', 'Revenue from new clients as % of total', 'percent', true, '{value}%'),
  
  -- Photography / Video
  ('photographer_day_rate', 'Photographer Day Rate', 'Day rate for photographer (time only)', 'currency', true, '£{value}'),
  ('videographer_day_rate', 'Videographer Day Rate', 'Day rate for videographer/camera operator', 'currency', true, '£{value}'),
  ('usage_fee_bur', 'Usage Fee (BUR)', 'Base Usage Rate as % of day rate', 'percent', true, '{value}%'),
  ('producer_markup', 'Producer Mark-up', 'Production company mark-up on budget', 'percent', true, '{value}%'),
  ('first_ad_day_rate', '1st AD Day Rate', 'Day rate for First Assistant Director', 'currency', true, '£{value}'),
  ('equipment_utilisation', 'Equipment Utilisation', 'Percentage of days equipment is in use', 'percent', true, '{value}%'),
  
  -- Media Production
  ('cost_per_hour_drama', 'Cost per Hour (Drama)', 'Production cost per broadcast hour - drama', 'currency', false, '£{value}'),
  ('cost_per_hour_factual', 'Cost per Hour (Factual)', 'Production cost per broadcast hour - factual', 'currency', false, '£{value}'),
  ('primary_rights_percent', 'Primary Rights %', 'Revenue from primary commission as % of total', 'percent', false, '{value}%'),
  ('international_sales_percent', 'International Sales %', 'Revenue from international sales as % of total', 'percent', true, '{value}%'),
  ('producer_margin', 'Producer Margin', 'Production fee as % of budget', 'percent', true, '{value}%')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. DESIGN AGENCIES (DESIGN)
-- Source: DBA Annual Survey 2024, IPA Agency Census 2024, The Wow Company
-- Reliability: Tier 2 | Sample: ~400 UK Design & Creative Agencies
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Fee Income per Head (profitable firms target £100k+)
  ('DESIGN', 'fee_income_per_head', 'all', 'all', 66000, 74500, 110000, 400, 2024, 'DBA Annual Survey 2024', 'https://www.dba.org.uk', 'high', '2024-03-01', true),
  
  -- Net Profit Margin (compressed in 2024, top tier targets 20%+)
  ('DESIGN', 'net_margin', 'all', 'all', 6.0, 12.0, 20.0, 400, 2024, 'DBA Annual Survey 2024', 'https://www.dba.org.uk', 'high', '2024-03-01', true),
  
  -- Utilisation (billable hours)
  ('DESIGN', 'utilisation_rate', 'all', 'all', 50, 65, 75, 400, 2024, 'The Wow Company', NULL, 'high', '2024-03-01', true),
  
  -- Staff Turnover (dropped from 31.5% in 2023, redundancy = 12% of exits)
  ('DESIGN', 'employee_turnover', 'all', 'all', 15, 24.9, 35, 400, 2024, 'IPA Agency Census 2024', 'https://www.ipa.co.uk', 'high', '2024-03-01', true),
  
  -- Debtor Days (58% of invoices paid late)
  ('DESIGN', 'debtor_days', 'all', 'all', 40, 52, 65, 400, 2024, 'DBA Annual Survey 2024', 'https://www.dba.org.uk', 'high', '2024-03-01', true),
  
  -- Staff Cost Ratio (total staff inc. freelancers as % of Gross Income)
  ('DESIGN', 'staff_cost_ratio', 'all', 'all', 50, 59, 65, 400, 2024, 'DBA Annual Survey 2024', 'https://www.dba.org.uk', 'high', '2024-03-01', true),
  
  -- New Business % (% of revenue from new clients won that year)
  ('DESIGN', 'new_business_percent', 'all', 'all', 10, 29, 40, 400, 2024, 'DBA Annual Survey 2024', 'https://www.dba.org.uk', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PHOTOGRAPHY / VIDEO PRODUCTION (PHOTO)
-- Source: AOP / APA Rate Cards 2024, Industry Rate Surveys
-- Reliability: Tier 3 | Sample: Freelance & Production Company Rates
-- NOTE: Day rates stagnated while inflation rose
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Photographer Day Rate (commercial - editorial is £250-£400)
  ('PHOTO', 'photographer_day_rate', 'all', 'all', 400, 650, 1200, NULL, 2024, 'AOP Rate Cards 2024', 'https://www.the-aop.org', 'medium', '2024-03-01', true),
  
  -- Videographer Day Rate (solo shooter, production crew higher)
  ('PHOTO', 'videographer_day_rate', 'all', 'all', 350, 450, 800, NULL, 2024, 'Industry Rate Surveys', NULL, 'medium', '2024-03-01', true),
  
  -- Usage Fee / Base Usage Rate (% of day fee)
  ('PHOTO', 'usage_fee_bur', 'all', 'all', 50, 100, 300, NULL, 2024, 'AOP Rate Cards 2024', 'https://www.the-aop.org', 'medium', '2024-03-01', true),
  
  -- Producer Mark-up (standard on budget items)
  ('PHOTO', 'producer_markup', 'all', 'all', 10, 20, 25, NULL, 2024, 'APA Rate Cards 2024', 'https://www.a-p-a.net', 'medium', '2024-03-01', true),
  
  -- 1st AD Day Rate (APA Commercial rate = £1,510/day)
  ('PHOTO', 'first_ad_day_rate', 'all', 'all', 600, 800, 1510, NULL, 2024, 'APA Rate Cards 2024', 'https://www.a-p-a.net', 'high', '2024-03-01', true),
  
  -- Equipment Utilisation (high idle time for owner-operators)
  ('PHOTO', 'equipment_utilisation', 'all', 'all', 20, 40, 60, NULL, 2024, 'Industry estimate', NULL, 'low', '2024-03-01', true),
  
  -- Debtor Days
  ('PHOTO', 'debtor_days', 'all', 'all', 30, 45, 75, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. MEDIA PRODUCTION / BROADCASTING (MEDIA)
-- Source: Pact Census 2024, Broadcast Magazine
-- Reliability: Tier 2 | Sample: UK Independent Production Sector (£3.66bn turnover)
-- NOTE: "Peak TV" deflated, drama commissions -2.8%, secondary rights +17%
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Cost per Hour (Drama) - Domestic PSB ~£1.1m, HETV £2m+
  ('MEDIA', 'cost_per_hour_drama', 'all', 'all', 800000, 1200000, 2500000, NULL, 2024, 'Pact Census 2024', 'https://www.pact.co.uk', 'high', '2024-03-01', true),
  
  -- Cost per Hour (Factual) - Premium docu-series skews higher
  ('MEDIA', 'cost_per_hour_factual', 'all', 'all', 50000, 150000, 350000, NULL, 2024, 'Pact Census 2024', 'https://www.pact.co.uk', 'high', '2024-03-01', true),
  
  -- Primary Rights % (% of revenue from primary commission)
  ('MEDIA', 'primary_rights_percent', 'all', 'all', 70, 83, 90, NULL, 2024, 'Pact Census 2024', 'https://www.pact.co.uk', 'high', '2024-03-01', true),
  
  -- International Sales % (SVOD commissions rose to £850m)
  ('MEDIA', 'international_sales_percent', 'all', 'all', 5, 15, 35, NULL, 2024, 'Pact Census 2024', 'https://www.pact.co.uk', 'high', '2024-03-01', true),
  
  -- Producer Margin (broadcasters cap at 10%)
  ('MEDIA', 'producer_margin', 'all', 'all', 5, 10, 10, NULL, 2024, 'Broadcast Magazine', NULL, 'high', '2024-03-01', true),
  
  -- Debtor Days (broadcaster payment terms)
  ('MEDIA', 'debtor_days', 'all', 'all', 45, 60, 90, NULL, 2024, 'Pact Census 2024', 'https://www.pact.co.uk', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'Design Agency Margin Compression',
  'research',
  ARRAY['DESIGN'],
  ARRAY['net_margin', 'fee_income_per_head'],
  'medium',
  'pending',
  'Revenue growth sluggish (+1.4%), profits halved as clients moved projects in-house. Staff turnover dropped to 24.9% (from 31.5%) but redundancy rose to 12% of exits. Monitor for continued margin pressure.',
  '2025-06-01'
),
(
  'Freelance Rate Stagnation',
  'research',
  ARRAY['PHOTO'],
  ARRAY['photographer_day_rate', 'videographer_day_rate'],
  'medium',
  'pending',
  'Day rates have stagnated for several years while inflation rose. Commercial photographer base rate remains £600-£800 unchanged. Usage fees remain the key value driver. Consider adding inflation-adjusted real rate tracking.',
  '2025-06-01'
),
(
  'Peak TV Deflation',
  'research',
  ARRAY['MEDIA'],
  ARRAY['cost_per_hour_drama', 'primary_rights_percent'],
  'medium',
  'pending',
  '"Peak TV" bubble deflated. Domestic drama commissions -2.8%. Secondary rights revenue surged +17% as producers sweat existing assets. Rights retention strategy increasingly critical. SVOD commissions £850m.',
  '2025-06-01'
);

