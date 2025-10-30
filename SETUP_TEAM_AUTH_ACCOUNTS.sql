-- ============================================================================
-- SETUP TEAM MEMBER AUTH ACCOUNTS WITH AUTO-GENERATED PASSWORDS
-- ============================================================================
-- This script will:
-- 1. Get all team members without auth accounts
-- 2. Create auth.users accounts with a standard password
-- 3. Link practice_members to auth.users via user_id
-- 4. Track password change requirement
--
-- STANDARD PASSWORD: TorsorTeam2025!
-- (All users will be prompted to change on first login)
-- ============================================================================

-- Step 1: Add password_change_required column to practice_members
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

COMMENT ON COLUMN practice_members.password_change_required IS 'Flag to force password change on next login';
COMMENT ON COLUMN practice_members.last_password_change IS 'Timestamp of last password change';

-- Step 2: Get list of team members who need auth accounts
-- (Run this first to see who needs accounts)
SELECT 
  pm.id AS practice_member_id,
  pm.email,
  pm.name,
  pm.role,
  CASE 
    WHEN pm.user_id IS NOT NULL THEN '✅ Has Account'
    ELSE '❌ Needs Account'
  END AS account_status
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY 
  CASE WHEN pm.user_id IS NULL THEN 0 ELSE 1 END,
  pm.name;

-- ============================================================================
-- Step 3: CREATE AUTH ACCOUNTS (RUN THIS IN SUPABASE AUTH CONTEXT)
-- ============================================================================
-- NOTE: This section needs to be run by an admin using Supabase Auth Admin API
--       or through the Supabase Dashboard -> Authentication -> Add User
--
-- MANUAL STEPS FOR EACH USER:
-- 1. Go to Supabase Dashboard -> Authentication -> Users -> Add User
-- 2. Enter email from list above
-- 3. Use password: TorsorTeam2025!
-- 4. Auto-confirm email: YES
-- 5. Copy the generated user_id
-- 6. Run the UPDATE query below to link the user_id to practice_members

-- ============================================================================
-- Step 4: AFTER CREATING AUTH ACCOUNTS, LINK THEM TO PRACTICE_MEMBERS
-- ============================================================================
-- Replace 'NEW_USER_ID' with the actual user_id from auth.users
-- Replace 'team.member@email.com' with the actual email

-- Template for linking (run for each new user):
/*
UPDATE practice_members
SET 
  user_id = 'NEW_USER_ID_HERE',
  password_change_required = true,
  updated_at = NOW()
WHERE email = 'team.member@email.com'
  AND practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1);
*/

-- ============================================================================
-- Step 5: VERIFY ALL ACCOUNTS ARE LINKED
-- ============================================================================
SELECT 
  pm.name,
  pm.email,
  pm.role,
  u.id AS user_id,
  u.email AS auth_email,
  u.email_confirmed_at,
  pm.password_change_required,
  CASE 
    WHEN pm.user_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Linked & Ready'
    WHEN pm.user_id IS NULL THEN '❌ Not Linked'
    ELSE '⚠️ Issue'
  END AS status
FROM practice_members pm
LEFT JOIN auth.users u ON pm.user_id = u.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
ORDER BY status, pm.name;

-- ============================================================================
-- Step 6: MARK ALL NEW ACCOUNTS AS REQUIRING PASSWORD CHANGE
-- ============================================================================
UPDATE practice_members
SET password_change_required = true
WHERE practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND user_id IS NOT NULL
  AND last_password_change IS NULL;

-- ============================================================================
-- Step 7: FUNCTION TO CHECK PASSWORD CHANGE REQUIREMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION check_password_change_required(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  requires_change BOOLEAN;
BEGIN
  SELECT pm.password_change_required INTO requires_change
  FROM practice_members pm
  WHERE pm.email = user_email
  LIMIT 1;
  
  RETURN COALESCE(requires_change, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 8: FUNCTION TO MARK PASSWORD AS CHANGED
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_password_changed(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE practice_members
  SET 
    password_change_required = false,
    last_password_change = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- QUICK REFERENCE - TEAM MEMBER EMAILS
-- ============================================================================
-- Copy these for creating auth accounts:
/*
ADMIN/LEADERSHIP:
- james@ivcaccounting.co.uk (Already has account - Admin)
- wes@ivcaccounting.co.uk
- jeremy@ivcaccounting.co.uk
- laura@ivcaccounting.co.uk

ASSISTANT MANAGERS:
- luke@ivcaccounting.co.uk
- edward@ivcaccounting.co.uk
- azalia@ivcaccounting.co.uk

SENIOR:
- lambros@ivcaccounting.co.uk
- shari@ivcaccounting.co.uk
- lynley@ivcaccounting.co.uk

JUNIOR:
- jack@ivcaccounting.co.uk
- rizwan@ivcaccounting.co.uk
- tanya@ivcaccounting.co.uk
- meyanthi@ivcaccounting.co.uk
- jaanu@ivcaccounting.co.uk
- sarah@ivcaccounting.co.uk

STANDARD PASSWORD FOR ALL: TorsorTeam2025!
*/

-- ============================================================================
-- FINAL CHECK: Count of accounts by status
-- ============================================================================
SELECT 
  CASE 
    WHEN pm.user_id IS NOT NULL THEN 'Has Auth Account'
    ELSE 'Needs Auth Account'
  END AS account_status,
  COUNT(*) AS count
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'Torsor' LIMIT 1)
  AND pm.is_active = true
GROUP BY account_status;

