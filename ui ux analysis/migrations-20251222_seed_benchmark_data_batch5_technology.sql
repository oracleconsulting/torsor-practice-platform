-- ═══════════════════════════════════════════════════════════════════════════════
-- BENCHMARK SEED DATA - BATCH 5: TECHNOLOGY
-- Source: Perplexity Research, December 2024
-- ═══════════════════════════════════════════════════════════════════════════════

-- Run this AFTER the main schema migration, batch 1, 2, 3 and 4 have been applied

-- SECTOR CONTEXT NOTE:
-- "Growth at all costs" era is OVER. 2024 = pivot to efficiency and profitability.
-- SaaS: ARR per employee rose to £120k+ as firms shed headcount
-- NRR dipped to ~100-110% as customers consolidated tools
-- Agencies: "Bench time crisis" cost sector £3bn+ (utilisation dropped to ~70%)
-- E-commerce: Conversion rates fell while CAC soared - LTV > new customer growth

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIRST: INSERT INDUSTRIES
-- Ensure all industry codes exist before inserting benchmark data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES
  ('SAAS', 'SaaS / Software Products', 'technology', 'Software as a Service, subscription software products and platforms', ARRAY['62011', '62012'], ARRAY['SaaS', 'software', 'subscription', 'platform', 'app'], true),
  ('AGENCY_DEV', 'Software Development Agency', 'technology', 'Software development agencies, web development and app development services', ARRAY['62020'], ARRAY['software development', 'web development', 'app development', 'coding', 'programming'], true),
  ('ITSERV', 'IT Services & MSP', 'technology', 'IT support, managed services providers, helpdesk and infrastructure services', ARRAY['62020', '62030', '62090'], ARRAY['IT support', 'managed services', 'MSP', 'helpdesk', 'infrastructure'], true),
  ('ECOMM', 'E-commerce & Online Retail', 'technology', 'E-commerce stores, online retail, dropshipping and marketplace sellers', ARRAY['47910'], ARRAY['ecommerce', 'online shop', 'dropshipping', 'amazon seller', 'shopify'], true)
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
  -- SaaS
  ('arr_growth', 'ARR Growth', 'Year-on-year Annual Recurring Revenue growth', 'percent', true, '{value}%'),
  ('nrr', 'Net Revenue Retention', 'Revenue from existing customers incl. expansion/churn', 'percent', true, '{value}%'),
  ('arr_per_employee', 'ARR per Employee', 'Annual recurring revenue per employee', 'currency', true, '£{value}'),
  ('cac_payback_months', 'CAC Payback', 'Months to recover customer acquisition cost', 'number', false, '{value} months'),
  ('logo_churn', 'Logo Churn', 'Annual customer (logo) churn rate', 'percent', false, '{value}%'),
  ('rule_of_40', 'Rule of 40', 'Growth rate + profit margin (40+ is excellent)', 'percent', true, '{value}%'),
  ('gross_margin_services', 'Gross Margin (Services)', 'Gross margin on professional services', 'percent', true, '{value}%'),
  
  -- Software Agency
  ('hourly_rate_blended', 'Hourly Rate (Blended)', 'Average hourly rate across all staff', 'currency', true, '£{value}/hr'),
  ('hourly_rate_senior', 'Hourly Rate (Senior)', 'Hourly rate for senior developers', 'currency', true, '£{value}/hr'),
  ('hourly_rate_junior', 'Hourly Rate (Junior)', 'Hourly rate for junior developers', 'currency', true, '£{value}/hr'),
  ('revenue_per_consultant', 'Revenue per Consultant', 'Annual revenue per billable consultant', 'currency', true, '£{value}'),
  
  -- MSP
  ('revenue_per_endpoint', 'Revenue per Endpoint', 'Monthly revenue per managed device/user', 'currency', true, '£{value}/month'),
  ('sla_resolution_hours', 'SLA Resolution Time', 'Average hours to resolve tickets', 'number', false, '{value} hours'),
  ('client_churn', 'Client Churn', 'Annual client churn rate', 'percent', false, '{value}%'),
  
  -- E-commerce
  ('conversion_rate', 'Conversion Rate', 'Visitors to purchases conversion', 'percent', true, '{value}%'),
  ('aov', 'Average Order Value', 'Average value per order', 'currency', true, '£{value}'),
  ('cart_abandonment_rate', 'Cart Abandonment Rate', 'Percentage abandoning at checkout', 'percent', false, '{value}%'),
  ('return_rate', 'Return Rate', 'Percentage of orders returned', 'percent', false, '{value}%'),
  ('add_to_cart_rate', 'Add-to-Cart Rate', 'Percentage of visitors adding to cart', 'percent', true, '{value}%'),
  ('cac', 'Customer Acquisition Cost', 'Cost to acquire one customer', 'currency', false, '£{value}')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. SaaS / SOFTWARE PRODUCTS (SAAS)
