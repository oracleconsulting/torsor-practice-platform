-- =====================================================
-- FIX: Admin Access to View All Team Assessment Data
-- =====================================================
-- Problem: Admin (jhoward@rpgcc.co.uk) can't see team members' assessments
-- Solution: Update RLS policies to allow practice admins/owners to view all team data

-- =====================================================
-- 1. FIX: practice_members RLS - Allow admins to see ALL team members
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Practice members can view team members" ON practice_members;

-- New policy: Anyone in the practice can see all practice members
CREATE POLICY "Allow practice members to view all team members"
ON practice_members
FOR SELECT
USING (
  -- User is a member of the same practice
  practice_id IN (
    SELECT practice_id 
    FROM practice_members 
    WHERE user_id = auth.uid()
  )
  OR
  -- OR user is an admin/owner (has role 'owner' or 'admin')
  EXISTS (
    SELECT 1 
    FROM practice_members 
    WHERE user_id = auth.uid() 
      AND practice_id = practice_members.practice_id
      AND role IN ('owner', 'admin')
  )
);

-- =====================================================
-- 2. FIX: skill_assessments RLS - Allow admins to see ALL team assessments
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Practice members can view team assessments" ON skill_assessments;

-- New policy: Practice members can see all assessments in their practice
CREATE POLICY "Allow practice members to view all team assessments"
ON skill_assessments
FOR SELECT
USING (
  -- The assessment belongs to a team member in the user's practice
  team_member_id IN (
    SELECT pm2.id
    FROM practice_members pm1
    INNER JOIN practice_members pm2 ON pm1.practice_id = pm2.practice_id
    WHERE pm1.user_id = auth.uid()
  )
);

-- =====================================================
-- 3. FIX: skills RLS - Ensure all authenticated users can read skills
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users to read skills" ON skills;
DROP POLICY IF EXISTS "Allow all authenticated users to read skills" ON skills;

CREATE POLICY "Allow authenticated users to read skills"
ON skills
FOR SELECT
USING (
  auth.role() = 'authenticated' OR auth.role() = 'anon'
);

-- =====================================================
-- 4. VERIFY: Check what practice_id the admin has
-- =====================================================

-- This should match the practice_id of the test user
SELECT 
  u.email as user_email,
  pm.id as practice_member_id,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM auth.users u
INNER JOIN practice_members pm ON pm.user_id = u.id
INNER JOIN practices p ON p.id = pm.practice_id
WHERE u.email = 'jhoward@rpgcc.co.uk';

-- Compare with test user's practice_id
SELECT 
  id as practice_member_id,
  email,
  name,
  practice_id,
  role,
  user_id
FROM practice_members
WHERE email = 'laspartnership@googlemail.com';

-- These two practice_id values MUST match!
-- If they don't match, that's the problem

-- =====================================================
-- 5. FIX: If practice_ids don't match, update test user
-- =====================================================

-- First, get the admin's practice_id
DO $$
DECLARE
  admin_practice_id UUID;
  test_member_id UUID;
BEGIN
  -- Get admin's practice_id
  SELECT pm.practice_id INTO admin_practice_id
  FROM practice_members pm
  INNER JOIN auth.users u ON u.id = pm.user_id
  WHERE u.email = 'jhoward@rpgcc.co.uk'
  LIMIT 1;
  
  -- Get test user's practice_member_id
  SELECT id INTO test_member_id
  FROM practice_members
  WHERE email = 'laspartnership@googlemail.com'
  LIMIT 1;
  
  IF admin_practice_id IS NOT NULL AND test_member_id IS NOT NULL THEN
    -- Update test user to be in admin's practice
    UPDATE practice_members
    SET practice_id = admin_practice_id
    WHERE id = test_member_id;
    
    RAISE NOTICE '✅ Updated test user to practice: %', admin_practice_id;
  ELSE
    RAISE NOTICE '❌ Could not find admin or test user';
  END IF;
END $$;

-- =====================================================
-- 6. TEST: Verify admin can now see team assessments
-- =====================================================

-- This query simulates what the dashboard runs
-- Run this while logged in as jhoward@rpgcc.co.uk
SELECT 
  pm.name as team_member,
  pm.email,
  pm.role,
  COUNT(sa.id) as total_assessments,
  MAX(sa.assessed_at) as last_assessment_date
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id IN (
  SELECT practice_id 
  FROM practice_members 
  WHERE user_id = auth.uid()
)
  AND pm.is_active = true
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY pm.created_at DESC;

-- Expected: Should show laspartnership@googlemail.com with 110 assessments

-- =====================================================
-- 7. TEST: Verify Advisory & Consulting skills visible
-- =====================================================

-- Test query for Advisory Skills page
SELECT 
  pm.name as team_member,
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.interest_level,
  sa.assessed_at
FROM skill_assessments sa
INNER JOIN practice_members pm ON pm.id = sa.team_member_id
INNER JOIN skills s ON s.id = sa.skill_id
WHERE pm.practice_id IN (
  SELECT practice_id 
  FROM practice_members 
  WHERE user_id = auth.uid()
)
  AND s.category = 'Advisory & Consulting'
ORDER BY pm.name, s.name;

-- Expected: Should show 15 Advisory & Consulting skills for laspartnership@googlemail.com

-- =====================================================
-- 8. VERIFY: RLS is now correctly configured
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%team%' THEN '✅ Team access enabled'
    WHEN policyname LIKE '%own%' THEN '⚠️ Only own data'
    ELSE '❓ Check policy'
  END as status
FROM pg_policies
WHERE tablename IN ('practice_members', 'skill_assessments', 'skills')
ORDER BY tablename, policyname;

RAISE NOTICE '==============================================';
RAISE NOTICE '✅ RLS policies updated for admin team access';
RAISE NOTICE 'Refresh your dashboard to see team data!';
RAISE NOTICE '==============================================';

