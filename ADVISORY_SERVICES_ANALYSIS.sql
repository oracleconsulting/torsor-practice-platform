-- ==============================================================
-- ADVISORY SERVICES ANALYSIS FOR PARTNER PRESENTATION
-- ==============================================================
-- Run these queries in Supabase SQL Editor
-- Export results to Excel/CSV for your presentation
-- ==============================================================

-- QUERY 1: All Skills Assigned to Services (with team coverage)
-- Shows which skills are being used for advisory services and who has them
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  ssa.service_id,
  -- Convert service_id to human-readable name
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
  END as service_name,
  sk.category as skill_category,
  sk.name as skill_name,
  ssa.minimum_level,
  ssa.ideal_level,
  ssa.is_critical,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN sa.team_member_id END) as experts_available,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) as meets_minimum,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN sa.team_member_id END) as meets_ideal,
  STRING_AGG(DISTINCT 
    CASE WHEN sa.current_level >= 4 
    THEN (SELECT name FROM practice_members WHERE id = sa.team_member_id) 
    END, ', '
  ) as expert_names
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_id, sk.id, sk.category, sk.name, ssa.minimum_level, ssa.ideal_level, ssa.is_critical
ORDER BY service_name, sk.category, sk.name;


-- QUERY 2: Service Summary with Role Distribution
-- Shows how many skills each service needs and which roles can deliver them
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
  END as service_name,
  COUNT(DISTINCT ssa.skill_id) as total_skills_required,
  COUNT(DISTINCT CASE WHEN ssa.is_critical THEN ssa.skill_id END) as critical_skills,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) as skills_meet_minimum,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN ssa.skill_id END) as skills_meet_ideal,
  COUNT(DISTINCT ssa.skill_id) - COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) as skill_gaps,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as minimum_coverage_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as ideal_coverage_pct,
  -- Role breakdown (team members with level >= minimum in ANY of the service's skills)
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level AND pm.role ILIKE '%partner%' THEN pm.id END) as partners_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level AND pm.role ILIKE '%director%' THEN pm.id END) as directors_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level AND pm.role ILIKE '%manager%' THEN pm.id END) as managers_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level AND pm.role ILIKE '%senior%' THEN pm.id END) as seniors_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level AND pm.role ILIKE '%accountant%' THEN pm.id END) as accountants_qualified
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_id
ORDER BY minimum_coverage_pct ASC, skill_gaps DESC;


-- QUERY 3: ⚠️ CRITICAL - UNASSIGNED SKILLS ⚠️
-- Skills your team has but are NOT assigned to any service
-- These represent untapped potential or skills you're paying for but not leveraging!
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  sk.category as skill_category,
  sk.name as skill_name,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level,
  MAX(sa.current_level) as highest_level_in_team,
  STRING_AGG(
    DISTINCT pm.name || ' (L' || sa.current_level || ')', 
    ', '
  ) as team_members_and_levels
FROM skills sk
JOIN skill_assessments sa ON sk.id = sa.skill_id
JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
CROSS JOIN your_practice yp
WHERE NOT EXISTS (
  SELECT 1 FROM service_skill_assignments ssa 
  WHERE ssa.skill_id = sk.id 
  AND ssa.practice_id = yp.id
)
GROUP BY sk.id, sk.category, sk.name
HAVING AVG(sa.current_level) >= 2  -- Only show skills where team has some competency
ORDER BY avg_skill_level DESC, highest_level_in_team DESC, skill_category, skill_name;


-- QUERY 4: Service Readiness Ranking
-- Which services are we MOST ready to deliver vs. which need development?
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
  END as service_name,
  COUNT(DISTINCT ssa.skill_id) as skills_required,
  COUNT(DISTINCT CASE WHEN ssa.is_critical THEN ssa.skill_id END) as critical_skills,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN ssa.skill_id END) as skills_at_ideal_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) as skills_at_minimum_level,
  COUNT(DISTINCT CASE WHEN COALESCE(sa.current_level, 0) < ssa.minimum_level THEN ssa.skill_id END) as skills_below_minimum,
  ROUND(AVG(sa.current_level), 1) as avg_team_skill_level,
  ROUND(AVG(ssa.ideal_level), 1) as avg_ideal_level_needed,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) * 100.0 / NULLIF(COUNT(DISTINCT ssa.skill_id), 0) >= 80 THEN '✅ HIGH CONFIDENCE'
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) * 100.0 / NULLIF(COUNT(DISTINCT ssa.skill_id), 0) >= 60 THEN '⚠️ MODERATE CONFIDENCE'
    ELSE '❌ DEVELOPMENT NEEDED'
  END as delivery_confidence,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) || '%' as readiness_percentage
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_id
ORDER BY 
  AVG(sa.current_level) DESC,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) DESC;


