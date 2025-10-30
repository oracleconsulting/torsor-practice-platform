-- ============================================================================
-- CREATE TEMPORARY TEST USER FOR PORTAL INVITE TESTING
-- ============================================================================
-- User: Jimmy (Test User)
-- Email: jameshowardivc@gmail.com
-- Purpose: Test portal invite system
-- NOTE: DELETE THIS USER after testing is complete!
-- ============================================================================

-- Step 1: Insert temporary test user into practice_members
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
  (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1),
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
-- VERIFY TEST USER WAS CREATED
-- ============================================================================
SELECT 
  pm.id,
  pm.name,
  pm.email,
  pm.role,
  pm.is_active,
  pm.password_change_required,
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Auth Account'
    ELSE '❌ Needs Auth Account'
  END AS "Auth Status"
FROM practice_members pm
WHERE pm.email = 'jameshowardivc@gmail.com';

-- ============================================================================
-- TESTING WORKFLOW
-- ============================================================================
-- 1. Run this script to create Jimmy
-- 2. Go to Skills Portal Admin → User Management
-- 3. Find "Jimmy" in the user list
-- 4. Click "Invite to Portal" button
-- 5. Modal should show:
--    - Email: jameshowardivc@gmail.com
--    - Password: TorsorTeam2025!
--    - Orange warning: "Auth Account Required"
-- 6. Follow the instructions to create auth account in Supabase
-- 7. Test the full login flow
-- 8. Delete Jimmy when done (see below)

-- ============================================================================
-- DELETE TEST USER WHEN DONE (NUCLEAR DELETE)
-- ============================================================================
-- Run this after testing is complete:
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

-- ============================================================================
-- QUICK DELETE (Use User Management UI instead)
-- ============================================================================
-- RECOMMENDED: Use the "Delete" button in User Management UI
-- This handles all foreign key constraints automatically
-- Easier and safer than manual SQL deletion

