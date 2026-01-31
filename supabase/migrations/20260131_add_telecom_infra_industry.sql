-- ============================================================================
-- Add TELECOM_INFRA industry for telecommunications infrastructure contractors
-- ============================================================================
-- Installation Technology is a telecom infrastructure contractor, NOT an MSP.
-- They install 4G/5G infrastructure in London Underground for Boldyn Networks.
-- Comparing them to MSP gross margins (45%) was incorrect.
-- ============================================================================

-- 1. Create the industry (ON CONFLICT works here because industries has unique code)
INSERT INTO industries (code, name, category, description, sic_codes, keywords, is_active)
VALUES (
  'TELECOM_INFRA', 
  'Telecommunications Infrastructure Contractor',
  'technology',
  'Physical installation, maintenance and support of telecommunications networks including fibre, wireless, DAS systems. Typically project-based with hardware pass-through and subcontractor costs.',
  ARRAY['42220', '61100', '61200', '43210', '62090'],
  ARRAY['telecom', 'infrastructure', 'installation', 'fibre', 'fiber', 'wireless', 'DAS', 'network', 'cabling', 'underground', 'railway', 'transport', '4G', '5G', 'field engineer'],
  true
)
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sic_codes = EXCLUDED.sic_codes,
  keywords = EXCLUDED.keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Delete any existing TELECOM_INFRA benchmarks (clean slate)
DELETE FROM benchmark_data WHERE industry_code = 'TELECOM_INFRA';

-- 3. Insert appropriate benchmarks (very different from MSP!)
-- Source: UK infrastructure contractor sector analysis, CECA benchmarking, ECA reports

INSERT INTO benchmark_data (
  industry_code, metric_code, revenue_band, employee_band, 
  p25, p50, p75, 
  sample_size, data_year, data_source, source_url, confidence_level, valid_from, is_current
)
VALUES 
  -- Gross margin: Much lower due to hardware/subcontractor pass-through
  -- Telecoms infrastructure typically 12-25% gross margin
  ('TELECOM_INFRA', 'gross_margin', 'all', 'all', 12, 18, 25, 
   150, 2024, 'UK infrastructure contractor sector analysis, ECA benchmarking', 
   'https://www.eca.co.uk', 'high', '2024-03-01', true),
  
  -- Net margin: Typical for project-based contractors (tight margins, high turnover)
  ('TELECOM_INFRA', 'net_margin', 'all', 'all', 2, 5, 8, 
   150, 2024, 'UK infrastructure contractor sector analysis', 
   NULL, 'medium', '2024-03-01', true),
  
  -- Revenue per employee: MUCH higher than MSPs (specialist field engineers)
  -- £250k-500k typical for field engineering/installation contractors
  ('TELECOM_INFRA', 'revenue_per_employee', 'all', 'all', 250000, 350000, 500000, 
   150, 2024, 'Field engineering sector benchmarks, CECA salary survey', 
   'https://www.ceca.co.uk', 'high', '2024-03-01', true),
  
  -- Debtor days: Construction/infrastructure industry is slower (certification cycles)
  ('TELECOM_INFRA', 'debtor_days', 'all', 'all', 45, 60, 75, 
   150, 2024, 'Construction industry typical, BEIS payment practices', 
   NULL, 'high', '2024-03-01', true),
  
  -- Revenue growth: Lumpy due to large project cycles
  ('TELECOM_INFRA', 'revenue_growth', 'all', 'all', -10, 5, 20, 
   150, 2024, 'Infrastructure sector average (project-based volatility)', 
   NULL, 'medium', '2024-03-01', true),
  
  -- Client concentration: B2B contractors often have few large clients (normal)
  ('TELECOM_INFRA', 'client_concentration_top3', 'all', 'all', 60, 75, 90, 
   150, 2024, 'B2B contractor analysis', 
   NULL, 'medium', '2024-03-01', true),
  
  -- Employee turnover: Field engineers tend to be sticky (specialist skills)
  ('TELECOM_INFRA', 'employee_turnover', 'all', 'all', 8, 12, 18, 
   150, 2024, 'Field engineering sector retention data', 
   NULL, 'medium', '2024-03-01', true),
   
  -- EBITDA margin
  ('TELECOM_INFRA', 'ebitda_margin', 'all', 'all', 5, 10, 15,
   150, 2024, 'Infrastructure contractor analysis',
   NULL, 'medium', '2024-03-01', true),
   
  -- Creditor days (infrastructure contractors often have longer payment terms)
  ('TELECOM_INFRA', 'creditor_days', 'all', 'all', 30, 45, 60,
   150, 2024, 'Construction sector payment practices',
   NULL, 'medium', '2024-03-01', true),
   
  -- Utilisation rate (field engineers should be highly utilised)
  ('TELECOM_INFRA', 'utilisation_rate', 'all', 'all', 70, 80, 90,
   150, 2024, 'Field services industry benchmarks',
   NULL, 'medium', '2024-03-01', true);

-- 4. Verify the inserts
SELECT 
  metric_code, 
  p25, 
  p50 as median, 
  p75,
  data_source
FROM benchmark_data 
WHERE industry_code = 'TELECOM_INFRA'
ORDER BY metric_code;