-- ==============================================================
-- BONUS QUERY 5: Top Skills to Train (Highest Impact)
-- Skills that appear in MULTIPLE services but team is weak in
-- Training these will improve capability across multiple services
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  sk.name as skill_name,
  sk.category as skill_category,
  COUNT(DISTINCT ssa.service_id) as used_in_services_count,
  STRING_AGG(DISTINCT 
    CASE ssa.service_id
      WHEN 'automation' THEN 'Automation'
      WHEN 'management-accounts' THEN 'Management Accounts'
      WHEN 'advisory-accelerator' THEN 'Advisory Accelerator'
      WHEN 'transactions' THEN 'Transactions'
      WHEN 'technical-compliance' THEN 'Technical Compliance'
      WHEN 'company-secretarial' THEN 'Company Secretarial'
      WHEN 'hr-consultancy' THEN 'HR Consultancy'
      WHEN 'tax-consultancy' THEN 'Tax Consultancy'
      WHEN 'bookkeeping' THEN 'Bookkeeping'
      WHEN 'payroll' THEN 'Payroll'
      ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
    END, 
    ', '
  ) as services_requiring_this,
  ROUND(AVG(ssa.ideal_level), 1) as avg_ideal_level_needed,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as current_avg_team_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN sa.team_member_id END) as current_experts,
  ROUND(AVG(ssa.ideal_level) - COALESCE(AVG(sa.current_level), 0), 1) as skill_gap,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN ssa.is_critical THEN ssa.service_id END) > 0 THEN '🔴 CRITICAL'
    ELSE ''
  END as urgency_flag
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY sk.id, sk.name, sk.category
HAVING 
  COUNT(DISTINCT ssa.service_id) >= 2  -- Used in at least 2 services
  AND COALESCE(AVG(sa.current_level), 0) < AVG(ssa.ideal_level)  -- Team avg below ideal
ORDER BY 
  CASE WHEN COUNT(DISTINCT CASE WHEN ssa.is_critical THEN ssa.service_id END) > 0 THEN 0 ELSE 1 END,  -- Critical first
  COUNT(DISTINCT ssa.service_id) DESC,  -- Most services first
  (AVG(ssa.ideal_level) - COALESCE(AVG(sa.current_level), 0)) DESC;  -- Biggest gap first


-- ==============================================================
-- BONUS QUERY 6: Critical Skills Coverage Analysis
-- Focus on skills marked as "is_critical = true"
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
  END as service_name,
  sk.name as critical_skill_name,
  sk.category as skill_category,
  ssa.minimum_level as required_minimum,
  ssa.ideal_level as required_ideal,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) as team_meets_minimum,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN sa.team_member_id END) as team_meets_ideal,
  STRING_AGG(
    DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level 
    THEN pm.name || ' (L' || sa.current_level || ')'
    END,
    ', '
  ) as qualified_team_members,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) = 0 THEN '🔴 NO COVERAGE'
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) = 1 THEN '⚠️ SINGLE POINT OF FAILURE'
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN sa.team_member_id END) >= 2 THEN '✅ GOOD COVERAGE'
    ELSE '⚠️ ADEQUATE'
  END as risk_status
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
WHERE ssa.practice_id = yp.id
  AND ssa.is_critical = true
ORDER BY 
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) = 0 THEN 0
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) = 1 THEN 1
    ELSE 2
  END,
  service_name,
  sk.name;


-- ==============================================================
-- HOW TO USE THESE QUERIES:
-- ==============================================================
-- 1. Copy each query separately into Supabase SQL Editor
-- 2. Click "Run" for each one
-- 3. Export results to CSV/Excel (use the export button)
-- 4. Use in your presentation:
--    - Query 1: Detail view of skills per service (with min/ideal levels)
--    - Query 2: Executive summary with role distribution
--    - Query 3: ⚠️ CRITICAL - Show unassigned skills (untapped potential)
--    - Query 4: Service readiness ranking (traffic light status)
--    - Query 5: Training priorities for maximum impact (cross-service skills)
--    - Query 6: Critical skills risk analysis (single points of failure)
-- ==============================================================
