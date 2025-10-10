-- Delete the duplicate test "james howard" record
-- SAFE VERSION: Checks if columns exist before using them

DO $$
DECLARE
    v_member_id uuid;
    v_col_name text;
BEGIN
    -- Find the specific member by email
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'laspartnership@googlemail.com'
      AND name = 'james howard'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        RAISE NOTICE 'Found duplicate test member: %', v_member_id;
        
        -- Delete skill assessments
        DELETE FROM skill_assessments 
        WHERE team_member_id = v_member_id;
        RAISE NOTICE '✅ Deleted skill_assessments';
        
        -- Check if development_goals table exists and which column it uses
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'development_goals') THEN
            -- Check which column name is used (team_member_id or practice_member_id)
            SELECT column_name INTO v_col_name
            FROM information_schema.columns
            WHERE table_name = 'development_goals'
              AND column_name IN ('team_member_id', 'practice_member_id')
            LIMIT 1;
            
            IF v_col_name IS NOT NULL THEN
                EXECUTE format('DELETE FROM development_goals WHERE %I = $1', v_col_name) USING v_member_id;
                RAISE NOTICE '✅ Deleted development_goals (using column: %)', v_col_name;
            ELSE
                RAISE NOTICE 'ℹ️  development_goals exists but has neither team_member_id nor practice_member_id';
            END IF;
        ELSE
            RAISE NOTICE 'ℹ️  development_goals table does not exist';
        END IF;
        
        -- Delete survey sessions (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'survey_sessions') THEN
            BEGIN
                DELETE FROM survey_sessions WHERE team_member_id = v_member_id;
                RAISE NOTICE '✅ Deleted survey_sessions';
            EXCEPTION WHEN undefined_column THEN
                DELETE FROM survey_sessions WHERE practice_member_id = v_member_id;
                RAISE NOTICE '✅ Deleted survey_sessions (using practice_member_id)';
            END;
        ELSE
            RAISE NOTICE 'ℹ️  survey_sessions table does not exist';
        END IF;
        
        -- Delete CPD activities (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cpd_activities') THEN
            BEGIN
                DELETE FROM cpd_activities WHERE team_member_id = v_member_id;
                RAISE NOTICE '✅ Deleted cpd_activities';
            EXCEPTION WHEN undefined_column THEN
                DELETE FROM cpd_activities WHERE practice_member_id = v_member_id;
                RAISE NOTICE '✅ Deleted cpd_activities (using practice_member_id)';
            END;
        ELSE
            RAISE NOTICE 'ℹ️  cpd_activities table does not exist';
        END IF;
        
        -- Delete practice member record
        DELETE FROM practice_members WHERE id = v_member_id;
        RAISE NOTICE '✅ Deleted practice_member record';
        
        -- Delete related invitations
        DELETE FROM invitations WHERE email = 'laspartnership@googlemail.com';
        RAISE NOTICE '✅ Deleted invitations';
        
        RAISE NOTICE '🎉 DUPLICATE TEST DATA DELETED!';
    ELSE
        RAISE NOTICE '❌ No duplicate test member found';
    END IF;
END $$;

-- Verify
SELECT name, email, role,
    (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as assessments
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY created_at;

