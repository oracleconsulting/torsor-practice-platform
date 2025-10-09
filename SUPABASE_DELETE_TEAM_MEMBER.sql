-- =====================================================
-- DELETE TEAM MEMBER AND ALL ASSOCIATED DATA
-- =====================================================
-- This script safely removes a team member and all their data
-- Use this for testing or removing incorrect entries
-- =====================================================

-- STEP 1: Find the team member you want to delete
-- Run this first to get their practice_member_id

SELECT 
    id as practice_member_id,
    name,
    email,
    role,
    created_at
FROM practice_members
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with the email you want to delete
ORDER BY created_at DESC;

-- Copy the 'practice_member_id' from the result above, then use it below

-- =====================================================
-- STEP 2: DELETE ALL DATA FOR THIS TEAM MEMBER
-- =====================================================
-- Replace 'YOUR_PRACTICE_MEMBER_ID_HERE' with the ID from Step 1

-- Delete skill assessments
DELETE FROM skill_assessments
WHERE practice_member_id = 'YOUR_PRACTICE_MEMBER_ID_HERE';
-- Shows: "DELETE X" where X is the number of skill assessments deleted

-- Delete any development goals (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'development_goals'
    ) THEN
        DELETE FROM development_goals WHERE practice_member_id = 'YOUR_PRACTICE_MEMBER_ID_HERE';
        RAISE NOTICE 'Deleted development goals';
    END IF;
END $$;

-- Delete any survey sessions (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'survey_sessions'
    ) THEN
        DELETE FROM survey_sessions WHERE practice_member_id = 'YOUR_PRACTICE_MEMBER_ID_HERE';
        RAISE NOTICE 'Deleted survey sessions';
    END IF;
END $$;

-- Delete any CPD activities (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'cpd_activities'
    ) THEN
        DELETE FROM cpd_activities WHERE practice_member_id = 'YOUR_PRACTICE_MEMBER_ID_HERE';
        RAISE NOTICE 'Deleted CPD activities';
    END IF;
END $$;

-- Delete the practice member record itself
DELETE FROM practice_members
WHERE id = 'YOUR_PRACTICE_MEMBER_ID_HERE';
-- Shows: "DELETE 1" if successful

-- Delete any related invitations
DELETE FROM invitations
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with the same email from Step 1
-- Shows: "DELETE X" where X is the number of invitations deleted

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the member is completely gone

SELECT 
    'practice_members' as table_name,
    COUNT(*) as remaining_records
FROM practice_members
WHERE email = 'YOUR_EMAIL_HERE'

UNION ALL

SELECT 
    'skill_assessments' as table_name,
    COUNT(*) as remaining_records
FROM skill_assessments
WHERE practice_member_id = 'YOUR_PRACTICE_MEMBER_ID_HERE'

UNION ALL

SELECT 
    'invitations' as table_name,
    COUNT(*) as remaining_records
FROM invitations
WHERE email = 'YOUR_EMAIL_HERE';

-- Expected result: All counts should be 0

-- =====================================================
-- QUICK DELETE FOR SPECIFIC EMAIL (ALL IN ONE)
-- =====================================================
-- Use this to delete everything for an email in one go
-- Replace 'YOUR_EMAIL_HERE' with the email you want to remove

DO $$
DECLARE
    v_member_id uuid;
BEGIN
    -- Find practice_member_id
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'YOUR_EMAIL_HERE'  -- Replace this
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        -- Delete skill assessments
        DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
        RAISE NOTICE 'Deleted skill_assessments for member: %', v_member_id;
        
        -- Delete development goals (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'development_goals') THEN
            DELETE FROM development_goals WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted development_goals';
        END IF;
        
        -- Delete survey sessions (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'survey_sessions') THEN
            DELETE FROM survey_sessions WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted survey_sessions';
        END IF;
        
        -- Delete CPD activities (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cpd_activities') THEN
            DELETE FROM cpd_activities WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted cpd_activities';
        END IF;
        
        -- Delete practice member
        DELETE FROM practice_members WHERE id = v_member_id;
        RAISE NOTICE 'Deleted practice_member: %', v_member_id;
        
        -- Delete invitations
        DELETE FROM invitations WHERE email = 'YOUR_EMAIL_HERE';  -- Replace this
        RAISE NOTICE 'Deleted invitations';
        
        RAISE NOTICE 'Team member completely removed!';
    ELSE
        RAISE NOTICE 'No member found with that email';
    END IF;
END $$;

-- =====================================================
-- EXAMPLE: Delete Luke Tyrrell (test user)
-- =====================================================
-- Uncomment and run to delete the test user

/*
DO $$
DECLARE
    v_member_id uuid;
BEGIN
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'laspartnership@googlemail.com'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
        DELETE FROM practice_members WHERE id = v_member_id;
        DELETE FROM invitations WHERE email = 'laspartnership@googlemail.com';
        RAISE NOTICE 'Luke Tyrrell deleted successfully!';
    END IF;
END $$;
*/

