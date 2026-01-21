-- ============================================================================
-- RENAME MANAGEMENT ACCOUNTS TO BUSINESS INTELLIGENCE
-- Comprehensive migration to update all references
-- ============================================================================

-- ============================================================================
-- 1. UPDATE SERVICE_LINE_METADATA
-- ============================================================================

-- Update the main service line entry
UPDATE service_line_metadata 
SET 
  code = 'business_intelligence',
  name = 'Business Intelligence',
  core_function = 'Financial clarity with True Cash position, KPIs, AI insights, forecasts and scenario modelling'
WHERE code = 'management_accounts';

-- ============================================================================
-- 2. UPDATE SERVICE_TIMING_RULES
-- ============================================================================

UPDATE service_timing_rules 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- ============================================================================
-- 3. UPDATE SERVICE_ADVISORY_TRIGGERS
-- ============================================================================

UPDATE service_advisory_triggers 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- ============================================================================
-- 4. UPDATE SERVICE_CONTRAINDICATIONS
-- ============================================================================

UPDATE service_contraindications 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- ============================================================================
-- 5. UPDATE SERVICE_VALUE_CALCULATIONS
-- ============================================================================

UPDATE service_value_calculations 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- ============================================================================
-- 6. UPDATE SERVICE_NARRATIVE_TEMPLATES
-- ============================================================================

UPDATE service_narrative_templates 
SET service_code = 'business_intelligence' 
WHERE service_code = 'management_accounts';

-- ============================================================================
-- 7. UPDATE ADVISORY_OVERSELLING_RULES
-- Update array columns that may contain 'management_accounts'
-- ============================================================================

UPDATE advisory_overselling_rules 
SET priority_services = array_replace(priority_services, 'management_accounts', 'business_intelligence')
WHERE 'management_accounts' = ANY(priority_services);

UPDATE advisory_overselling_rules 
SET excluded_services = array_replace(excluded_services, 'management_accounts', 'business_intelligence')
WHERE 'management_accounts' = ANY(excluded_services);

-- ============================================================================
-- 8. UPDATE SERVICE_LINE_ASSESSMENTS
-- ============================================================================

UPDATE service_line_assessments 
SET service_line_code = 'business_intelligence' 
WHERE service_line_code = 'management_accounts';

-- ============================================================================
-- 9. UPDATE CLIENT_SERVICE_LINES (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_service_lines') THEN
    EXECUTE 'UPDATE client_service_lines SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- 10. UPDATE BI_ENGAGEMENTS (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bi_engagements') THEN
    EXECUTE 'UPDATE bi_engagements SET service_code = ''business_intelligence'' WHERE service_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- 11. UPDATE MA_ENGAGEMENTS (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ma_engagements') THEN
    EXECUTE 'UPDATE ma_engagements SET service_code = ''business_intelligence'' WHERE service_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- 12. UPDATE CLIENT_CONTEXT JSONB DATA (if contains service line references)
-- ============================================================================

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

-- ============================================================================
-- 13. UPDATE ASSESSMENT_QUESTIONS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_questions') THEN
    EXECUTE 'UPDATE assessment_questions SET assessment_type = ''business_intelligence'' WHERE assessment_type = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- 14. UPDATE SERVICE_LINES TABLE (client-service associations)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_lines') THEN
    -- Update existing management_accounts entry to business_intelligence
    EXECUTE '
      UPDATE service_lines 
      SET code = ''business_intelligence'', 
          name = ''Business Intelligence''
      WHERE code = ''management_accounts''
    ';
    
    -- If no business_intelligence exists, insert one (handle case where management_accounts didn't exist)
    EXECUTE '
      INSERT INTO service_lines (code, name, description, status)
      SELECT ''business_intelligence'', ''Business Intelligence'', 
             ''Financial clarity with True Cash position, KPIs, AI insights, forecasts and scenario modelling'',
             ''active''
      WHERE NOT EXISTS (SELECT 1 FROM service_lines WHERE code = ''business_intelligence'')
    ';
  END IF;
END $$;

-- ============================================================================
-- 15. UPDATE CLIENT_SERVICE_LINE_ASSIGNMENTS (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_service_line_assignments') THEN
    EXECUTE 'UPDATE client_service_line_assignments SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- 16. UPDATE PRACTICE_SERVICE_LINES (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_service_lines') THEN
    EXECUTE 'UPDATE practice_service_lines SET service_line_code = ''business_intelligence'' WHERE service_line_code = ''management_accounts''';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Service Line Metadata' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM service_line_metadata WHERE code = 'business_intelligence') 
            THEN 'Updated' ELSE 'Not found' END as status
UNION ALL
SELECT 'Timing Rules', 
       (SELECT COUNT(*)::text || ' rows' FROM service_timing_rules WHERE service_code = 'business_intelligence')
UNION ALL
SELECT 'Advisory Triggers', 
       (SELECT COUNT(*)::text || ' rows' FROM service_advisory_triggers WHERE service_code = 'business_intelligence')
UNION ALL
SELECT 'Contraindications', 
       (SELECT COUNT(*)::text || ' rows' FROM service_contraindications WHERE service_code = 'business_intelligence')
UNION ALL
SELECT 'Value Calculations', 
       (SELECT COUNT(*)::text || ' rows' FROM service_value_calculations WHERE service_code = 'business_intelligence')
UNION ALL
SELECT 'Narrative Templates', 
       (SELECT COUNT(*)::text || ' rows' FROM service_narrative_templates WHERE service_code = 'business_intelligence');

-- Check for any remaining management_accounts references
SELECT 'Remaining MA references in service_line_metadata' as check_type,
       COUNT(*)::text as count
FROM service_line_metadata WHERE code = 'management_accounts'
UNION ALL
SELECT 'Remaining MA references in service_timing_rules',
       COUNT(*)::text
FROM service_timing_rules WHERE service_code = 'management_accounts'
UNION ALL
SELECT 'Remaining MA references in service_line_assessments',
       COUNT(*)::text
FROM service_line_assessments WHERE service_line_code = 'management_accounts';

