-- ============================================================================
-- RENAME MANAGEMENT ACCOUNTS TO BUSINESS INTELLIGENCE
-- Strategy: INSERT new → UPDATE children → DELETE old
-- ============================================================================

-- ============================================================================
-- STEP 1: INSERT NEW business_intelligence ROW (copy from management_accounts)
-- ============================================================================

INSERT INTO service_line_metadata (
  code, name, core_function, problems_addressed, pricing, status,
  deliverables, quick_wins, long_term_value, ideal_client_profile,
  success_metrics, integration_with_other_services, created_at
)
SELECT 
  'business_intelligence',
  'Business Intelligence',
  'Financial clarity with True Cash position, KPIs, AI insights, forecasts and scenario modelling',
  problems_addressed,
  pricing,
  status,
  deliverables,
  quick_wins,
  long_term_value,
  ideal_client_profile,
  success_metrics,
  integration_with_other_services,
  NOW()
FROM service_line_metadata 
WHERE code = 'management_accounts'
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 2: UPDATE ALL CHILD TABLES TO POINT TO NEW CODE
-- ============================================================================

-- 2a. UPDATE SERVICE_TIMING_RULES
UPDATE service_timing_rules 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- 2b. UPDATE SERVICE_ADVISORY_TRIGGERS
UPDATE service_advisory_triggers 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- 2c. UPDATE SERVICE_CONTRAINDICATIONS
UPDATE service_contraindications 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- 2d. UPDATE SERVICE_VALUE_CALCULATIONS
UPDATE service_value_calculations 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- 2e. UPDATE SERVICE_NARRATIVE_TEMPLATES
UPDATE service_narrative_templates 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- 2f. UPDATE ADVISORY_OVERSELLING_RULES (array columns)
UPDATE advisory_overselling_rules 
SET priority_services = array_replace(priority_services, 'management_accounts', 'business_intelligence')
WHERE 'management_accounts' = ANY(priority_services);

UPDATE advisory_overselling_rules 
SET excluded_services = array_replace(excluded_services, 'management_accounts', 'business_intelligence')
WHERE 'management_accounts' = ANY(excluded_services);

-- ============================================================================
-- STEP 3: DELETE OLD management_accounts ROW (children now point to new code)
-- ============================================================================

DELETE FROM service_line_metadata WHERE code = 'management_accounts';

-- ============================================================================
-- STEP 4: UPDATE OTHER TABLES (no FK to service_line_metadata)
-- ============================================================================

-- 4a. UPDATE SERVICE_LINE_ASSESSMENTS
UPDATE service_line_assessments 
SET service_line_code = 'business_intelligence' 
WHERE service_line_code = 'management_accounts';

-- 4b. UPDATE CLIENT_SERVICE_LINES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_service_lines') THEN
    EXECUTE 'UPDATE client_service_lines SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- 4c. UPDATE BI_ENGAGEMENTS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bi_engagements') THEN
    EXECUTE 'UPDATE bi_engagements SET service_code = ''business_intelligence'' WHERE service_code = ''management_accounts''';
  END IF;
END $$;

-- 4d. UPDATE MA_ENGAGEMENTS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ma_engagements') THEN
    EXECUTE 'UPDATE ma_engagements SET service_code = ''business_intelligence'' WHERE service_code = ''management_accounts''';
  END IF;
END $$;

-- 4e. UPDATE CLIENT_CONTEXT JSONB DATA
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_context') THEN
    EXECUTE '
      UPDATE client_context 
      SET content = REPLACE(content::text, ''management_accounts'', ''business_intelligence'')::jsonb
      WHERE content::text LIKE ''%management_accounts%''
    ';
  END IF;
END $$;

-- 4f. UPDATE ASSESSMENT_QUESTIONS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_questions') THEN
    EXECUTE 'UPDATE assessment_questions SET assessment_type = ''business_intelligence'' WHERE assessment_type = ''management_accounts''';
  END IF;
END $$;

-- 4g. UPDATE SERVICE_LINES TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_lines') THEN
    EXECUTE '
      UPDATE service_lines 
      SET code = ''business_intelligence'', 
          name = ''Business Intelligence''
      WHERE code = ''management_accounts''
    ';
    
    EXECUTE '
      INSERT INTO service_lines (code, name, description, status)
      SELECT ''business_intelligence'', ''Business Intelligence'', 
             ''Financial clarity with True Cash position, KPIs, AI insights, forecasts and scenario modelling'',
             ''active''
      WHERE NOT EXISTS (SELECT 1 FROM service_lines WHERE code = ''business_intelligence'')
    ';
  END IF;
END $$;

-- 4h. UPDATE CLIENT_SERVICE_LINE_ASSIGNMENTS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_service_line_assignments') THEN
    EXECUTE 'UPDATE client_service_line_assignments SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- 4i. UPDATE PRACTICE_SERVICE_LINES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_service_lines') THEN
    EXECUTE 'UPDATE practice_service_lines SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Migration Complete' as status,
       (SELECT COUNT(*) FROM service_line_metadata WHERE code = 'business_intelligence') as bi_exists,
       (SELECT COUNT(*) FROM service_line_metadata WHERE code = 'management_accounts') as ma_removed;
