-- ============================================================================
-- FIX SERVICE VALUE CALCULATIONS FORMULAS
-- ============================================================================
-- These formulas were causing SyntaxError in Stage 2 advisory-deep-dive
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's see what we're working with
SELECT 
  id,
  service_code,
  calculation_name,
  formula,
  required_metrics,
  output_template,
  fallback_output
FROM service_value_calculations
WHERE is_active = true
ORDER BY service_code, calculation_name;

-- ============================================================================
-- FORMULA SYNTAX RULES
-- ============================================================================
-- Formulas are evaluated with JavaScript eval()
-- They must be valid JS expressions using only:
--   - Numbers: 100, 50000, 0.55
--   - Operators: + - * / ( )
--   - Metric references that get replaced before eval
--
-- VALID metric references:
--   metrics.operational.manualWorkPercentage  → replaced with number
--   metrics.operational.teamSize.current      → replaced with number
--   metrics.financial.currentRevenue          → replaced with number
--   metrics.financial.grossMargin             → replaced with number (0-1)
--   metrics.financial.growthMultiple          → replaced with number
--
-- BAD formulas (will cause SyntaxError):
--   "current * 50000"                         → 'current' is not defined
--   "Object.values(...)"                      → 'Object' is unexpected
--   "metrics.teamSize.current || 1"           → '||' may not work in simple eval
-- ============================================================================

-- Fix manual_work_cost_scaling formula
-- Original likely had something like "current * salary" which doesn't work
UPDATE service_value_calculations
SET formula = '(metrics.operational.manualWorkPercentage / 100) * metrics.operational.teamSize.current * 50000',
    required_metrics = ARRAY['metrics.operational.manualWorkPercentage', 'metrics.operational.teamSize.current'],
    output_template = '£{result} annual labour waste from manual processes',
    fallback_output = 'Significant labour waste from manual processes'
WHERE calculation_name = 'manual_work_cost_scaling'
  AND (formula NOT LIKE '%(metrics.operational.manualWorkPercentage%' OR formula LIKE '%current%' OR formula LIKE '%Object%');

-- Fix investment_as_percent_of_revenue formula
-- Original likely had Object.something or other invalid syntax
UPDATE service_value_calculations
SET formula = '(13300 / metrics.financial.currentRevenue) * 100',
    required_metrics = ARRAY['metrics.financial.currentRevenue'],
    output_template = '{result}% of Year 1 revenue',
    fallback_output = 'Small percentage of annual revenue'
WHERE calculation_name = 'investment_as_percent_of_revenue'
  AND (formula NOT LIKE '%metrics.financial.currentRevenue%' OR formula LIKE '%Object%');

-- ============================================================================
-- ADD MISSING CALCULATIONS (if not exist)
-- ============================================================================

-- Valuation impact calculation
INSERT INTO service_value_calculations (
  service_code,
  calculation_name,
  required_metrics,
  formula,
  output_template,
  fallback_output,
  use_when,
  priority,
  is_active
)
SELECT 
  '365_method',
  'valuation_multiple_impact',
  ARRAY['metrics.financial.currentRevenue', 'metrics.financial.growthMultiple'],
  'metrics.financial.currentRevenue * metrics.financial.growthMultiple * 6',
  '£{result} potential valuation delta (6x vs 12x)',
  'Significant valuation uplift from systemisation',
  '{"pattern": "founderDependency", "value": true}'::jsonb,
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM service_value_calculations 
  WHERE calculation_name = 'valuation_multiple_impact'
);

-- Efficiency ROI calculation
INSERT INTO service_value_calculations (
  service_code,
  calculation_name,
  required_metrics,
  formula,
  output_template,
  fallback_output,
  use_when,
  priority,
  is_active
)
SELECT 
  'systems_audit',
  'efficiency_roi',
  ARRAY['metrics.operational.manualWorkPercentage', 'metrics.operational.teamSize.current'],
  '((metrics.operational.manualWorkPercentage / 100) * metrics.operational.teamSize.current * 50000) * 0.3',
  '£{result} potential annual savings (30% of manual waste)',
  '£20,000-£50,000 potential efficiency savings',
  '{"metric": "metrics.operational.manualWorkPercentage", "operator": ">", "value": 30}'::jsonb,
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM service_value_calculations 
  WHERE calculation_name = 'efficiency_roi'
);

-- ============================================================================
-- VERIFY FIXES
-- ============================================================================

SELECT 
  service_code,
  calculation_name,
  formula,
  output_template
FROM service_value_calculations
WHERE calculation_name IN (
  'manual_work_cost_scaling',
  'investment_as_percent_of_revenue',
  'valuation_multiple_impact',
  'efficiency_roi'
)
ORDER BY calculation_name;


