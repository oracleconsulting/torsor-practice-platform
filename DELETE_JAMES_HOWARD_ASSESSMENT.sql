-- =====================================================
-- DELETE JAMES HOWARD TEST ASSESSMENT DATA
-- =====================================================
-- Email: jhoward@rpgcc.co.uk (OR laspartnership@googlemail.com)
-- This script removes YOUR test assessment data
-- so you can re-do it properly after changing admin email
-- =====================================================

-- OPTION 1: Delete assessment for jhoward@rpgcc.co.uk
-- Use this if you did the test assessment as jhoward@rpgcc.co.uk

DO $$
DECLARE
    v_member_id uuid;
BEGIN
    -- Find your practice_member_id
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'jhoward@rpgcc.co.uk'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        -- Delete skill assessments (110 rows)
        DELETE FROM skill_assessments 
        WHERE practice_member_id = v_member_id;
        RAISE NOTICE 'Deleted skill_assessments for jhoward@rpgcc.co.uk';
        
        -- Delete development goals (if exists)
        BEGIN
            DELETE FROM development_goals 
            WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted development_goals';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'development_goals table does not exist, skipping';
        END;
        
        -- Delete survey sessions (if exists)
        BEGIN
            DELETE FROM survey_sessions 
            WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted survey_sessions';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'survey_sessions table does not exist, skipping';
        END;
        
        -- Delete CPD activities (if exists)
        BEGIN
            DELETE FROM cpd_activities 
            WHERE practice_member_id = v_member_id;
            RAISE NOTICE 'Deleted cpd_activities';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'cpd_activities table does not exist, skipping';
        END;
        
        -- Delete practice member record
        DELETE FROM practice_members 
        WHERE id = v_member_id;
        RAISE NOTICE 'Deleted practice_member record';
        
        -- Delete invitations
        DELETE FROM invitations 
        WHERE email = 'jhoward@rpgcc.co.uk';
        RAISE NOTICE 'Deleted invitations';
        
        RAISE NOTICE '✅ James Howard (jhoward@rpgcc.co.uk) assessment data completely deleted!';
    ELSE
        RAISE NOTICE '❌ No member found with email: jhoward@rpgcc.co.uk';
    END IF;
END $$;

-- =====================================================
-- OPTION 2: Delete assessment for laspartnership@googlemail.com
-- Use this if you did the test assessment as laspartnership@googlemail.com
-- (Uncomment the block below)
-- =====================================================

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
        RAISE NOTICE '✅ Test assessment (laspartnership@googlemail.com) completely deleted!';
    ELSE
        RAISE NOTICE '❌ No member found with email: laspartnership@googlemail.com';
    END IF;
END $$;
*/

-- =====================================================
-- OPTION 3: Delete BOTH test assessments
-- Use this to clean up everything and start fresh
-- =====================================================

/*
DO $$
DECLARE
    v_member_id uuid;
    test_emails TEXT[] := ARRAY[
        'jhoward@rpgcc.co.uk',
        'laspartnership@googlemail.com'
    ];
    email TEXT;
BEGIN
    FOREACH email IN ARRAY test_emails
    LOOP
        SELECT id INTO v_member_id 
        FROM practice_members 
        WHERE practice_members.email = email 
        LIMIT 1;
        
        IF v_member_id IS NOT NULL THEN
            DELETE FROM skill_assessments WHERE practice_member_id = v_member_id;
            
            BEGIN
                DELETE FROM development_goals WHERE practice_member_id = v_member_id;
                DELETE FROM survey_sessions WHERE practice_member_id = v_member_id;
                DELETE FROM cpd_activities WHERE practice_member_id = v_member_id;
            EXCEPTION
                WHEN undefined_table THEN NULL;
            END;
            
            DELETE FROM practice_members WHERE id = v_member_id;
            DELETE FROM invitations WHERE invitations.email = email;
            RAISE NOTICE '✅ Deleted all data for: %', email;
        ELSE
            RAISE NOTICE '⚠️ No member found with email: %', email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅✅ All test assessment data cleaned up!';
END $$;
*/

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to check what's left
-- Expected: 0 rows for the emails you deleted

SELECT 
    'practice_members' as table_name,
    email,
    name,
    role,
    created_at
FROM practice_members
WHERE email IN ('jhoward@rpgcc.co.uk', 'laspartnership@googlemail.com')
ORDER BY email;

SELECT 
    'skill_assessments' as table_name,
    COUNT(*) as assessment_count,
    pm.email,
    pm.name
FROM skill_assessments sa
JOIN practice_members pm ON sa.practice_member_id = pm.id
WHERE pm.email IN ('jhoward@rpgcc.co.uk', 'laspartnership@googlemail.com')
GROUP BY pm.email, pm.name;

SELECT 
    'invitations' as table_name,
    email,
    name,
    status,
    created_at
FROM invitations
WHERE email IN ('jhoward@rpgcc.co.uk', 'laspartnership@googlemail.com')
ORDER BY email;

-- =====================================================
-- WHICH OPTION SHOULD YOU USE?
-- =====================================================
--
-- 🎯 MOST LIKELY: Use OPTION 1
-- - You probably did the test assessment as jhoward@rpgcc.co.uk
-- - This is your admin email that you're about to change to BSGBD@rpgcc.co.uk
-- - Deleting this lets you re-do the assessment with your proper email later
--
-- 🤔 IF UNSURE: Run the VERIFICATION queries first
-- - See which email(s) have assessment data
-- - Then uncomment the appropriate option above
--
-- 🧹 NUCLEAR OPTION: Use OPTION 3 (uncomment it)
-- - Deletes ALL test assessment data for both emails
-- - Clean slate to start fresh
-- - Safest if you're not sure what you did
--
-- =====================================================
-- WORKFLOW AFTER DELETION
-- =====================================================
--
-- After deleting your test assessment data:
--
-- 1. Run CHANGE_ADMIN_EMAIL.sql to change admin email to BSGBD@rpgcc.co.uk
-- 2. Sign out and sign back in with new admin email (BSGBD@rpgcc.co.uk)
-- 3. Go to Team Invitations
-- 4. Create invitation for jhoward@rpgcc.co.uk (your real email)
-- 5. Complete the assessment properly as a team member
-- 6. Your data will show in Skills Matrix correctly!
--
-- This way:
-- ✅ Admin account = BSGBD@rpgcc.co.uk (oversight/management)
-- ✅ Team member = jhoward@rpgcc.co.uk (your skills assessment)
-- ✅ No conflicts or duplicate data

