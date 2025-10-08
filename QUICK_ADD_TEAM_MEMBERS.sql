-- =====================================================
-- Quick Add Team Members to TORSOR
-- For testing or manual onboarding
-- =====================================================

-- OPTION 1: Create auth users + practice members (Recommended)
-- Run this in Supabase SQL Editor

-- Step 1: Create auth users
-- Note: You'll need to use Supabase Dashboard → Authentication → Add User
-- This creates proper auth records with emails

-- Step 2: After creating auth users, link them to practice_members
-- Replace the user_ids and practice_id with your actual values

-- Example for one team member:
INSERT INTO practice_members (
    id,
    practice_id,
    user_id,
    role,
    permissions,
    created_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM practices LIMIT 1), -- Your practice ID
    'USER_ID_FROM_AUTH_USERS_TABLE',    -- From auth.users
    'Team Member',
    '{"can_view_skills": true, "can_edit_own": true}',
    CURRENT_TIMESTAMP
);

-- =====================================================
-- OPTION 2: Bulk add for testing (No real auth accounts)
-- This creates practice_members but they can't log in yet
-- =====================================================

DO $$
DECLARE
    practice_id UUID;
    member_emails TEXT[] := ARRAY[
        'member1@rpgcc.com',
        'member2@rpgcc.com',
        'member3@rpgcc.com',
        'member4@rpgcc.com',
        'member5@rpgcc.com',
        'member6@rpgcc.com',
        'member7@rpgcc.com',
        'member8@rpgcc.com',
        'member9@rpgcc.com',
        'member10@rpgcc.com'
    ];
    email TEXT;
BEGIN
    -- Get your practice ID
    SELECT id INTO practice_id FROM practices LIMIT 1;
    
    -- Create placeholder practice members
    FOREACH email IN ARRAY member_emails
    LOOP
        -- First create auth user (this is a workaround - normally Supabase does this)
        -- You'll need to create real auth users through Supabase Dashboard
        
        RAISE NOTICE 'Would create member for: %', email;
        
        -- For now, just show what would be created
        -- Uncomment below once you have auth.users set up
        
        /*
        INSERT INTO practice_members (
            practice_id,
            user_id,
            role,
            created_at
        )
        SELECT 
            practice_id,
            u.id,
            'Team Member',
            CURRENT_TIMESTAMP
        FROM auth.users u
        WHERE u.email = email;
        */
    END LOOP;
END $$;

-- =====================================================
-- RECOMMENDED APPROACH: Use the Invitations Portal
-- =====================================================

/*
Instead of manual SQL, use the built-in invitations system:

1. Navigate to: /accountancy/team/invitations

2. Click "New Invitation"

3. Fill in:
   - Email: team.member@rpgcc.com
   - Name: Team Member Name
   - Role: Their role (e.g., "Senior Accountant")
   - Message: Personal welcome note

4. Send or copy the invitation link

5. Team member:
   - Receives email (or you share link)
   - Creates account (sets password)
   - Completes assessment
   - Appears in Skills Matrix automatically

This is the PROPER way and what we built today!
*/

-- =====================================================
-- View Current Team Members
-- =====================================================

SELECT 
    pm.id,
    u.email,
    pm.role,
    COUNT(sa.id) as skills_assessed,
    pm.created_at
FROM practice_members pm
LEFT JOIN auth.users u ON pm.user_id = u.id
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
GROUP BY pm.id, u.email, pm.role, pm.created_at
ORDER BY pm.created_at DESC;

-- =====================================================
-- Check if invitation system tables exist
-- =====================================================

SELECT 
    'survey_sessions' as table_name,
    COUNT(*) as row_count 
FROM survey_sessions
UNION ALL
SELECT 
    'notifications',
    COUNT(*) 
FROM notifications
UNION ALL
SELECT 
    'development_goals',
    COUNT(*) 
FROM development_goals;

