-- =====================================================
-- DIAGNOSTIC: Check Where Assessment Data Is Stored
-- =====================================================

-- 1. Check skill_assessments table
SELECT 
  'skill_assessments' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT team_member_id) as unique_members
FROM skill_assessments;

-- 2. Check survey_sessions table
SELECT 
  'survey_sessions' as table_name,
  COUNT(*) as count,
  email,
  status,
  progress_percentage,
  LENGTH(survey_data::text) as data_size
FROM survey_sessions
GROUP BY email, status, progress_percentage, data_size;

-- 3. Check practice_members
SELECT 
  'practice_members' as table_name,
  id,
  name,
  email,
  role
FROM practice_members
ORDER BY created_at DESC;

-- 4. Check if survey_data contains assessments
SELECT 
  email,
  status,
  progress_percentage,
  survey_data
FROM survey_sessions
WHERE survey_data IS NOT NULL
  AND survey_data != '{}'::jsonb
LIMIT 5;

-- 5. Check invitations that were completed
SELECT 
  email,
  name,
  status,
  accepted_at,
  assessment_submitted_at
FROM invitations
WHERE status IN ('accepted', 'completed')
ORDER BY accepted_at DESC;

