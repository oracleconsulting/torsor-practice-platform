-- Debug: Check what's happening with the joins

-- 1. Check if practice_members emails match invitations
SELECT 
  'Practice Members vs Invitations' as check_type,
  COUNT(DISTINCT inv.email) as invitation_emails,
  COUNT(DISTINCT pm.email) as member_emails,
  COUNT(DISTINCT CASE WHEN pm.email IS NOT NULL THEN inv.email END) as matching_emails
FROM invitations inv
LEFT JOIN practice_members pm ON pm.email = inv.email
WHERE inv.assessment_data IS NOT NULL
  AND jsonb_array_length(inv.assessment_data) > 0;

-- 2. Sample skill_ids from invitations
SELECT 
  'Sample Skill IDs from Invitations' as info,
  inv.email,
  skill_item->>'skill_id' as skill_id_from_assessment,
  EXISTS(SELECT 1 FROM skills WHERE id = (skill_item->>'skill_id')::UUID) as skill_exists
FROM invitations inv
CROSS JOIN LATERAL jsonb_array_elements(inv.assessment_data) as skill_item
WHERE inv.assessment_data IS NOT NULL
LIMIT 10;

-- 3. Count how many skill IDs would match
SELECT 
  'Skill ID Match Count' as info,
  COUNT(*) as total_assessment_items,
  COUNT(sk.id) as matching_skills,
  COUNT(*) - COUNT(sk.id) as missing_skills
FROM invitations inv
CROSS JOIN LATERAL jsonb_array_elements(inv.assessment_data) as skill_item
LEFT JOIN skills sk ON sk.id = (skill_item->>'skill_id')::UUID
WHERE inv.assessment_data IS NOT NULL;

-- 4. Show emails from both tables
SELECT 'Invitation Emails' as source, email FROM invitations ORDER BY email;
SELECT 'Practice Member Emails' as source, email FROM practice_members ORDER BY email;

