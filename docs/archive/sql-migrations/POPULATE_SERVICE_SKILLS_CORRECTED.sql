-- ==============================================================
-- CORRECTED POPULATION SCRIPT
-- Uses ONLY skills that exist in your 111-skill database
-- ==============================================================

-- First, get the practice_id for RPGCC
DO $$
DECLARE
  v_practice_id uuid;
BEGIN
  -- Get the practice_id
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC';
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;
  
  -- Clear existing assignments for this practice
  DELETE FROM service_skill_assignments WHERE practice_id = v_practice_id;
  
  -- ==============================================================
  -- 1. AUTOMATION (service_id: 'automation')
  -- ==============================================================
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, true FROM skills WHERE name = 'Xero Complete Mastery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, true FROM skills WHERE name = 'QuickBooks Advanced';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, false FROM skills WHERE name = 'Sage Business Cloud';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, true FROM skills WHERE name = 'Zapier/Make Automation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, false FROM skills WHERE name = 'API Understanding';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, true FROM skills WHERE name = 'Excel Power Query';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 2, 3, true FROM skills WHERE name = 'Bank Reconciliation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 2, 3, true FROM skills WHERE name = 'Double Entry Bookkeeping';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, false FROM skills WHERE name = 'Workflow Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, false FROM skills WHERE name = 'Dashboard Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'automation', id, 3, 4, false FROM skills WHERE name = 'System Migration Planning';
  
  -- ==============================================================
  -- 2. MANAGEMENT ACCOUNTS (service_id: 'management-accounts')
  -- ==============================================================
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Management Pack Production';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Financial Statements Preparation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Accruals & Prepayments';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Debtor & Creditor Control';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'KPI Framework Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 4, 5, false FROM skills WHERE name = 'Excel Power Pivot';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'Executive Summary Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'UK GAAP Knowledge';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Variance Commentary';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'Working Capital Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'Spotlight Reporting Mastery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'Power BI Development';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, false FROM skills WHERE name = 'Proactive Communication';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'management-accounts', id, 3, 4, true FROM skills WHERE name = 'Expectation Management';
  
  -- ==============================================================
  -- 3. ADVISORY (service_id: 'advisory')
  -- ==============================================================
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 5, true FROM skills WHERE name = 'Budget Preparation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, true FROM skills WHERE name = 'Three-way Forecasting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, false FROM skills WHERE name = 'Scenario Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, false FROM skills WHERE name = 'Business Valuations';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, true FROM skills WHERE name = 'Strategic Options Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, true FROM skills WHERE name = 'Commercial Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Working Capital Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Advisory Selling';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Investment Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Debt Management Advisory';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Investor Relations Support';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Business Model Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 4, 5, true FROM skills WHERE name = 'Board Presentation Skills';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Influencing & Persuasion';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'advisory', id, 3, 4, false FROM skills WHERE name = 'Client Education';
  
  -- ==============================================================
  -- 4. BENCHMARKING (service_id: 'benchmarking')
  -- ==============================================================
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, true FROM skills WHERE name = 'KPI Framework Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, true FROM skills WHERE name = 'Variance Commentary';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, true FROM skills WHERE name = 'Dashboard Design';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, false FROM skills WHERE name = 'Benchmarking Interpretation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 4, 5, false FROM skills WHERE name = 'Excel Power Query';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, false FROM skills WHERE name = 'Power BI Development';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, false FROM skills WHERE name = 'Executive Summary Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'benchmarking', id, 3, 4, false FROM skills WHERE name = 'Board Presentation Skills';
  
  -- ==============================================================
  -- 5. 365 ALIGNMENT PROGRAMME (service_id: '365-alignment')
  -- ==============================================================
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 4, 5, true FROM skills WHERE name = 'Strategic Options Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Budget Preparation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Training Design & Delivery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Innovation Leadership';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, true FROM skills WHERE name = 'Performance Management';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Succession Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 4, 5, true FROM skills WHERE name = 'Commercial Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Active Listening';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Work Review & Feedback';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, '365-alignment', id, 3, 4, false FROM skills WHERE name = 'Client Education';
  
  -- ==============================================================
  -- 6. SYSTEMS AUDIT (service_id: 'systems-audit')
  -- ==============================================================
  -- NOTE: Many audit-specific skills don't exist in the 111-skill matrix
  -- Using closest matches from available skills
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'Cost Reduction Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, true FROM skills WHERE name = 'Workflow Optimisation';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'Business Model Analysis';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'Making Tax Digital Compliance';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'ChatGPT/Claude for Accounting';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'Executive Summary Writing';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'systems-audit', id, 3, 4, false FROM skills WHERE name = 'Delegation & Prioritisation';
  
  -- ==============================================================
  -- 7. FRACTIONAL CFO/COO (service_id: 'fractional-cfo-coo')
  -- ==============================================================
  -- NOTE: Many M&A and governance skills don't exist
  -- Using available strategic/financial advisory skills
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 5, 5, true FROM skills WHERE name = 'Strategic Options Appraisal';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 5, 5, true FROM skills WHERE name = 'Commercial Thinking';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 4, 5, false FROM skills WHERE name = 'Debt Management Advisory';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 4, 5, false FROM skills WHERE name = 'Business Valuations';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 4, 5, false FROM skills WHERE name = 'Training Design & Delivery';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 4, 5, false FROM skills WHERE name = 'Investor Relations Support';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 5, 5, true FROM skills WHERE name = 'Board Presentation Skills';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 3, 4, false FROM skills WHERE name = 'Capital Gains Tax Planning';
  
  INSERT INTO service_skill_assignments (practice_id, service_id, skill_id, minimum_level, ideal_level, is_critical)
  SELECT v_practice_id, 'fractional-cfo-coo', id, 3, 4, false FROM skills WHERE name = 'Succession Planning';
  
  RAISE NOTICE 'Service skill assignments populated successfully for practice: %', v_practice_id;
  
END $$;

-- ==============================================================
-- VERIFICATION QUERY
-- ==============================================================
-- Run this after to see what was inserted:

SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN '1. Automation'
    WHEN 'management-accounts' THEN '2. Management Accounts'
    WHEN 'advisory' THEN '3. Advisory'
    WHEN 'benchmarking' THEN '4. Benchmarking'
    WHEN '365-alignment' THEN '5. 365 Alignment Programme'
    WHEN 'systems-audit' THEN '6. Systems Audit'
    WHEN 'fractional-cfo-coo' THEN '7. Fractional CFO/COO'
    ELSE ssa.service_id
  END as service_name,
  COUNT(*) as total_skills,
  SUM(CASE WHEN ssa.is_critical THEN 1 ELSE 0 END) as critical_skills,
  ROUND(AVG(ssa.minimum_level), 1) as avg_min_level,
  ROUND(AVG(ssa.ideal_level), 1) as avg_ideal_level
FROM service_skill_assignments ssa
WHERE ssa.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY ssa.service_id
ORDER BY ssa.service_id;
