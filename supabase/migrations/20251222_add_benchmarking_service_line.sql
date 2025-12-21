-- ============================================================================
-- ADD BENCHMARKING SERVICE LINE
-- ============================================================================
-- Makes benchmarking assignable to clients in the Assign Services modal
-- ============================================================================

-- Insert benchmarking service line if it doesn't exist
INSERT INTO service_lines (code, name, short_description, display_order, is_active) 
VALUES (
  'benchmarking',
  'Benchmarking',
  'Compare your business performance to industry leaders and identify improvement opportunities',
  7,  -- Display order after Hidden Value Audit (6) and before Combined Advisory (8)
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify insertion
SELECT code, name, short_description, display_order, is_active 
FROM service_lines 
WHERE code = 'benchmarking';

