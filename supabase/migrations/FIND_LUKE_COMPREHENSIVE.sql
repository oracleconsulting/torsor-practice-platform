-- =====================================================
-- FIND LUKE ANYWHERE IN THE SYSTEM
-- =====================================================

-- Check auth.users
SELECT 'AUTH USERS' as source, id, email, created_at
FROM auth.users
WHERE email ILIKE '%tyrrell%' OR email ILIKE '%luke%';

-- Check practice_members
SELECT 'PRACTICE MEMBERS' as source, id, name, email, user_id, created_at
FROM practice_members
WHERE email ILIKE '%tyrrell%' OR name ILIKE '%luke%' OR email ILIKE '%ltyrrell%';

-- Check for orphaned skill_assessments (assessments without a practice member)
SELECT 
  'ORPHANED SKILLS' as source,
  sa.team_member_id,
  COUNT(*) as skill_count,
  MIN(sa.assessed_at) as first_assessment,
  MAX(sa.assessed_at) as last_assessment
FROM skill_assessments sa
LEFT JOIN practice_members pm ON pm.id = sa.team_member_id
WHERE pm.id IS NULL
GROUP BY sa.team_member_id
HAVING COUNT(*) > 50;  -- Looking for 111 skills

-- Check all practice members to see the structure
SELECT 
  id,
  name,
  email,
  user_id,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as skills
FROM practice_members
ORDER BY name;

