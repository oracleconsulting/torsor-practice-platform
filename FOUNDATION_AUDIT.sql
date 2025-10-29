-- COMPREHENSIVE DATABASE AUDIT AND FIX
-- This script will diagnose all data integrity issues and provide a clear fix plan

-- ============================================================================
-- PART 1: DIAGNOSTIC - Understand Current State
-- ============================================================================

-- 1.1: Check ALL team members and their data sources
SELECT 
  pm.name,
  pm.email,
  pm.role,
  -- Check invitations table
  CASE 
    WHEN i.id IS NOT NULL THEN '✓ Has invitation'
    ELSE '✗ No invitation'
  END as invitation_status,
  CASE 
    WHEN i.assessment_data IS NOT NULL THEN jsonb_array_length(i.assessment_data)
    ELSE 0
  END as invitation_skill_count,
  -- Check skill_assessments table
  COUNT(sa.id) as skill_assessment_count,
  -- Check for mismatches
  CASE 
    WHEN i.assessment_data IS NOT NULL 
      AND COUNT(sa.id) != jsonb_array_length(i.assessment_data) 
    THEN '⚠️ MISMATCH'
    WHEN i.assessment_data IS NULL AND COUNT(sa.id) > 0 
    THEN '⚠️ Assessments without invitation'
    WHEN i.assessment_data IS NOT NULL AND COUNT(sa.id) = 0 
    THEN '⚠️ Invitation without assessments'
    ELSE '✓ OK'
  END as data_integrity_status
FROM practice_members pm
LEFT JOIN invitations i ON pm.email = i.email 
  AND i.practice_id = pm.practice_id
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
GROUP BY pm.id, pm.name, pm.email, pm.role, i.id, i.assessment_data
ORDER BY pm.role, pm.name;

-- 1.2: Check skill level distribution for each member
SELECT 
  pm.name,
  pm.email,
  sa.current_level,
  COUNT(*) as count_at_level
FROM practice_members pm
JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
GROUP BY pm.id, pm.name, pm.email, sa.current_level
ORDER BY pm.name, sa.current_level;

-- 1.3: Identify members with "all same level" issue
SELECT 
  pm.name,
  pm.email,
  COUNT(DISTINCT sa.current_level) as unique_levels,
  MIN(sa.current_level) as min_level,
  MAX(sa.current_level) as max_level,
  CASE 
    WHEN COUNT(DISTINCT sa.current_level) = 1 THEN '⚠️ ALL SAME LEVEL'
    ELSE '✓ Varied levels'
  END as status
FROM practice_members pm
JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
GROUP BY pm.id, pm.name, pm.email
ORDER BY unique_levels, pm.name;

-- 1.4: Check if invitations have REAL varied data
SELECT 
  i.email,
  i.status,
  jsonb_array_length(i.assessment_data) as skill_count,
  -- Sample 3 skills to check variety
  (i.assessment_data->0->>'currentLevel')::int as skill_1_level,
  (i.assessment_data->5->>'currentLevel')::int as skill_5_level,
  (i.assessment_data->10->>'currentLevel')::int as skill_10_level,
  -- Check if all are the same
  CASE 
    WHEN (i.assessment_data->0->>'currentLevel') = (i.assessment_data->5->>'currentLevel')
      AND (i.assessment_data->0->>'currentLevel') = (i.assessment_data->10->>'currentLevel')
    THEN '⚠️ Possibly all same level'
    ELSE '✓ Varied levels'
  END as variety_check
FROM invitations i
WHERE i.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  AND i.assessment_data IS NOT NULL
ORDER BY i.email;

-- ============================================================================
-- PART 2: SUMMARY REPORT
-- ============================================================================
SELECT 
  '=== DATA INTEGRITY SUMMARY ===' as report_section,
  '' as detail;

SELECT 
  'Total Team Members' as metric,
  COUNT(*) as value
FROM practice_members 
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
UNION ALL
SELECT 
  'Members with Invitations',
  COUNT(DISTINCT pm.id)
FROM practice_members pm
JOIN invitations i ON pm.email = i.email
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  AND i.assessment_data IS NOT NULL
UNION ALL
SELECT 
  'Members with Skill Assessments',
  COUNT(DISTINCT sa.team_member_id)
FROM skill_assessments sa
JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
UNION ALL
SELECT 
  'Members with "All Same Level" Issue',
  COUNT(*)
FROM (
  SELECT pm.id
  FROM practice_members pm
  JOIN skill_assessments sa ON sa.team_member_id = pm.id
  WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  GROUP BY pm.id
  HAVING COUNT(DISTINCT sa.current_level) = 1
) subq;

