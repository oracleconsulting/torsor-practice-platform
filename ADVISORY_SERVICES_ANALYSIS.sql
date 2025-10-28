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
  ssa.service_name,
  sk.category as skill_category,
  sk.name as skill_name,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN sa.team_member_id END) as experts_available,
  COUNT(DISTINCT CASE WHEN sa.current_level <= 2 THEN sa.team_member_id END) as beginners_learning,
  STRING_AGG(DISTINCT 
    CASE WHEN sa.current_level >= 4 
    THEN (SELECT name FROM practice_members WHERE id = sa.team_member_id) 
    END, ', ' ORDER BY CASE WHEN sa.current_level >= 4 THEN (SELECT name FROM practice_members WHERE id = sa.team_member_id) END
  ) as expert_names
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_name, sk.id, sk.category, sk.name
ORDER BY ssa.service_name, sk.category, sk.name;


-- QUERY 2: Service Summary with Role Distribution
-- Shows how many skills each service needs and which roles can deliver them
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  ssa.service_name,
  COUNT(DISTINCT ssa.skill_id) as total_skills_required,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) as skills_adequately_covered,
  COUNT(DISTINCT ssa.skill_id) - COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) as skill_gaps,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as coverage_percentage,
  -- Role breakdown (team members with level 3+ in ANY of the service's skills)
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 AND pm.role ILIKE '%partner%' THEN pm.id END) as partners_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 AND pm.role ILIKE '%director%' THEN pm.id END) as directors_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 AND pm.role ILIKE '%manager%' THEN pm.id END) as managers_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 AND pm.role ILIKE '%senior%' THEN pm.id END) as seniors_qualified,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 AND pm.role ILIKE '%accountant%' THEN pm.id END) as accountants_qualified
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id AND pm.is_active = true
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_name
ORDER BY coverage_percentage ASC, skill_gaps DESC;


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
    DISTINCT pm.name || ' (' || sa.current_level || ')', 
    ', ' 
    ORDER BY sa.current_level DESC, pm.name
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
  ssa.service_name,
  COUNT(DISTINCT ssa.skill_id) as skills_required,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN ssa.skill_id END) as skills_at_expert_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) as skills_at_competent_level,
  COUNT(DISTINCT CASE WHEN sa.current_level <= 2 THEN ssa.skill_id END) as skills_need_development,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level_for_service,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) * 100.0 / NULLIF(COUNT(DISTINCT ssa.skill_id), 0) >= 80 THEN '✅ HIGH CONFIDENCE'
    WHEN COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) * 100.0 / NULLIF(COUNT(DISTINCT ssa.skill_id), 0) >= 60 THEN '⚠️ MODERATE CONFIDENCE'
    ELSE '❌ DEVELOPMENT NEEDED'
  END as delivery_confidence,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) || '%' as readiness_percentage
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY ssa.service_name
ORDER BY 
  AVG(sa.current_level) DESC,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) DESC;


-- ==============================================================
-- BONUS: Top 5 Skills to Train (Highest Impact)
-- Skills that appear in MULTIPLE services but team is weak in
-- Training these will improve capability across multiple services
-- ==============================================================
WITH your_practice AS (
  SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1
)
SELECT 
  sk.name as skill_name,
  sk.category as skill_category,
  COUNT(DISTINCT ssa.service_name) as used_in_services,
  STRING_AGG(DISTINCT ssa.service_name, ', ' ORDER BY ssa.service_name) as services_requiring_this,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as current_avg_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN sa.team_member_id END) as current_experts,
  5.0 - ROUND(AVG(sa.current_level), 1) as improvement_opportunity
FROM service_skill_assignments ssa
CROSS JOIN your_practice yp
JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
WHERE ssa.practice_id = yp.id
GROUP BY sk.id, sk.name, sk.category
HAVING 
  COUNT(DISTINCT ssa.service_name) >= 2  -- Used in at least 2 services
  AND COALESCE(AVG(sa.current_level), 0) < 4  -- Team avg below expert level
ORDER BY 
  COUNT(DISTINCT ssa.service_name) DESC,  -- Most services first
  ROUND(AVG(sa.current_level), 1) ASC;    -- Lowest skill level first


-- ==============================================================
-- HOW TO USE THESE QUERIES:
-- ==============================================================
-- 1. Copy each query separately into Supabase SQL Editor
-- 2. Click "Run" for each one
-- 3. Export results to CSV/Excel (use the export button)
-- 4. Use in your presentation:
--    - Query 1: Detail view of skills per service
--    - Query 2: Executive summary with role distribution
--    - Query 3: CRITICAL - Show unassigned skills (untapped potential)
--    - Query 4: Service readiness ranking (traffic light status)
--    - Bonus: Training priorities for maximum impact
-- ==============================================================
