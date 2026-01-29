-- ============================================================================
-- UPDATE: Benchmarking Service Metadata
-- ============================================================================
-- - Rename to "Benchmarking & Hidden Value Analysis"
-- - Update price from £3,500 to £2,000
-- - Expand description to include HVA elements
-- - Add key deliverables
-- ============================================================================

UPDATE service_line_metadata
SET 
  name = 'Benchmarking & Hidden Value Analysis',
  display_name = 'Benchmarking & Hidden Value Analysis',
  core_function = 'Comprehensive business valuation baseline with industry comparison and hidden value identification',
  problems_addressed = ARRAY[
    'No idea what the business is actually worth',
    'Cannot identify where performance gaps are vs industry',
    'Making decisions without competitive context',
    'Hidden assets and value not being captured',
    'No baseline to measure exit readiness against',
    'Pricing and margins may be leaving money on the table',
    'Intellectual capital and brand value unquantified'
  ],
  pricing = '[{"tier": "Full Package", "amount": 2000, "frequency": "one-time"}]'::jsonb,
  key_deliverables = ARRAY[
    'Indicative business valuation range',
    'Hidden assets identification (excess cash, IP, brand equity)',
    'Industry benchmark comparison across key metrics',
    'Payroll efficiency analysis vs sector benchmarks',
    'Gross margin and profitability positioning',
    'Revenue per head productivity analysis',
    'Exit readiness score and gap analysis',
    'Prioritised improvement recommendations'
  ],
  typical_timeline = '2-4 weeks for full analysis and recommendations',
  roi_calculation_method = 'Performance gap identification. Knowing you''re 15% below industry margin highlights £50-200k improvement opportunity. Hidden value audit often reveals 5-15% additional business value.',
  updated_at = NOW()
WHERE code = 'benchmarking';

-- Also update the timing rules
UPDATE service_timing_rules
SET 
  ideal_timing = 'When preparing for exit, seeking investment, or wanting to understand competitive position. Essential baseline for any strategic planning.',
  too_early = 'Pre-revenue or still establishing baseline performance',
  too_late = 'After a buyer has already valued your business lower than expected'
WHERE service_code = 'benchmarking';

-- Update the service pricing table if it exists
UPDATE service_pricing_tiers 
SET price = 2000
WHERE service_pricing_id IN (
  SELECT id FROM service_pricing WHERE service_code = 'benchmarking'
) AND tier_code = 'full';

-- Verify the update
SELECT code, name, display_name, pricing, typical_timeline 
FROM service_line_metadata 
WHERE code = 'benchmarking';

