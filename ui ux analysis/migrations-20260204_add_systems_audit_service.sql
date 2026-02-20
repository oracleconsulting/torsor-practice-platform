-- ============================================================================
-- Migration: Add Systems Audit Service
-- Purpose: Add the Systems Audit service for clients needing process documentation
-- Created: 2026-02-04
-- ============================================================================

-- Add Systems Audit service if it doesn't exist
INSERT INTO services (
  code, 
  name, 
  headline, 
  description, 
  category,
  price_from, 
  price_to, 
  price_unit, 
  typical_duration,
  deliverables, 
  status, 
  created_at
)
SELECT 
  'SYSTEMS_AUDIT',
  'Systems & Process Audit',
  'Discover what runs your business — and what''s stuck in heads',
  'Comprehensive review of business systems, processes, and documentation. We map what exists, identify gaps, and create a prioritised roadmap for systemisation. Essential preparation for growth, transition, or exit.',
  'governance',
  2500,
  5000,
  'one_off',
  '2-4 weeks',
  ARRAY[
    'Process inventory — what exists vs what''s assumed',
    'Documentation gap analysis',
    'Knowledge dependency mapping (who knows what)',
    'System health assessment',
    'Prioritised systemisation roadmap',
    'Quick wins identification'
  ],
  'active',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'SYSTEMS_AUDIT');

-- Add Strategic Advisory service if it doesn't exist (alternative to Fractional COO)
INSERT INTO services (
  code, 
  name, 
  headline, 
  description, 
  category,
  price_from, 
  price_to, 
  price_unit, 
  typical_duration,
  deliverables, 
  status, 
  created_at
)
SELECT 
  'STRATEGIC_ADVISORY',
  'Strategic Advisory',
  'Senior counsel when you need it — without embedded overhead',
  'Project-based strategic support for key decisions, transitions, or challenges. Ideal for businesses that prefer external expertise on a when-needed basis rather than embedded roles.',
  'growth',
  1500,
  4000,
  'per_month',
  'Ongoing / project-based',
  ARRAY[
    'Strategic planning sessions',
    'Decision support and sounding board',
    'Transition planning guidance',
    'Leadership development advice',
    'Exit readiness assessment'
  ],
  'active',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'STRATEGIC_ADVISORY');

-- Add Quarterly BI Support service if it doesn't exist
INSERT INTO services (
  code, 
  name, 
  headline, 
  description, 
  category,
  price_from, 
  price_to, 
  price_unit, 
  typical_duration,
  deliverables, 
  status, 
  created_at
)
SELECT 
  'QUARTERLY_BI_SUPPORT',
  'Quarterly BI & Benchmarking',
  'Turn your management accounts into strategic intelligence',
  'Ongoing quarterly analysis of your financial and operational data. Benchmark performance, track trends, and get actionable insights without running full deep dives.',
  'operations',
  500,
  1000,
  'per_month',
  'Ongoing',
  ARRAY[
    'Quarterly performance dashboard',
    'Industry benchmark comparison',
    'Trend analysis and alerts',
    'Actionable recommendations',
    'Progress tracking against goals'
  ],
  'active',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'QUARTERLY_BI_SUPPORT');

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20260204_add_systems_audit_service completed';
END $$;
