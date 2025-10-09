-- Verify data exists for dashboard display
-- Practice Member ID: 10b46157-363d-47d9-bbbf-11bc8e647240

-- 1. Verify practice member exists and has correct structure
SELECT 
  id,
  practice_id,
  user_id,
  name,
  email,
  role,
  is_active,
  created_at
FROM practice_members
WHERE id = '10b46157-363d-47d9-bbbf-11bc8e647240';

-- Expected: Should return 1 row with laspartnership@googlemail.com

-- 2. Verify skill assessments exist for this member
SELECT COUNT(*) as total_assessments
FROM skill_assessments
WHERE team_member_id = '10b46157-363d-47d9-bbbf-11bc8e647240';

-- Expected: Should return 110

-- 3. Check Advisory & Consulting skills specifically
SELECT 
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.interest_level,
  sa.notes,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
WHERE sa.team_member_id = '10b46157-363d-47d9-bbbf-11bc8e647240'
  AND s.category = 'Advisory & Consulting'
ORDER BY s.name;

-- Expected: Should return 15 Advisory & Consulting skills with ratings

-- 4. Check all categories and counts
SELECT 
  s.category,
  COUNT(*) as skill_count,
  AVG(sa.current_level)::numeric(3,2) as avg_skill_level,
  AVG(sa.interest_level)::numeric(3,2) as avg_interest_level
FROM skill_assessments sa
JOIN skills s ON s.id = sa.skill_id
WHERE sa.team_member_id = '10b46157-363d-47d9-bbbf-11bc8e647240'
GROUP BY s.category
ORDER BY s.category;

-- Expected: Should show all 10 categories with counts matching:
-- Advisory & Consulting: 15
-- Client Management & Development: 10
-- Cloud Accounting & Automation: 12
-- Communication & Soft Skills: 12
-- Digital & AI Capabilities: 10
-- Leadership & Team Skills: 8
-- Management Accounting & Reporting: 10
-- Sector & Industry Knowledge: 8
-- Tax & Compliance - UK Focus: 10
-- Technical Accounting Fundamentals: 15

-- 5. What the dashboard should query (all members in practice)
SELECT 
  pm.id,
  pm.name,
  pm.email,
  pm.role,
  COUNT(sa.id) as total_assessments,
  MAX(sa.assessed_at) as last_assessment_date
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND pm.is_active = true
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY pm.created_at DESC;

-- Expected: Should show at least 1 member with 110 assessments

-- 6. Check if there's a practice_id mismatch
SELECT 
  'Your practice_id' as source,
  practice_id
FROM practice_members
WHERE id = '10b46157-363d-47d9-bbbf-11bc8e647240'

UNION ALL

SELECT 
  'Logged-in user practice' as source,
  practice_id
FROM practice_members
WHERE user_id = auth.uid()
LIMIT 1;

-- Both should match: a1b2c3d4-5678-90ab-cdef-123456789abc
-- If they don't match, the dashboard won't show the data

-- 7. Test the actual dashboard query (simulated)
-- This is what the Team Management page should be running:
SELECT 
  pm.id as member_id,
  pm.name,
  pm.email,
  s.category,
  s.name as skill_name,
  sa.current_level,
  sa.interest_level,
  sa.assessed_at
FROM practice_members pm
INNER JOIN skill_assessments sa ON sa.team_member_id = pm.id
INNER JOIN skills s ON s.id = sa.skill_id
WHERE pm.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND pm.is_active = true
  AND s.category = 'Advisory & Consulting'  -- Filter for Advisory Skills
ORDER BY pm.name, s.name
LIMIT 50;

-- This should return Advisory & Consulting assessments for the team member

