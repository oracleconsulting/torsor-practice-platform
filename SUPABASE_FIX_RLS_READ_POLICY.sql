-- Fix RLS policies to allow reading skill assessments in dashboard
-- The dashboard queries skill_assessments but RLS might be blocking reads

-- 1. Check current RLS policies on skill_assessments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'skill_assessments';

-- 2. Add policy to allow practice members to read ALL assessments in their practice
-- (needed for team view)
DROP POLICY IF EXISTS "Practice members can view team assessments" ON skill_assessments;

CREATE POLICY "Practice members can view team assessments"
ON skill_assessments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM practice_members pm1
    INNER JOIN practice_members pm2 ON pm1.practice_id = pm2.practice_id
    WHERE pm1.user_id = auth.uid()
      AND pm2.id = skill_assessments.team_member_id
  )
);

-- 3. Also ensure anonymous reads work for service role (backend)
-- The service role key bypasses RLS, but let's add a policy just in case

-- 4. Check if practice_members table allows reads
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'practice_members';

-- 5. Add policy to allow practice members to see OTHER team members in same practice
DROP POLICY IF EXISTS "Practice members can view team members" ON practice_members;

CREATE POLICY "Practice members can view team members"
ON practice_members
FOR SELECT
USING (
  practice_id IN (
    SELECT practice_id 
    FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- 6. Verify skills table is readable
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename = 'skills';

-- Skills should have a policy allowing all authenticated users to read
DROP POLICY IF EXISTS "Allow all authenticated users to read skills" ON skills;

CREATE POLICY "Allow all authenticated users to read skills"
ON skills
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 7. Test the query that the dashboard uses
-- Run this to simulate what the dashboard sees:
SELECT 
  sa.*,
  pm.name as member_name,
  pm.email as member_email,
  s.name as skill_name,
  s.category,
  s.description
FROM skill_assessments sa
INNER JOIN practice_members pm ON pm.id = sa.team_member_id
INNER JOIN skills s ON s.id = sa.skill_id
WHERE sa.team_member_id = '10b46157-363d-47d9-bbbf-11bc8e647240'
  AND s.category = 'Advisory & Consulting'
ORDER BY s.name
LIMIT 20;

-- Expected: Should return 15 Advisory & Consulting skills
-- If it returns 0 rows, RLS is blocking the read

-- 8. Alternative: Check what the logged-in user can actually see
-- (Run this while logged in as the test user)
SELECT 
  COUNT(*) as visible_assessments
FROM skill_assessments;

-- If this returns 0, RLS is definitely blocking reads

