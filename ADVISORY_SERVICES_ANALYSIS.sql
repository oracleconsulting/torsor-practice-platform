-- Query 1: All Advisory Services with Assigned Skills and Role Distribution
-- This shows each service, its skills, and which roles are assigned to work on it

SELECT 
  s.name as service_name,
  s.category,
  sk.name as skill_name,
  sk.category as skill_category,
  COUNT(DISTINCT ssa.team_member_id) as total_assigned,
  STRING_AGG(DISTINCT pm.role, ', ' ORDER BY pm.role) as roles_covering,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 4 THEN ssa.team_member_id END) as expert_count,
  COUNT(DISTINCT CASE WHEN sa.current_level <= 2 THEN ssa.team_member_id END) as beginner_count
FROM service_lines s
LEFT JOIN service_skill_assignments ssa ON s.id = ssa.service_line_id
LEFT JOIN skills sk ON ssa.skill_id = sk.id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE s.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY s.id, s.name, s.category, sk.id, sk.name, sk.category
ORDER BY s.name, sk.category, sk.name;

-- Query 2: Skills per Service with Role Breakdown
SELECT 
  s.name as service_name,
  COUNT(DISTINCT ssa.skill_id) as total_skills_required,
  COUNT(DISTINCT CASE WHEN pm.role ILIKE '%partner%' THEN pm.id END) as partners_available,
  COUNT(DISTINCT CASE WHEN pm.role ILIKE '%director%' THEN pm.id END) as directors_available,
  COUNT(DISTINCT CASE WHEN pm.role ILIKE '%manager%' THEN pm.id END) as managers_available,
  COUNT(DISTINCT CASE WHEN pm.role ILIKE '%senior%' THEN pm.id END) as seniors_available,
  COUNT(DISTINCT CASE WHEN pm.role ILIKE '%accountant%' THEN pm.id END) as accountants_available
FROM service_lines s
LEFT JOIN service_skill_assignments ssa ON s.id = ssa.service_line_id
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id AND sa.current_level >= 3
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE s.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY s.id, s.name
ORDER BY s.name;

-- Query 3: UNASSIGNED SKILLS (Critical Gap Analysis)
-- Skills that exist but are NOT assigned to any service line
SELECT 
  sk.category as skill_category,
  sk.name as skill_name,
  COUNT(DISTINCT sa.team_member_id) as team_members_with_skill,
  ROUND(AVG(sa.current_level), 1) as avg_level_across_team,
  MAX(sa.current_level) as highest_level_in_team,
  STRING_AGG(DISTINCT pm.name, ', ' ORDER BY pm.name) as team_members_who_have_it
FROM skills sk
LEFT JOIN service_skill_assignments ssa ON sk.id = ssa.skill_id
LEFT JOIN skill_assessments sa ON sk.id = sa.skill_id
LEFT JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE ssa.id IS NULL  -- Not assigned to any service
  AND sk.id IN (SELECT DISTINCT skill_id FROM skill_assessments)  -- But someone has assessed it
GROUP BY sk.id, sk.category, sk.name
ORDER BY avg_level_across_team DESC, skill_category, skill_name;

-- Query 4: Services with Skill Coverage Gaps
SELECT 
  s.name as service_name,
  COUNT(DISTINCT ssa.skill_id) as required_skills,
  COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) as skills_covered,
  COUNT(DISTINCT ssa.skill_id) - COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) as skill_gap,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sa.current_level >= 3 THEN ssa.skill_id END) / NULLIF(COUNT(DISTINCT ssa.skill_id), 0), 1) as coverage_percentage
FROM service_lines s
LEFT JOIN service_skill_assignments ssa ON s.id = ssa.service_line_id
LEFT JOIN skill_assessments sa ON ssa.skill_id = sa.skill_id
WHERE s.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY s.id, s.name
ORDER BY coverage_percentage ASC, skill_gap DESC;

