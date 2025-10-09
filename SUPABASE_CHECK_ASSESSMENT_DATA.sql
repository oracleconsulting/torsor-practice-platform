-- Check if assessment data was properly created
-- Run these queries in Supabase SQL Editor

-- 1. Check practice_members table
SELECT 
  id,
  name,
  email,
  role,
  practice_id,
  user_id,
  is_active,
  created_at
FROM practice_members
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should see your test user (James Howard / jhoward@rpgcc.co.uk or similar)

-- 2. Check skill_assessments table
SELECT 
  COUNT(*) as total_assessments,
  team_member_id,
  MIN(assessed_at) as first_assessment,
  MAX(assessed_at) as last_assessment
FROM skill_assessments
GROUP BY team_member_id
ORDER BY last_assessment DESC;

-- Expected: Should see ~110 assessments for your practice_member_id

-- 3. Check specific assessments with skill names
SELECT 
  sa.id,
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.interest_level,
  sa.notes,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
ORDER BY sa.assessed_at DESC
LIMIT 20;

-- Expected: Should see your actual skill assessments with ratings

-- 4. Check invitation status
SELECT 
  id,
  email,
  name,
  status,
  accepted_at,
  assessment_data IS NOT NULL as has_assessment_data
FROM invitations
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should see status='accepted' and has_assessment_data=true

-- 5. If practice_members is EMPTY, check if there's an RLS issue:
SELECT 
  'practice_members' as table_name,
  COUNT(*) as row_count
FROM practice_members

UNION ALL

SELECT 
  'skill_assessments' as table_name,
  COUNT(*) as row_count
FROM skill_assessments;

-- This shows if tables have any data at all

