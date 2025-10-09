-- =====================================================
-- CHANGE ADMIN EMAIL ADDRESS
-- =====================================================
-- FROM: jhoward@rpgcc.co.uk
-- TO:   BSGBD@rpgcc.co.uk
-- =====================================================
-- This script updates the admin email across all tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Update the user's email in the auth.users table
-- NOTE: This requires admin/service role permissions
-- If this fails, you'll need to do it through Supabase Dashboard:
-- Authentication → Users → Find user → Click edit → Change email

UPDATE auth.users
SET email = 'BSGBD@rpgcc.co.uk',
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        '"BSGBD@rpgcc.co.uk"'
    ),
    updated_at = NOW()
WHERE email = 'jhoward@rpgcc.co.uk';

-- Verify auth.users update
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'name' as name,
    created_at,
    updated_at
FROM auth.users
WHERE email IN ('jhoward@rpgcc.co.uk', 'BSGBD@rpgcc.co.uk')
ORDER BY email;

-- Step 2: Update practice_members table
UPDATE practice_members
SET email = 'BSGBD@rpgcc.co.uk',
    updated_at = NOW()
WHERE email = 'jhoward@rpgcc.co.uk';

-- Verify practice_members update
SELECT 
    id,
    name,
    email,
    role,
    practice_id,
    updated_at
FROM practice_members
WHERE email IN ('jhoward@rpgcc.co.uk', 'BSGBD@rpgcc.co.uk')
ORDER BY email;

-- Step 3: Update any invitations (if any exist)
UPDATE invitations
SET email = 'BSGBD@rpgcc.co.uk',
    updated_at = NOW()
WHERE email = 'jhoward@rpgcc.co.uk';

-- Verify invitations update
SELECT 
    id,
    email,
    name,
    status,
    created_at
FROM invitations
WHERE email IN ('jhoward@rpgcc.co.uk', 'BSGBD@rpgcc.co.uk')
ORDER BY email;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
-- Check all tables for the old email (should return 0 rows)

SELECT 
    'auth.users' as table_name,
    COUNT(*) as old_email_count
FROM auth.users
WHERE email = 'jhoward@rpgcc.co.uk'

UNION ALL

SELECT 
    'practice_members' as table_name,
    COUNT(*) as old_email_count
FROM practice_members
WHERE email = 'jhoward@rpgcc.co.uk'

UNION ALL

SELECT 
    'invitations' as table_name,
    COUNT(*) as old_email_count
FROM invitations
WHERE email = 'jhoward@rpgcc.co.uk';

-- Expected result: All counts should be 0

-- Check the new email exists (should return rows)
SELECT 
    'auth.users' as table_name,
    COUNT(*) as new_email_count
FROM auth.users
WHERE email = 'BSGBD@rpgcc.co.uk'

UNION ALL

SELECT 
    'practice_members' as table_name,
    COUNT(*) as new_email_count
FROM practice_members
WHERE email = 'BSGBD@rpgcc.co.uk';

-- Expected result: Should see counts >= 1

-- =====================================================
-- ALTERNATIVE: If auth.users update fails
-- =====================================================
-- If the UPDATE auth.users command fails due to permissions,
-- you need to change it through Supabase Dashboard:
--
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- 2. Find user with email: jhoward@rpgcc.co.uk
-- 3. Click the "..." menu → "Edit user"
-- 4. Change email to: BSGBD@rpgcc.co.uk
-- 5. Click "Save"
-- 6. Then run Steps 2 and 3 above (practice_members and invitations)
--
-- After changing via Dashboard, you MUST sign out and sign back in
-- with the new email address!

-- =====================================================
-- IMPORTANT POST-CHANGE STEPS
-- =====================================================
-- After running this script:
--
-- 1. Sign out of the TORSOR portal completely
-- 2. Clear your browser cache/cookies
-- 3. Go back to the login page
-- 4. Sign in with: BSGBD@rpgcc.co.uk (and your existing password)
-- 5. You should now be logged in as admin with the new email
--
-- Your password remains the same, only the email changes!
--
-- Once logged in successfully:
-- - Your practice data will be intact
-- - All team members remain unchanged
-- - All assessment data preserved
-- - You can now use jhoward@rpgcc.co.uk for your own skills assessment!

