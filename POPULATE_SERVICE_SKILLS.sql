-- ==============================================================
-- POPULATE SERVICE SKILL ASSIGNMENTS
-- This imports the default skills mapping from the codebase
-- into the database for reporting and analysis
-- ==============================================================

-- Step 1: Get your practice_id
DO $$
DECLARE
  v_practice_id UUID;
  v_skill_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Get practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;
  
  RAISE NOTICE 'Practice ID: %', v_practice_id;
  RAISE NOTICE 'Starting to populate service_skill_assignments...';
  RAISE NOTICE '';
  
  -- Delete existing assignments for this practice (fresh start)
  DELETE FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE 'Cleared existing assignments';
  RAISE NOTICE '';
  
  -- AUTOMATION SERVICE
  RAISE NOTICE 'Populating: Automation...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Intermediate', 'Senior']
  FROM skills s WHERE s.name = 'Xero' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Xero');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Intermediate', 'Senior']
  FROM skills s WHERE s.name = 'QuickBooks' AND EXISTS (SELECT 1 FROM skills WHERE name = 'QuickBooks');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Intermediate', 'Senior']
  FROM skills s WHERE s.name = 'Sage' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Sage');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Senior', 'Director']
  FROM skills s WHERE s.name = 'Data Analytics & Visualization' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Data Analytics & Visualization');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 4, 5, true, ARRAY['Senior', 'Director']
  FROM skills s WHERE s.name = 'Process Improvement' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Process Improvement');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Intermediate', 'Senior']
  FROM skills s WHERE s.name = 'Excel (Advanced)' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Excel (Advanced)');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  -- MANAGEMENT ACCOUNTS SERVICE
  RAISE NOTICE 'Populating: Management Accounts...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Director']
  FROM skills s WHERE s.name = 'Management Accounting' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Management Accounting');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, true, ARRAY['Intermediate', 'Senior']
  FROM skills s WHERE s.name = 'Financial Reporting' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Financial Reporting');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Director']
  FROM skills s WHERE s.name = 'KPI Analysis' AND EXISTS (SELECT 1 FROM skills WHERE name = 'KPI Analysis');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 5, true, ARRAY['Senior', 'Director']
  FROM skills s WHERE s.name = 'Data Analytics & Visualization' AND EXISTS (SELECT 1 FROM skills WHERE name = 'Data Analytics & Visualization');
  
  RAISE NOTICE '  - Added 4 skills';
  
  -- ADVISORY ACCELERATOR (FUTURE FINANCIAL INFO)
  RAISE NOTICE 'Populating: Advisory Accelerator...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Director', 'Partner']
  FROM skills s WHERE s.name IN ('Business Planning & Budgeting', 'Forecasting & Scenario Planning', 'Business Valuation', 
    'Cash Flow Management', 'Financial Modeling', 'Strategic Thinking', 'Commercial Acumen', 'Consulting & Advisory', 
    'Client Relationship Management');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  -- TRANSACTIONS SERVICE
  RAISE NOTICE 'Populating: Transactions...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'transactions', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name IN ('Mergers & Acquisitions', 'Due Diligence', 'Business Valuation', 'Financial Modeling',
    'Deal Structuring', 'Commercial Acumen', 'Negotiation Skills', 'Project Management');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  -- TECHNICAL COMPLIANCE
  RAISE NOTICE 'Populating: Technical Compliance...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'technical-compliance', s.id, 4, 5, true, ARRAY['Senior', 'Director', 'Partner']
  FROM skills s WHERE s.name IN ('UK GAAP', 'IFRS', 'Companies Act', 'Financial Reporting Standards',
    'Audit & Assurance', 'Technical Research', 'Regulatory Compliance');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  -- TAX CONSULTANCY
  RAISE NOTICE 'Populating: Tax Consultancy...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'tax-consultancy', s.id, 4, 5, true, ARRAY['Senior', 'Director', 'Partner']
  FROM skills s WHERE s.name IN ('Corporation Tax', 'Personal Tax', 'VAT', 'Tax Planning',
    'International Tax', 'Tax Research', 'HMRC Liaison');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  -- BOOKKEEPING
  RAISE NOTICE 'Populating: Bookkeeping...';
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'bookkeeping', s.id, 3, 4, true, ARRAY['Junior', 'Intermediate', 'Senior']
  FROM skills s WHERE s.name IN ('Xero', 'QuickBooks', 'Sage', 'Double Entry Bookkeeping',
    'Bank Reconciliation', 'VAT Returns', 'Accounts Payable', 'Accounts Receivable');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '  - Added % skills', v_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ SUCCESS! Service skill assignments populated.';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  SELECT COUNT(*) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE '  Total assignments: %', v_count;
  
  SELECT COUNT(DISTINCT service_id) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE '  Services configured: %', v_count;
  
  SELECT COUNT(DISTINCT skill_id) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE '  Unique skills assigned: %', v_count;
  
END $$;

-- Verify the results
SELECT 
  service_id,
  COUNT(*) as skills_count,
  COUNT(CASE WHEN is_critical THEN 1 END) as critical_skills
FROM service_skill_assignments
WHERE practice_id IN (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY service_id
ORDER BY service_id;

