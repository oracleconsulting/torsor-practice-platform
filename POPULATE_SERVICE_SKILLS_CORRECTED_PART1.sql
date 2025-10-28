-- ==============================================================
-- POPULATE BSG SERVICE SKILL ASSIGNMENTS - CORRECTED
-- Using EXACT skill names from RPGCC 111-skill matrix
-- ==============================================================

DO $$
DECLARE
  v_practice_id UUID;
  v_count INTEGER := 0;
BEGIN
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BSG SERVICE SKILL ASSIGNMENTS (CORRECTED)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Practice ID: %', v_practice_id;
  RAISE NOTICE '';
  
  DELETE FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE '✓ Cleared existing assignments';
  RAISE NOTICE '';
  
  -- ==============================================================
  -- 1. AUTOMATION (12 skills)
  -- ==============================================================
  RAISE NOTICE '1. AUTOMATION...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Xero Complete Mastery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'QuickBooks Advanced';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 2, 3, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Sage Business Cloud';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Dext (Receipt Bank)';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Zapier/Make Automation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'API Understanding';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel Power Query';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Bank Reconciliation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Double Entry Bookkeeping';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Workflow Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'System Migration Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Data Import/Export';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '   ✓ Added % skills', v_count;
  
  -- ==============================================================
  -- 2. MANAGEMENT ACCOUNTS (14 skills)
  -- ==============================================================
  RAISE NOTICE '2. MANAGEMENT ACCOUNTS...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Management Pack Production';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Statements Preparation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, true, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Accruals & Prepayments';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Debtor & Creditor Control';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Bank Reconciliation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Framework Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel Power Query';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Executive Summary Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'UK GAAP Knowledge';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Variance Commentary';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Cash Flow Waterfall Charts';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI Development';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Proactive Communication';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Expectation Management';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '   ✓ Added % skills', v_count;
  
  -- ==============================================================
  -- 3. ADVISORY / FUTURE FINANCIAL INFORMATION (16 skills)
  -- ==============================================================
  RAISE NOTICE '3. ADVISORY (Future Financial Information)...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Budget Preparation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Three-way Forecasting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Valuations';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Scenario Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Strategic Options Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Commercial Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Working Capital Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name IN ('Advisory Selling', 'Client Education');
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Investment Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Debt Management Advisory';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Profit Improvement Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Model Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Board Presentation Skills';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Investor Relations Support';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Influencing & Persuasion';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '   ✓ Added % skills', v_count;
  
  -- ==============================================================
  -- 4. BENCHMARKING (8 skills)
  -- ==============================================================
  RAISE NOTICE '4. BENCHMARKING...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Framework Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Variance Commentary';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Dashboard Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel Power Query';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI Development';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Spotlight Reporting Mastery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Benchmarking Interpretation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Board Presentation Skills';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '   ✓ Added % skills', v_count;
  
  -- Continue with remaining services...
  -- (Due to length, showing pattern for first 4 services)
  -- Will provide complete script in next message
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 1 complete (first 4 services)';
  RAISE NOTICE '';
  
END $$;

