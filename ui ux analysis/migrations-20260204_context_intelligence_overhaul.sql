-- Migration: Context Intelligence Overhaul
-- Date: 2026-02-04
-- Purpose: Establish single source of truth for service recommendations
-- 
-- Key Changes:
-- 1. Add client_preferences column to bm_reports
-- 2. Add recommended_services column (AUTHORITATIVE list)
-- 3. Add active_service_codes column
-- 4. Create service_alternatives table
-- 5. Add new services: SYSTEMS_AUDIT, STRATEGIC_ADVISORY, QUARTERLY_BI_SUPPORT

-- ============================================================================
-- PART 1: Add preference and recommendation columns to bm_reports
-- ============================================================================

-- Client preferences extracted from context notes
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS client_preferences jsonb DEFAULT '{}';

COMMENT ON COLUMN bm_reports.client_preferences IS 
'Preferences extracted from client_context_notes: prefersExternalSupport, avoidsInternalHires, etc.';

-- Authoritative recommended services list (frontend reads this, no independent logic)
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS recommended_services jsonb DEFAULT '[]';

COMMENT ON COLUMN bm_reports.recommended_services IS 
'Authoritative list of recommended services. Frontend should ONLY display these, not calculate independently.';

-- Track what services client already has to avoid self-recommendation
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS active_service_codes jsonb DEFAULT '[]';

COMMENT ON COLUMN bm_reports.active_service_codes IS 
'Service codes the client already has active (e.g., BENCHMARKING if this report exists)';

-- ============================================================================
-- PART 2: Add new services
-- ============================================================================

-- Systems & Process Audit - for clients who need documentation/structure
INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT 
  'SYSTEMS_AUDIT', 
  'Systems & Process Audit', 
  'Discover what runs your business — and what''s stuck in heads',
  'governance', 
  2500, 
  5000, 
  'one_off', 
  '2-4 weeks', 
  'active',
  'Comprehensive review of business systems, processes, and documentation. Identifies what exists vs what''s tribal knowledge, gaps in documentation, and creates a roadmap for systemisation. Essential for exit preparation or reducing founder dependency.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'SYSTEMS_AUDIT');

-- Strategic Advisory - project-based alternative to fractional roles
INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT 
  'STRATEGIC_ADVISORY', 
  'Strategic Advisory',
  'Senior counsel when you need it — without embedded overhead',
  'growth', 
  1500, 
  4000, 
  'per_month', 
  'Project-based', 
  'active',
  'On-demand strategic guidance from experienced advisors. Perfect for business owners who want expert input without committing to fractional hires. Typically includes monthly strategy sessions, ad-hoc advice, and board-level perspective.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'STRATEGIC_ADVISORY');

-- Quarterly BI Support - ongoing insight alternative to deep dive
INSERT INTO services (code, name, headline, category, price_from, price_to, price_unit, typical_duration, status, description)
SELECT 
  'QUARTERLY_BI_SUPPORT', 
  'Quarterly BI & Benchmarking',
  'Turn your management accounts into strategic intelligence',
  'operations', 
  500, 
  1000, 
  'per_month', 
  'Ongoing', 
  'active',
  'Ongoing business intelligence support. Quarterly benchmarking updates, monthly KPI tracking, and strategic insights from your financial data. Perfect for clients who''ve completed a Benchmarking Deep Dive and want continuous monitoring.'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE code = 'QUARTERLY_BI_SUPPORT');

-- ============================================================================
-- PART 3: Service alternatives table
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_alternatives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocked_service_code text NOT NULL,
  alternative_service_code text NOT NULL,
  condition text NOT NULL,
  reason text NOT NULL,
  priority integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocked_service_code, condition)
);

COMMENT ON TABLE service_alternatives IS 
'Maps blocked services to their alternatives based on client preferences/conditions';

-- Populate alternatives
INSERT INTO service_alternatives (blocked_service_code, alternative_service_code, condition, reason, priority)
VALUES
  -- Fractional COO alternatives
  ('FRACTIONAL_COO', 'SYSTEMS_AUDIT', 'needsSystemsAudit', 'Address documentation needs through focused project rather than embedded role', 1),
  ('FRACTIONAL_COO', 'STRATEGIC_ADVISORY', 'prefersExternalSupport', 'Project-based strategic support aligned with external support preference', 2),
  ('FRACTIONAL_COO', 'STRATEGIC_ADVISORY', 'avoidsInternalHires', 'Senior counsel without internal headcount commitment', 3),
  ('FRACTIONAL_COO', 'STRATEGIC_ADVISORY', 'prefersProjectBasis', 'Flexible engagement model matching project-basis preference', 4),
  
  -- Fractional CFO alternatives
  ('FRACTIONAL_CFO', 'STRATEGIC_ADVISORY', 'prefersExternalSupport', 'Strategic finance input on project basis', 1),
  ('FRACTIONAL_CFO', 'STRATEGIC_ADVISORY', 'avoidsInternalHires', 'Finance guidance without embedded role', 2),
  ('FRACTIONAL_CFO', 'FINANCIAL_HEALTH_CHECK', 'prefersProjectBasis', 'Point-in-time financial review matching project preference', 3),
  
  -- Benchmarking alternatives
  ('BENCHMARKING_DEEP_DIVE', 'QUARTERLY_BI_SUPPORT', 'hasActiveBenchmark', 'Ongoing insight rather than repeated deep dive', 1)
ON CONFLICT (blocked_service_code, condition) DO UPDATE SET
  alternative_service_code = EXCLUDED.alternative_service_code,
  reason = EXCLUDED.reason,
  priority = EXCLUDED.priority;

-- ============================================================================
-- PART 4: Index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bm_reports_client_preferences 
ON bm_reports USING GIN (client_preferences);

CREATE INDEX IF NOT EXISTS idx_bm_reports_recommended_services 
ON bm_reports USING GIN (recommended_services);

CREATE INDEX IF NOT EXISTS idx_service_alternatives_blocked 
ON service_alternatives (blocked_service_code);

-- ============================================================================
-- PART 5: Update existing reports with empty defaults
-- ============================================================================

UPDATE bm_reports 
SET 
  client_preferences = COALESCE(client_preferences, '{}'),
  recommended_services = COALESCE(recommended_services, '[]'),
  active_service_codes = COALESCE(active_service_codes, '[]')
WHERE client_preferences IS NULL 
   OR recommended_services IS NULL 
   OR active_service_codes IS NULL;
