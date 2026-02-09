-- =============================================================================
-- Discovery: Diagnose whether client financial data reached Pass 1 calculators
-- Use for clients (e.g. Jack / Big Display Company) where cost of inaction
-- and returns show "Unknown precisely" or are missing.
-- =============================================================================
-- Run in Supabase SQL Editor. Replace 'Jack%' with client name pattern as needed.
-- =============================================================================

-- 1. Check if client's financial data was extracted (client_financial_data)
-- Schema: revenue, gross_profit, ebitda, net_profit, confidence_score (no operating_profit or staff_costs)
SELECT 
  cfd.fiscal_year, 
  cfd.revenue, 
  cfd.gross_profit, 
  cfd.ebitda, 
  cfd.net_profit, 
  cfd.employee_count,
  cfd.confidence_score
FROM client_financial_data cfd
JOIN practice_members pm ON pm.id = cfd.client_id
WHERE pm.name LIKE 'Jack%'
ORDER BY cfd.fiscal_year DESC;

-- 2. Check if client_financial_context has a row (alternative extraction path)
-- Schema varies by env; only query columns that exist in all variants
SELECT 
  cfc.client_id,
  cfc.period_end_date,
  cfc.created_at
FROM client_financial_context cfc
JOIN practice_members pm ON pm.id = cfc.client_id
WHERE pm.name LIKE 'Jack%'
ORDER BY cfc.period_end_date DESC NULLS LAST;

-- 3. Check if Pass 1 ran calculators (comprehensive_analysis present and populated)
SELECT 
  dr.id AS report_id,
  de.id AS engagement_id,
  pm.name AS client_name,
  dr.comprehensive_analysis IS NOT NULL AS has_analysis,
  (dr.comprehensive_analysis->'costOfInaction') IS NOT NULL AND (dr.comprehensive_analysis->'costOfInaction') != 'null'::jsonb AS has_coi,
  (dr.comprehensive_analysis->'payroll') IS NOT NULL AND (dr.comprehensive_analysis->'payroll') != 'null'::jsonb AS has_payroll,
  (dr.comprehensive_analysis->'valuation') IS NOT NULL AND (dr.comprehensive_analysis->'valuation') != 'null'::jsonb AS has_valuation,
  (dr.comprehensive_analysis->'yearOnYearComparisons') IS NOT NULL AS has_yoy
FROM discovery_reports dr
JOIN discovery_engagements de ON de.id = dr.engagement_id
JOIN practice_members pm ON pm.id = de.client_id
WHERE pm.name LIKE 'Jack%'
ORDER BY dr.created_at DESC
LIMIT 5;

-- =============================================================================
-- INTERPRETING QUERY 3:
-- has_payroll false → No staff-costs benchmark, so labour inefficiency shows narrative/Unknown.
-- has_yoy false     → No pre-calculated operating profit growth; Pass 2 can't inject exact %.
-- client_name "Jack," → Trailing comma in DB; display sanitisation fixes it in reports/PDFs.
-- =============================================================================

-- 4. Optional: fix client name trailing comma (e.g. "Jack," → "Jack") in practice_members
-- Run once to fix source data; reports already sanitise at display time.
-- UPDATE practice_members
-- SET name = REGEXP_REPLACE(name, '[,;:.!?]+$', '')
-- WHERE name ~ '[,;:.!?]$' AND name LIKE 'Jack%';
