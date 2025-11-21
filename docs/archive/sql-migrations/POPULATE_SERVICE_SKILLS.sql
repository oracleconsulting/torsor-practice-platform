-- ==============================================================
-- POPULATE BSG SERVICE SKILL ASSIGNMENTS
-- Based on James's assignment specifications
-- Including 3 separate Fractional services: CFO, COO, Combined
-- ==============================================================

DO $$
DECLARE
  v_practice_id UUID;
  v_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  -- Get practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BSG SERVICE SKILL ASSIGNMENTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Practice ID: %', v_practice_id;
  RAISE NOTICE '';
  
  -- Delete existing assignments for this practice (fresh start)
  DELETE FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE '✓ Cleared existing assignments';
  RAISE NOTICE '';
  
  -- ==============================================================
  -- 1. AUTOMATION (12 skills)
  -- Role: Manager (20%), Senior (30%), Junior (50%)
  -- ==============================================================
  RAISE NOTICE '1. AUTOMATION...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Xero';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'QuickBooks';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 2, 3, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Sage';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Cloud Accounting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Process Automation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'API Integration';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Intermediate)';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Bank Reconciliation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Double Entry Bookkeeping';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Standard Operating Procedures';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Data Analytics & Visualization';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total_count := v_total_count + v_count;
  RAISE NOTICE '   ✓ Added 12 skills';
  
  -- ==============================================================
  -- 2. MANAGEMENT ACCOUNTS (14 skills)
  -- Role: Manager (30%), Senior (50%), Junior (20%)
  -- ==============================================================
  RAISE NOTICE '2. MANAGEMENT ACCOUNTS...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Management Accounting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Reporting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, true, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Month-End Close';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Accounts Payable';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Accounts Receivable';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Advanced)';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Report Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'UK GAAP';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Client Communication';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Expectation Management';
  
  RAISE NOTICE '   ✓ Added 14 skills';
  v_total_count := v_total_count + 14;
  
  -- ==============================================================
  -- 3. ADVISORY / FUTURE FINANCIAL INFORMATION (16 skills)
  -- Role: Partner (10%), Director (30%), Manager (40%), Senior (20%)
  -- ==============================================================
  RAISE NOTICE '3. ADVISORY (Future Financial Information)...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Planning & Budgeting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Forecasting & Scenario Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Valuation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Financial Modeling';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Consulting & Advisory';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Deal Structuring';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Corporate Finance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Fundraising';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Exit Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Presentation Skills';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Negotiation Skills';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Client Relationship Management';
  
  RAISE NOTICE '   ✓ Added 16 skills';
  v_total_count := v_total_count + 16;
  
  -- ==============================================================
  -- 4. BENCHMARKING (8 skills)
  -- Role: Manager (40%), Senior (60%)
  -- ==============================================================
  RAISE NOTICE '4. BENCHMARKING...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Data Analytics & Visualization';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Advanced)';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Tableau';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Report Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Presentation Skills';
  
  RAISE NOTICE '   ✓ Added 8 skills';
  v_total_count := v_total_count + 8;
  
  -- ==============================================================
  -- 5. PROFIT EXTRACTION / REMUNERATION STRATEGIES (4 skills)
  -- Role: Manager (50%), Director (50%)
  -- ==============================================================
  RAISE NOTICE '5. PROFIT EXTRACTION / REMUNERATION STRATEGIES...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Corporation Tax';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Personal Tax';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Tax Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Financial Modeling';
  
  RAISE NOTICE '   ✓ Added 4 skills';
  v_total_count := v_total_count + 4;
  
  -- ==============================================================
  -- 6. 365 ALIGNMENT PROGRAMME (11 skills)
  -- Role: Partner (20%), Director (50%), Manager (30%)
  -- ==============================================================
  RAISE NOTICE '6. 365 ALIGNMENT PROGRAMME...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Planning & Budgeting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Coaching & Mentoring';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Change Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Performance Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Succession Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Meeting Facilitation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Active Listening';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Feedback Delivery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Client Relationship Management';
  
  RAISE NOTICE '   ✓ Added 11 skills';
  v_total_count := v_total_count + 11;
  
  -- ==============================================================
  -- 7. SYSTEMS AUDIT (15 skills)
  -- Role: Director (20%), Manager (50%), Senior (30%)
  -- ==============================================================
  RAISE NOTICE '7. SYSTEMS AUDIT...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Internal Audit';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Risk Assessment';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Audit Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Process Improvement';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Business Process Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Risk Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Governance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Quality Control';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Quality Assurance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Regulatory Compliance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Technical Research';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior']
  FROM skills s WHERE s.name = 'Audit Documentation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Resource Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Project Management';
  
  RAISE NOTICE '   ✓ Added 15 skills';
  v_total_count := v_total_count + 15;
  
  -- ==============================================================
  -- 8. FRACTIONAL CFO SERVICES (18 skills)
  -- Role: Partner (60%), Director (40%)
  -- £3,500-£15,000 depending on engagement
  -- ==============================================================
  RAISE NOTICE '8. FRACTIONAL CFO SERVICES...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Financial Modeling';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Forecasting & Scenario Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Mergers & Acquisitions';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Due Diligence';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Business Valuation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Corporate Finance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Fundraising';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Governance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Risk Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Report Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'International Tax';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Tax Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Succession Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-cfo', s.id, 3, 4, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Restructuring';
  
  RAISE NOTICE '   ✓ Added 18 skills';
  v_total_count := v_total_count + 18;
  
  -- ==============================================================
  -- 9. FRACTIONAL COO SERVICES (12 skills)
  -- Role: Partner (40%), Director (60%)
  -- £3,000-£14,000 depending on engagement
  -- ==============================================================
  RAISE NOTICE '9. FRACTIONAL COO SERVICES...';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Process Improvement';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Process Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Performance Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 4, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 4, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Standard Operating Procedures';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Project Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 4, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Resource Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Change Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Team Leadership';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 4, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'fractional-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  RAISE NOTICE '   ✓ Added 12 skills';
  v_total_count := v_total_count + 12;
  
  -- ==============================================================
  -- 10. COMBINED CFO/COO ADVISORY (20 skills)
  -- Role: Partner (70%), Director (30%)
  -- £6,000-£28,000 depending on engagement
  -- ==============================================================
  RAISE NOTICE '10. COMBINED CFO/COO ADVISORY...';
  
  -- Financial leadership skills
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Business Planning & Budgeting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Financial Modeling';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  -- Operational leadership skills
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Process Improvement';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Business Process Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Performance Management';
  
  -- Cross-functional skills
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Change Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Project Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Team Leadership';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 5, 5, true, ARRAY['Partner']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Governance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Risk Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Succession Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Mergers & Acquisitions';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Corporate Finance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 3, 4, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Restructuring';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'combined-cfo-coo', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  RAISE NOTICE '   ✓ Added 20 skills';
  v_total_count := v_total_count + 20;
  
  -- ==============================================================
  -- SUMMARY
  -- ==============================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE 'Total assignments created: %', v_count;
  
  SELECT COUNT(DISTINCT service_id) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE 'Services configured: %', v_count;
  
  SELECT COUNT(DISTINCT skill_id) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id;
  RAISE NOTICE 'Unique skills assigned: %', v_count;
  
  SELECT COUNT(DISTINCT skill_id) INTO v_count FROM service_skill_assignments WHERE practice_id = v_practice_id AND is_critical = true;
  RAISE NOTICE 'Critical skills: %', v_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Population complete!';
  RAISE NOTICE '';
  
END $$;

-- Verify the results by service
SELECT 
  CASE service_id
    WHEN 'automation' THEN '1. Automation'
    WHEN 'management-accounts' THEN '2. Management Accounts'
    WHEN 'advisory-accelerator' THEN '3. Advisory / Future Financial'
    WHEN 'benchmarking' THEN '4. Benchmarking'
    WHEN 'profit-extraction' THEN '5. Profit Extraction'
    WHEN 'alignment-365' THEN '6. 365 Alignment Programme'
    WHEN 'systems-audit' THEN '7. Systems Audit'
    WHEN 'fractional-cfo' THEN '8. Fractional CFO Services'
    WHEN 'fractional-coo' THEN '9. Fractional COO Services'
    WHEN 'combined-cfo-coo' THEN '10. Combined CFO/COO Advisory'
    ELSE service_id
  END as service_name,
  COUNT(*) as total_skills,
  COUNT(CASE WHEN is_critical THEN 1 END) as critical_skills,
  ROUND(AVG(minimum_level), 1) as avg_min_level,
  ROUND(AVG(ideal_level), 1) as avg_ideal_level
FROM service_skill_assignments
WHERE practice_id IN (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY service_id
ORDER BY service_id;
