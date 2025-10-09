-- =====================================================
-- DELETE LUKE TYRRELL TEST DATA
-- =====================================================
-- Email: laspartnership@googlemail.com
-- This script removes all test data for Luke Tyrrell
-- =====================================================

-- Quick One-Step Delete (RECOMMENDED)
-- Just copy and run this in Supabase SQL Editor
DO $$
DECLARE
    v_member_id uuid;
BEGIN
    -- Find Luke Tyrrell's practice_member_id
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'laspartnership@googlemail.com'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        -- Delete skill assessments (110 rows)
        DELETE FROM skill_assessments 
        WHERE practice_member_id = v_member_id;
        RAISE NOTICE 'Deleted skill_assessments for Luke Tyrrell';
        
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
        WHERE email = 'laspartnership@googlemail.com';
        RAISE NOTICE 'Deleted invitations';
        
        RAISE NOTICE '✅ Luke Tyrrell (laspartnership@googlemail.com) completely deleted!';
    ELSE
        RAISE NOTICE '❌ No member found with email: laspartnership@googlemail.com';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this after deletion to confirm everything is gone
-- Expected result: All counts should be 0

SELECT 
    'practice_members' as table_name,
    COUNT(*) as remaining_records
FROM practice_members
WHERE email = 'laspartnership@googlemail.com'

UNION ALL

SELECT 
    'invitations' as table_name,
    COUNT(*) as remaining_records
FROM invitations
WHERE email = 'laspartnership@googlemail.com'

UNION ALL

SELECT 
    'skill_assessments' as table_name,
    COUNT(*) as remaining_records
FROM skill_assessments
WHERE practice_member_id IN (
    SELECT id FROM practice_members 
    WHERE email = 'laspartnership@googlemail.com'
);

-- Expected output:
-- table_name          | remaining_records
-- -------------------+------------------
-- practice_members    | 0
-- invitations         | 0
-- skill_assessments   | 0

