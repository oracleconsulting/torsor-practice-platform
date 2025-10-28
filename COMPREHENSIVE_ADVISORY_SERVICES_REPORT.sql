-- ==============================================================
-- COMPREHENSIVE ADVISORY SERVICES REPORT
-- For partner presentation showing services, assigned skills, 
-- role coverage, and unassigned skills
-- ==============================================================

-- ==============================================================
-- PART 1: SERVICE OVERVIEW WITH SKILL COUNTS
-- Shows each advisory service with total skills assigned
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator / Future Financial Info'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(ssa.service_id, '-', ' '))
  END as service_name,
  COUNT(DISTINCT ssa.skill_id) as total_skills_assigned,
  COUNT(DISTINCT CASE WHEN ssa.is_critical THEN ssa.skill_id END) as critical_skills,
  ROUND(AVG(ssa.minimum_level), 1) as avg_minimum_level,
  ROUND(AVG(ssa.ideal_level), 1) as avg_ideal_level,
  -- Total team members who can deliver (have at least one skill at minimum level)
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) as team_members_capable,
  -- Coverage percentage
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) 
    / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as coverage_pct
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_id
ORDER BY service_name;


-- ==============================================================
-- PART 2: DETAILED SKILLS PER SERVICE
-- Shows every skill assigned to each service with team coverage
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  CASE ssa.service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator / Future Financial Info'
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
  -- Team coverage stats
  COUNT(DISTINCT sa.team_member_id) as team_has_skill,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN sa.team_member_id END) as meets_minimum,
  COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.ideal_level THEN sa.team_member_id END) as meets_ideal,
  ROUND(AVG(sa.current_level), 1) as avg_team_level,
  -- Expert names
  STRING_AGG(
    DISTINCT CASE WHEN sa.current_level >= 4 
    THEN pm.name 
    END, ', '
  ) as experts
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_id, sk.id, sk.category, sk.name, ssa.minimum_level, ssa.ideal_level, ssa.is_critical
ORDER BY service_name, sk.category, sk.name;


-- ==============================================================
-- PART 3: ROLE BREAKDOWN PER SERVICE
-- Shows which roles can deliver each service
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
),
service_roles AS (
  SELECT 
    ssa.service_id,
    pm.role,
    pm.id as member_id,
    pm.name as member_name,
    COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) as skills_qualified,
    COUNT(DISTINCT ssa.skill_id) as skills_required,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= ssa.minimum_level THEN ssa.skill_id END) 
      / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as qualification_pct
  FROM service_skill_assignments ssa
  CROSS JOIN your_practice yp
  JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
  JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
  WHERE ssa.practice_id = yp.id
  GROUP BY ssa.service_id, pm.role, pm.id, pm.name
)
SELECT 
  CASE service_id
    WHEN 'automation' THEN 'Automation'
    WHEN 'management-accounts' THEN 'Management Accounts'
    WHEN 'advisory-accelerator' THEN 'Advisory Accelerator / Future Financial Info'
    WHEN 'transactions' THEN 'Transactions'
    WHEN 'technical-compliance' THEN 'Technical Compliance'
    WHEN 'company-secretarial' THEN 'Company Secretarial'
    WHEN 'hr-consultancy' THEN 'HR Consultancy'
    WHEN 'tax-consultancy' THEN 'Tax Consultancy'
    WHEN 'bookkeeping' THEN 'Bookkeeping'
    WHEN 'payroll' THEN 'Payroll'
    ELSE INITCAP(REPLACE(service_id, '-', ' '))
  END as service_name,
  role,
  COUNT(DISTINCT member_id) as team_members_in_role,
  ROUND(AVG(qualification_pct), 1) as avg_qualification_pct,
  STRING_AGG(
    member_name || ' (' || skills_qualified || '/' || skills_required || ' skills)',
    ', '
    ORDER BY qualification_pct DESC
  ) as members_and_coverage
FROM service_roles
WHERE qualification_pct >= 30  -- Only show if qualified in at least 30% of skills
GROUP BY service_id, role
ORDER BY service_name, role;


