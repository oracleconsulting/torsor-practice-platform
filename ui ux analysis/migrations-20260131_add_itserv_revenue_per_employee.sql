-- ═══════════════════════════════════════════════════════════════════════════════
-- Add missing revenue_per_employee benchmark for ITSERV (IT Services / MSP)
-- ═══════════════════════════════════════════════════════════════════════════════
-- This was missing from the original seed data
-- 
-- Source: Service Leadership Index 2024, Datto MSP Benchmark Report
-- IT Services / MSPs typically have lower revenue per employee than pure consulting
-- due to hardware resale and support desk operations

-- Delete existing if present (to avoid duplicates)
DELETE FROM benchmark_data 
WHERE industry_code = 'ITSERV' 
  AND metric_code = 'revenue_per_employee'
  AND revenue_band = 'all'
  AND employee_band = 'all';

DELETE FROM benchmark_data 
WHERE industry_code = 'ITSERV' 
  AND metric_code = 'net_margin'
  AND revenue_band = 'all'
  AND employee_band = 'all';

-- Insert revenue_per_employee
INSERT INTO benchmark_data (
  industry_code, 
  metric_code, 
  revenue_band, 
  employee_band, 
  p25, 
  p50, 
  p75, 
  sample_size, 
  data_year, 
  data_source, 
  source_url, 
  confidence_level, 
  valid_from, 
  is_current
)
VALUES
  -- Revenue per Employee - IT Services / MSP
  -- P25: Smaller MSPs with high support desk ratio
  -- P50: Typical UK MSP (mix of managed services + project work)
  -- P75: High-performing MSPs with strong managed services
  ('ITSERV', 'revenue_per_employee', 'all', 'all', 95000, 148529, 210000, 1575, 2024, 
   'Service Leadership Index 2024, Datto Global State of the MSP', 
   'https://www.datto.com', 'high', '2024-03-01', true);

-- Insert net_margin
INSERT INTO benchmark_data (
  industry_code, 
  metric_code, 
  revenue_band, 
  employee_band, 
  p25, 
  p50, 
  p75, 
  sample_size, 
  data_year, 
  data_source, 
  source_url, 
  confidence_level, 
  valid_from, 
  is_current
)
VALUES
  ('ITSERV', 'net_margin', 'all', 'all', 5, 10, 18, 1575, 2024, 
   'Service Leadership Index 2024', 
   'https://www.service-leadership.com', 'high', '2024-03-01', true);

-- Verify
SELECT metric_code, p25, p50, p75 
FROM benchmark_data 
WHERE industry_code = 'ITSERV' 
  AND metric_code IN ('revenue_per_employee', 'net_margin');
