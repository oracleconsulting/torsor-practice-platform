-- ==============================================================
-- POPULATE BSG SERVICE SKILL ASSIGNMENTS
-- Based on James's assignment specifications
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
  
  -- Xero (Critical, level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Xero';
  
  -- QuickBooks (Critical, level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'QuickBooks';
  
  -- Sage (level 2-3)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 2, 3, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Sage';
  
  -- Cloud Accounting (Critical, level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Cloud Accounting';
  
  -- Process Automation (Critical, level 3-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Process Automation';
  
  -- API Integration (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'API Integration';
  
  -- Excel (Intermediate) (Critical, level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, true, ARRAY['Junior', 'Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Intermediate)';
  
  -- Bank Reconciliation (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Bank Reconciliation';
  
  -- Double Entry Bookkeeping (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Double Entry Bookkeeping';
  
  -- Workflow Design (Critical, level 3-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  -- Standard Operating Procedures (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'automation', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Standard Operating Procedures';
  
  -- Data Analytics & Visualization (level 3-4)
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
  
  -- Management Accounting (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Management Accounting';
  
  -- Financial Reporting (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Reporting';
  
  -- Month-End Close (Critical, level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, true, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Month-End Close';
  
  -- Accounts Payable (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Accounts Payable';
  
  -- Accounts Receivable (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Junior', 'Senior']
  FROM skills s WHERE s.name = 'Accounts Receivable';
  
  -- KPI Analysis (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  -- Excel (Advanced) (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Advanced)';
  
  -- Report Writing (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Report Writing';
  
  -- UK GAAP (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'UK GAAP';
  
  -- Financial Analysis (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Analysis';
  
  -- Cash Flow Management (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  -- Power BI (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI';
  
  -- Client Communication (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'management-accounts', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Client Communication';
  
  -- Expectation Management (level 3-4)
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
  
  -- Business Planning & Budgeting (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Planning & Budgeting';
  
  -- Forecasting & Scenario Planning (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Forecasting & Scenario Planning';
  
  -- Business Valuation (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Valuation';
  
  -- Financial Modeling (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Financial Modeling';
  
  -- Strategic Thinking (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  -- Commercial Acumen (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  -- Cash Flow Management (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Cash Flow Management';
  
  -- Consulting & Advisory (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Consulting & Advisory';
  
  -- Deal Structuring (level 3-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Deal Structuring';
  
  -- Corporate Finance (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Corporate Finance';
  
  -- Fundraising (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Fundraising';
  
  -- Exit Planning (level 3-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 5, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Exit Planning';
  
  -- Presentation Skills (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Presentation Skills';
  
  -- Stakeholder Management (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 4, 5, false, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  -- Negotiation Skills (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'advisory-accelerator', s.id, 3, 4, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Negotiation Skills';
  
  -- Client Relationship Management (Critical, level 4-5)
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
  
  -- KPI Analysis (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'KPI Analysis';
  
  -- Financial Analysis (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Financial Analysis';
  
  -- Data Analytics & Visualization (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Data Analytics & Visualization';
  
  -- Excel (Advanced) (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Excel (Advanced)';
  
  -- Power BI (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Power BI';
  
  -- Tableau (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Tableau';
  
  -- Report Writing (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 4, 5, true, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Report Writing';
  
  -- Presentation Skills (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'benchmarking', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Presentation Skills';
  
  RAISE NOTICE '   ✓ Added 8 skills';
  v_total_count := v_total_count + 8;
  
  -- ==============================================================
  -- 5. 365 ALIGNMENT PROGRAMME (12 skills)
  -- Role: Partner (20%), Director (50%), Manager (30%)
  -- ==============================================================
  RAISE NOTICE '5. 365 ALIGNMENT PROGRAMME...';
  
  -- Strategic Thinking (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  -- Business Planning & Budgeting (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Manager', 'Director', 'Partner']
  FROM skills s WHERE s.name = 'Business Planning & Budgeting';
  
  -- Coaching & Mentoring (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Coaching & Mentoring';
  
  -- Change Management (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Change Management';
  
  -- Performance Management (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Performance Management';
  
  -- Succession Planning (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Succession Planning';
  
  -- Commercial Acumen (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  -- Meeting Facilitation (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Meeting Facilitation';
  
  -- Active Listening (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Active Listening';
  
  -- Feedback Delivery (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Feedback Delivery';
  
  -- Performance Management as Goal Setting (level 3-4) - Note: Using Performance Management as proxy
  -- Client Relationship Management (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'alignment-365', s.id, 4, 5, true, ARRAY['Director', 'Partner']
  FROM skills s WHERE s.name = 'Client Relationship Management';
  
  RAISE NOTICE '   ✓ Added 11 skills (12 requested, Performance Management used for Goal Setting)';
  v_total_count := v_total_count + 11;
  
  -- ==============================================================
  -- 6. SYSTEMS AUDIT (15 skills)
  -- Role: Director (20%), Manager (50%), Senior (30%)
  -- ==============================================================
  RAISE NOTICE '6. SYSTEMS AUDIT...';
  
  -- Internal Audit (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Internal Audit';
  
  -- Risk Assessment (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Senior', 'Manager', 'Director']
  FROM skills s WHERE s.name = 'Risk Assessment';
  
  -- Audit Planning (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Audit Planning';
  
  -- Process Improvement (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Process Improvement';
  
  -- Business Process Analysis (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Business Process Analysis';
  
  -- Risk Management (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Risk Management';
  
  -- Governance (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Governance';
  
  -- Quality Control (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Quality Control';
  
  -- Quality Assurance (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Quality Assurance';
  
  -- Regulatory Compliance (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Regulatory Compliance';
  
  -- Technical Research (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior', 'Manager']
  FROM skills s WHERE s.name = 'Technical Research';
  
  -- Audit Documentation (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Senior']
  FROM skills s WHERE s.name = 'Audit Documentation';
  
  -- Workflow Design (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Workflow Design';
  
  -- Resource Planning (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 3, 4, false, ARRAY['Manager']
  FROM skills s WHERE s.name = 'Resource Planning';
  
  -- Project Management (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'systems-audit', s.id, 4, 5, true, ARRAY['Manager', 'Director']
  FROM skills s WHERE s.name = 'Project Management';
  
  RAISE NOTICE '   ✓ Added 15 skills';
  v_total_count := v_total_count + 15;
  
  -- ==============================================================
  -- 7. FRACTIONAL CFO/COO (18 skills) - NEW SERVICE
  -- Role: Partner (60%), Director (40%)
  -- ==============================================================
  RAISE NOTICE '7. FRACTIONAL CFO/COO...';
  
  -- Note: Using 'profit-extraction' as service_id for now (closest match)
  -- You may want to create a new service_id 'fractional-cfo-coo'
  
  -- Strategic Thinking (Critical, level 5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Strategic Thinking';
  
  -- Commercial Acumen (Critical, level 5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Commercial Acumen';
  
  -- Mergers & Acquisitions (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Mergers & Acquisitions';
  
  -- Due Diligence (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Due Diligence';
  
  -- Transaction Services (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Transaction Services';
  
  -- Corporate Finance (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Corporate Finance';
  
  -- Equity Analysis (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Equity Analysis';
  
  -- Debt Advisory (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Debt Advisory';
  
  -- Business Valuation (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Business Valuation';
  
  -- Governance (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Governance';
  
  -- Risk Management (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Risk Management';
  
  -- Team Leadership (Critical, level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, true, ARRAY['Partner']
  FROM skills s WHERE s.name = 'Team Leadership';
  
  -- Stakeholder Management (Critical, level 5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 5, 5, true, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Stakeholder Management';
  
  -- Report Writing (as Board Reporting proxy) (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Report Writing';
  
  -- International Tax (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'International Tax';
  
  -- Tax Planning (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Director']
  FROM skills s WHERE s.name = 'Tax Planning';
  
  -- Succession Planning (level 4-5)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 4, 5, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Succession Planning';
  
  -- Restructuring (level 3-4)
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical, required_seniority)
  SELECT v_practice_id, 'profit-extraction', s.id, 3, 4, false, ARRAY['Partner', 'Director']
  FROM skills s WHERE s.name = 'Restructuring';
  
  RAISE NOTICE '   ✓ Added 18 skills (mapped to profit-extraction service_id)';
  v_total_count := v_total_count + 18;
  
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
    WHEN 'alignment-365' THEN '5. 365 Alignment Programme'
    WHEN 'systems-audit' THEN '6. Systems Audit'
    WHEN 'profit-extraction' THEN '7. Fractional CFO/COO (temp ID)'
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
