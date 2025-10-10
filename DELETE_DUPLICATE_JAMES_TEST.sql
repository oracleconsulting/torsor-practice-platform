-- Delete the duplicate test "james howard" record
-- This is the laspartnership@googlemail.com entry (your old test)
-- NOT Luke's data, NOT your real admin account

DO $$
DECLARE
    v_member_id uuid;
BEGIN
    -- Find the specific member by email
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'laspartnership@googlemail.com'
      AND name = 'james howard'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        RAISE NOTICE 'Found duplicate test member: % (%)', v_member_id, 'laspartnership@googlemail.com';
        
        -- Delete skill assessments (110 rows)
        DELETE FROM skill_assessments 
        WHERE team_member_id = v_member_id;
        RAISE NOTICE '✅ Deleted skill_assessments';
        
        -- Delete development goals (if exists)
        BEGIN
            DELETE FROM development_goals 
            WHERE team_member_id = v_member_id;
            RAISE NOTICE '✅ Deleted development_goals';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'ℹ️  development_goals table does not exist, skipping';
        END;
        
        -- Delete survey sessions (if exists)
        BEGIN
            DELETE FROM survey_sessions 
            WHERE team_member_id = v_member_id;
            RAISE NOTICE '✅ Deleted survey_sessions';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'ℹ️  survey_sessions table does not exist, skipping';
        END;
        
        -- Delete CPD activities (if exists)
        BEGIN
            DELETE FROM cpd_activities 
            WHERE team_member_id = v_member_id;
            RAISE NOTICE '✅ Deleted cpd_activities';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'ℹ️  cpd_activities table does not exist, skipping';
        END;
        
        -- Delete practice member record
        DELETE FROM practice_members 
        WHERE id = v_member_id;
        RAISE NOTICE '✅ Deleted practice_member record';
        
        -- Delete related invitations
        DELETE FROM invitations 
        WHERE email = 'laspartnership@googlemail.com';
        RAISE NOTICE '✅ Deleted invitations';
        
        RAISE NOTICE '🎉 DUPLICATE TEST DATA DELETED! (laspartnership@googlemail.com as "james howard")';
        RAISE NOTICE 'Remaining members should be:';
        RAISE NOTICE '  - BSGBD@rpgcc.co.uk (your admin)';
        RAISE NOTICE '  - Ltyrrell@rpgcc.co.uk (Luke)';
        RAISE NOTICE '  - JAnnandeswaran@rpgcc.co.uk (Jaanu)';
    ELSE
        RAISE NOTICE '❌ No duplicate test member found with email: laspartnership@googlemail.com';
    END IF;
END $$;

-- Verify the deletion
SELECT 
    name,
    email,
    role,
    (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as assessments
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY created_at;

