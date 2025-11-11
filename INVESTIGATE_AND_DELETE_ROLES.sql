-- =====================================================
-- INVESTIGATE AND DELETE ALL ROLE DEFINITIONS
-- =====================================================
-- Run each section separately to diagnose the issue
-- =====================================================

-- STEP 1: Check what roles exist and their practice_id
SELECT 
  id,
  role_title,
  practice_id,
  is_active,
  created_at
FROM role_definitions
ORDER BY created_at DESC;

-- STEP 2: Check your practice_id
-- (Replace 'your-email@example.com' with your actual email)
SELECT 
  pm.practice_id,
  pm.name,
  pm.email
FROM practice_members pm
JOIN auth.users u ON pm.user_id = u.id
WHERE u.email = 'jhoward@rpgcc.co.uk';  -- Change this to your email

-- STEP 3: Delete ALL roles (both seeded and practice-specific)
DELETE FROM role_definitions;

-- STEP 4: Verify deletion
SELECT 
  'All roles deleted' as status,
  COUNT(*) as remaining_roles
FROM role_definitions;

-- =====================================================
-- AFTER RUNNING THIS:
-- =====================================================
-- You should see 0 roles in the Role Definitions tab
-- Then you can create custom roles using the "+ Create Role" button
-- =====================================================