-- ==============================================================
-- PART 4: UNASSIGNED SKILLS (THE CRITICAL ONE!)
-- Skills from the 111 that are NOT assigned to any service
-- These represent gaps or untapped capabilities
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
),
total_skills AS (
  SELECT COUNT(*) as total FROM skills
),
assigned_skills AS (
  SELECT COUNT(DISTINCT skill_id) as assigned 
  FROM service_skill_assignments ssa
  CROSS JOIN your_practice yp
  WHERE ssa.practice_id = yp.id
),
unassigned AS (
  SELECT 
    sk.id,
    sk.category,
    sk.name,
    sk.description
  FROM skills sk
  CROSS JOIN your_practice yp
  WHERE NOT EXISTS (
    SELECT 1 FROM service_skill_assignments ssa 
    WHERE ssa.skill_id = sk.id 
    AND ssa.practice_id = yp.id
  )
)
SELECT 
  (SELECT total FROM total_skills) as total_skills_in_system,
  (SELECT assigned FROM assigned_skills) as skills_assigned_to_services,
  COUNT(*) as skills_unassigned,
  ROUND(100.0 * COUNT(*) / (SELECT total FROM total_skills), 1) as unassigned_percentage
FROM unassigned
UNION ALL
SELECT 
  NULL as total_skills_in_system,
  NULL as skills_assigned_to_services,
  NULL as skills_unassigned,
  NULL as unassigned_percentage
UNION ALL
-- Now list each unassigned skill
SELECT 
  NULL,
  NULL,
  NULL,
  NULL
FROM unassigned
LIMIT 1;

-- Detailed list of unassigned skills
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  sk.category,
  sk.name as skill_name,
  sk.description,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as avg_level,
  MAX(sa.current_level) as highest_level,
  STRING_AGG(
    DISTINCT pm.name || ' (L' || sa.current_level || ')',
    ', '
  ) as team_coverage
FROM skills sk
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
WHERE NOT EXISTS (
  SELECT 1 FROM service_skill_assignments ssa 
  WHERE ssa.skill_id = sk.id 
  AND ssa.practice_id = yp.id
)
GROUP BY sk.id, sk.category, sk.name, sk.description
ORDER BY 
  CASE 
    WHEN COUNT(DISTINCT sa.team_member_id) > 0 THEN 0  -- Skills with team coverage first
    ELSE 1
  END,
  AVG(sa.current_level) DESC NULLS LAST,
  sk.category,
  sk.name;


-- ==============================================================
-- SUMMARY STATISTICS FOR EXECUTIVE OVERVIEW
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  'Total Skills in System' as metric,
  COUNT(DISTINCT sk.id)::text as value
FROM skills sk
UNION ALL
SELECT 
  'Skills Assigned to Services',
  COUNT(DISTINCT ssa.skill_id)::text
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
WHERE ssa.practice_id = yp.id
UNION ALL
SELECT 
  'Skills NOT Assigned to Services',
  COUNT(DISTINCT sk.id)::text
FROM skills sk
CROSS JOIN your_practice yp
WHERE NOT EXISTS (
  SELECT 1 FROM service_skill_assignments ssa 
  WHERE ssa.skill_id = sk.id AND ssa.practice_id = yp.id
)
UNION ALL
SELECT 
  'Total Advisory Services Configured',
  COUNT(DISTINCT ssa.service_id)::text
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
WHERE ssa.practice_id = yp.id
UNION ALL
SELECT 
  'Active Team Members',
  COUNT(DISTINCT pm.id)::text
FROM practice_members pm
CROSS JOIN your_practice yp
WHERE pm.practice_id = yp.id AND pm.is_active = true
UNION ALL
SELECT 
  'Skills Assessment Completion Rate',
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM skill_assessments sa WHERE sa.team_member_id = pm.id
  ) THEN pm.id END) 
    / NULLIF(COUNT(DISTINCT pm.id), 0), 1)::text || '%'
FROM practice_members pm
CROSS JOIN your_practice yp
WHERE pm.practice_id = yp.id AND pm.is_active = true;


-- ==============================================================
-- HOW TO USE THIS REPORT:
-- ==============================================================
-- 1. Run each query in Supabase SQL Editor
-- 2. Export each result to a separate Excel tab:
--    - Tab 1: Service Overview (PART 1)
--    - Tab 2: Skills Per Service (PART 2) - MAIN DATA
--    - Tab 3: Role Breakdown (PART 3)
--    - Tab 4: Unassigned Skills (PART 4) - KEY INSIGHT
--    - Tab 5: Summary Stats (SUMMARY)
--
-- 3. For presentation:
--    - Use PART 1 for "Services Overview" slide
--    - Use PART 2 for detailed skill breakdowns per service
--    - Use PART 3 for "Who Can Deliver?" analysis
--    - Use PART 4 for "Skills Gap Analysis" - THIS IS CRITICAL
--    - Use SUMMARY for executive dashboard
-- ==============================================================

