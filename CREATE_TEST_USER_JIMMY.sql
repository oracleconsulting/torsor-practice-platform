-- ============================================================================
-- CREATE TEMPORARY TEST USER FOR PORTAL INVITE TESTING (FIXED)
-- ============================================================================
-- User: Jimmy (Test User)
-- Email: jameshowardivc@gmail.com
-- Purpose: Test portal invite system
-- NOTE: DELETE THIS USER after testing is complete!
-- ============================================================================

-- ============================================================================
-- STEP 1: FIND YOUR PRACTICE ID (RUN THIS FIRST!)
-- ============================================================================
-- Run this to see all practices and find the correct one:
/*
SELECT 
  id AS practice_id,
  name AS practice_name,
  email AS practice_email,
  contact_name
FROM practices
ORDER BY created_at DESC;
*/

-- Copy the practice_id from the results above and paste it below

-- ============================================================================
-- STEP 2: INSERT TEST USER (REPLACE PRACTICE_ID BELOW!)
-- ============================================================================
-- Replace 'YOUR_PRACTICE_ID_HERE' with the actual UUID from Step 1

INSERT INTO practice_members (
  practice_id,
  email,
  name,
  role,
  is_active,
  password_change_required,
  created_at,
  updated_at
)
VALUES (
  'YOUR_PRACTICE_ID_HERE',  -- ⬅️ PASTE YOUR PRACTICE ID HERE!
  'jameshowardivc@gmail.com',
  'Jimmy',
  'Team Member',
  true,
  false,  -- Will be set to true after auth account is created
  NOW(),
  NOW()
)
RETURNING id, name, email, role;

-- ============================================================================
-- EXAMPLE (if your practice_id is a1b2c3d4-5678-90ab-cdef-123456789abc):
-- ============================================================================
/*
INSERT INTO practice_members (
  practice_id,
  email,
  name,
  role,
  is_active,
  password_change_required,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-5678-90ab-cdef-123456789abc',  -- ⬅️ YOUR ACTUAL PRACTICE ID
  'jameshowardivc@gmail.com',
  'Jimmy',
  'Team Member',
  true,
  false,
  NOW(),
  NOW()
)
RETURNING id, name, email, role;
*/

-- ============================================================================
-- VERIFY TEST USER WAS CREATED
-- ============================================================================
SELECT 
  pm.id,
  pm.name,
  pm.email,
  pm.role,
  pm.is_active,
  pm.password_change_required,
  pm.practice_id,
  p.name AS practice_name,
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Auth Account'
    ELSE '❌ Needs Auth Account'
  END AS "Auth Status"
FROM practice_members pm
LEFT JOIN practices p ON pm.practice_id = p.id
WHERE pm.email = 'jameshowardivc@gmail.com';

-- ============================================================================
-- ALTERNATIVE: GET PRACTICE_ID FROM EXISTING USERS
-- ============================================================================
-- If you're not sure about the practice name, get it from James Howard:
/*
SELECT 
  pm.practice_id,
  p.name AS practice_name,
  COUNT(*) AS team_member_count
FROM practice_members pm
LEFT JOIN practices p ON pm.practice_id = p.id
WHERE pm.email = 'jhoward@rpgcc.co.uk'  -- James Howard's email
GROUP BY pm.practice_id, p.name;

-- Use the practice_id from this result in the INSERT above
*/

-- ============================================================================
-- TESTING WORKFLOW
-- ============================================================================
-- 1. Run STEP 1 to find your practice_id
-- 2. Copy the practice_id
-- 3. Paste it in STEP 2 (replace 'YOUR_PRACTICE_ID_HERE')
-- 4. Run the INSERT query
-- 5. Verify with the SELECT query
-- 6. Go to Skills Portal Admin → User Management
-- 7. Find "Jimmy" in the user list
-- 8. Click "Invite to Portal" button
-- 9. Test the full flow
-- 10. Delete Jimmy when done using User Management UI

-- ============================================================================
-- DELETE TEST USER WHEN DONE (RECOMMENDED: Use UI)
-- ============================================================================
-- RECOMMENDED: Use the "Delete" button in User Management UI
-- This handles all foreign key constraints automatically

-- OR Manual SQL:
/*
-- Get Jimmy's ID first
SELECT id FROM practice_members WHERE email = 'jameshowardivc@gmail.com';

-- Delete all related data (replace JIMMY_ID with actual ID)
DELETE FROM skill_assessments WHERE team_member_id = 'JIMMY_ID';
DELETE FROM cpd_activities WHERE practice_member_id = 'JIMMY_ID';
DELETE FROM learning_preferences WHERE team_member_id = 'JIMMY_ID';
DELETE FROM invitations WHERE email = 'jameshowardivc@gmail.com';
DELETE FROM practice_members WHERE email = 'jameshowardivc@gmail.com';

-- Verify deletion
SELECT * FROM practice_members WHERE email = 'jameshowardivc@gmail.com';
-- Should return no rows
*/
