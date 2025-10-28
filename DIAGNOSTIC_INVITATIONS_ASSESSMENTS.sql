-- ==============================================================
-- DIAGNOSTIC: Check Invitations Assessment Data
-- ==============================================================

-- 1. Check how many invitations have assessment data
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN assessment_data IS NOT NULL AND jsonb_array_length(assessment_data) > 0 THEN 1 END) as with_assessments,
  COUNT(CASE WHEN assessment_data IS NULL OR jsonb_array_length(assessment_data) = 0 THEN 1 END) as without_assessments
FROM invitations
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY status;

-- 2. List invitations with assessment data
SELECT 
  email,
  name,
  role,
  status,
  accepted_at,
  jsonb_array_length(assessment_data) as skill_count,
  (assessment_data->0) as first_skill_sample
FROM invitations
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND assessment_data IS NOT NULL
  AND jsonb_array_length(assessment_data) > 0
ORDER BY email;

-- 3. Check if these people exist in practice_members
SELECT 
  i.email,
  i.name as invitation_name,
  pm.name as member_name,
  pm.id as member_id,
  jsonb_array_length(i.assessment_data) as invitations_skills,
  (SELECT COUNT(*) FROM skill_assessments sa WHERE sa.team_member_id = pm.id) as migrated_skills
FROM invitations i
LEFT JOIN practice_members pm ON pm.email = i.email
WHERE i.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND i.assessment_data IS NOT NULL
  AND jsonb_array_length(i.assessment_data) > 0
ORDER BY i.email;

-- 4. Check for duplicates in skill_assessments
SELECT 
  team_member_id,
  skill_id,
  COUNT(*) as duplicate_count
FROM skill_assessments
WHERE team_member_id IN (
  SELECT pm.id 
  FROM practice_members pm
  WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
)
GROUP BY team_member_id, skill_id
HAVING COUNT(*) > 1;

-- 5. Sample one person's assessment data structure
SELECT 
  email,
  name,
  jsonb_pretty(assessment_data->>0) as first_assessment_structure
FROM invitations
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND assessment_data IS NOT NULL
  AND jsonb_array_length(assessment_data) > 0
LIMIT 1;