-- Source: Tech Nation Report 2024, Pavilion SaaS Benchmarks 2024, SaaS Capital 2025
-- Reliability: Tier 2 | Sample: ~1,500 UK/European B2B SaaS companies
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- ARR Growth (YoY)
  ('SAAS', 'arr_growth', 'all', 'all', 10, 28, 55, 1500, 2024, 'SaaS Capital 2025', 'https://www.saas-capital.com', 'high', '2024-03-01', true),
  
  -- Gross Margin (subscription only - services margin is 20-35%)
  ('SAAS', 'gross_margin', 'all', 'all', 70, 79, 85, 1500, 2024, 'Pavilion SaaS Benchmarks 2024', NULL, 'high', '2024-03-01', true),
  ('SAAS', 'gross_margin_services', 'all', 'all', 20, 27.5, 35, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Net Revenue Retention (dropped from 110% median in 2022)
  ('SAAS', 'nrr', 'all', 'all', 95, 102, 112, 1500, 2024, 'SaaS Capital 2025', 'https://www.saas-capital.com', 'high', '2024-03-01', true),
  
  -- ARR per Employee (critical efficiency metric)
  ('SAAS', 'arr_per_employee', 'all', 'all', 85000, 118000, 150000, 1500, 2024, 'Tech Nation Report 2024', 'https://www.technation.io', 'high', '2024-03-01', true),
  
  -- CAC Payback (months - lower is better)
  ('SAAS', 'cac_payback_months', 'all', 'all', 18, 12, 9, 1500, 2024, 'Pavilion SaaS Benchmarks 2024', NULL, 'high', '2024-03-01', true),
  
  -- Logo Churn (annual)
  ('SAAS', 'logo_churn', 'all', 'all', 15, 11, 5, 1500, 2024, 'SaaS Capital 2025', 'https://www.saas-capital.com', 'high', '2024-03-01', true),
  
  -- Rule of 40 (Growth % + Profit Margin %)
  ('SAAS', 'rule_of_40', 'all', 'all', -10, 15, 40, 1500, 2024, 'GP Bullhound', 'https://www.gpbullhound.com', 'high', '2024-03-01', true),
  
  -- Debtor Days (SaaS typically has annual/monthly prepay)
  ('SAAS', 'debtor_days', 'all', 'all', 15, 30, 45, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SOFTWARE DEVELOPMENT AGENCIES (AGENCY_DEV)
-- Source: SPI Research 2024, Deltek Clarity 2025, BenchBee
-- Reliability: Tier 2 | Sample: ~200 UK Consultancies
-- NOTE: "Bench time" averaged 15-20% costing sector £3bn/yr
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Billable Utilisation (bench time = 15-20%)
  ('AGENCY_DEV', 'utilisation_rate', 'all', 'all', 65, 71, 80, 200, 2024, 'SPI Research 2024', 'https://www.spiresearch.com', 'high', '2024-03-01', true),
  
  -- Hourly Rate (blended)
  ('AGENCY_DEV', 'hourly_rate_blended', 'all', 'all', 75, 95, 125, 200, 2024, 'Deltek Clarity 2025', 'https://www.deltek.com', 'high', '2024-03-01', true),
  
  -- Project Margin (declined in 2024 due to fixed-price scope creep)
  ('AGENCY_DEV', 'project_margin', 'all', 'all', 30, 38, 45, 200, 2024, 'SPI Research 2024', 'https://www.spiresearch.com', 'high', '2024-03-01', true),
  
  -- Revenue per Billable Consultant
  ('AGENCY_DEV', 'revenue_per_consultant', 'all', 'all', 110000, 145000, 180000, 200, 2024, 'SPI Research 2024', 'https://www.spiresearch.com', 'high', '2024-03-01', true),
  
  -- EBITDA Margin (highest profitability in 10 years for top performers)
  ('AGENCY_DEV', 'ebitda_margin', 'all', 'all', 8, 14, 21, 200, 2024, 'SPI Research 2024', 'https://www.spiresearch.com', 'high', '2024-03-01', true),
  
  -- Client Concentration (% from top 3 clients - >50% = high risk)
  ('AGENCY_DEV', 'client_concentration_top3', 'all', 'all', 60, 40, 20, 200, 2024, 'Deltek Clarity 2025', 'https://www.deltek.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days
  ('AGENCY_DEV', 'debtor_days', 'all', 'all', 35, 50, 70, NULL, 2024, 'SPI Research 2024', 'https://www.spiresearch.com', 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('AGENCY_DEV', 'employee_turnover', 'all', 'all', 12, 18, 25, NULL, 2024, 'BenchBee', NULL, 'medium', '2024-03-01', true);

-- Software Agency Industry-Specific Metrics (hourly rates by level)
INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, confidence_level, valid_from, is_current)
VALUES
  ('AGENCY_DEV', 'hourly_rate_senior', 'all', 'all', 100, 135, 175, NULL, 2024, 'Deltek Clarity 2025', 'medium', '2024-03-01', true),
  ('AGENCY_DEV', 'hourly_rate_junior', 'all', 'all', 50, 70, 90, NULL, 2024, 'Deltek Clarity 2025', 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. IT SERVICES / MSPs (ITSERV)
-- Source: Datto Global State of the MSP 2024, UK MSP Market Study
-- Reliability: Tier 2 | Sample: 1,575 MSPs globally (significant UK cohort)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Recurring Revenue % (shift from Break/Fix to Managed Services)
  ('ITSERV', 'recurring_revenue_percent', 'all', 'all', 40, 65, 85, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'high', '2024-03-01', true),
  
  -- Gross Margin (Services) - Hardware resale margin is <10%
  ('ITSERV', 'gross_margin', 'all', 'all', 35, 45, 55, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'high', '2024-03-01', true),
  
  -- Revenue per Endpoint (monthly per user/device)
  ('ITSERV', 'revenue_per_endpoint', 'all', 'all', 45, 75, 120, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'high', '2024-03-01', true),
  
  -- SLA Resolution Time (hours)
  ('ITSERV', 'sla_resolution_hours', 'all', 'all', 24, 8, 4, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'medium', '2024-03-01', true),
  
  -- Client Churn (annual)
  ('ITSERV', 'client_churn', 'all', 'all', 15, 8, 5, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'high', '2024-03-01', true),
  
  -- Revenue Growth
  ('ITSERV', 'revenue_growth', 'all', 'all', 0, 10, 20, 1575, 2024, 'Datto Global State of the MSP 2024', 'https://www.datto.com', 'medium', '2024-03-01', true),
  
  -- Debtor Days (managed services = monthly billing)
  ('ITSERV', 'debtor_days', 'all', 'all', 15, 25, 40, NULL, 2024, 'Industry estimate', NULL, 'medium', '2024-03-01', true),
  
  -- Employee Turnover
  ('ITSERV', 'employee_turnover', 'all', 'all', 10, 15, 22, NULL, 2024, 'UK MSP Market Study', NULL, 'medium', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. E-COMMERCE (ECOMM)
-- Source: IMRG Capgemini Index, Shopify Benchmarks, Blend Commerce
-- Reliability: Tier 2 | Sample: UK Online Retail Aggregated Data
-- NOTE: Conversion rates fell while CAC soared
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_data (industry_code, metric_code, revenue_band, employee_band, p25, p50, p75, sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current)
VALUES
  -- Conversion Rate
  ('ECOMM', 'conversion_rate', 'all', 'all', 0.5, 1.8, 3.2, NULL, 2024, 'IMRG Capgemini Index', 'https://www.imrg.org', 'high', '2024-03-01', true),
  
  -- AOV (Average Order Value) - inflation pushed up, volume fell
  ('ECOMM', 'aov', 'all', 'all', 45, 85, 148, NULL, 2024, 'IMRG Capgemini Index', 'https://www.imrg.org', 'high', '2024-03-01', true),
  
  -- Cart Abandonment (mobile is ~80%)
  ('ECOMM', 'cart_abandonment_rate', 'all', 'all', 85, 70, 60, NULL, 2024, 'Blend Commerce', NULL, 'high', '2024-03-01', true),
  
  -- Return Rate (fashion = 25-40%)
  ('ECOMM', 'return_rate', 'all', 'all', 10, 20, 35, NULL, 2024, 'IMRG Capgemini Index', 'https://www.imrg.org', 'high', '2024-03-01', true),
  
  -- Add-to-Cart Rate
  ('ECOMM', 'add_to_cart_rate', 'all', 'all', 3, 6, 10, NULL, 2024, 'Shopify Benchmarks', 'https://www.shopify.com', 'medium', '2024-03-01', true),
  
  -- CAC (Customer Acquisition Cost) - rose ~20% YoY
  ('ECOMM', 'cac', 'all', 'all', 20, 45, 80, NULL, 2024, 'Blend Commerce', NULL, 'medium', '2024-03-01', true),
  
  -- Debtor Days (typically immediate payment)
  ('ECOMM', 'debtor_days', 'all', 'all', 0, 2, 7, NULL, 2024, 'Industry standard', NULL, 'high', '2024-03-01', true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTOR ALERTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO benchmark_manual_queue (source_name, source_type, industries_affected, metrics_affected, priority, status, notes, due_date)
VALUES 
(
  'SaaS NRR Decline Monitoring',
  'research',
  ARRAY['SAAS'],
  ARRAY['nrr', 'logo_churn'],
  'medium',
  'pending',
  'NRR dropped from 110% (2022) to 102% (2024) as customers consolidated tools. "Logo retention" is now the primary battleground. Monitor for continued compression.',
  '2025-06-01'
),
(
  'Agency Utilisation Recovery',
  'research',
  ARRAY['AGENCY_DEV'],
  ARRAY['utilisation_rate', 'ebitda_margin'],
  'medium',
  'pending',
  '"Bench time crisis" cost sector £3bn+ in 2023-24. Utilisation dropped to ~70% before recovering. Monitor for AI impact on productivity metrics.',
  '2025-06-01'
),
(
  'E-commerce CAC Inflation',
  'research',
  ARRAY['ECOMM'],
  ARRAY['cac', 'conversion_rate'],
  'medium',
  'pending',
  'CAC rose ~20% YoY while conversion rates fell (1.4-1.9%). Brands pivoting from new customer acquisition to LTV optimization. Monitor ratio trends.',
  '2025-06-01'
);

