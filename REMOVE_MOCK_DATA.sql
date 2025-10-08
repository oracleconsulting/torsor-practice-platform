-- =====================================================
-- Remove Mock/Test Team Members
-- Clears Emma Wilson, Michael Chen, Sarah Johnson
-- =====================================================

-- This will remove all test data and leave you with a clean slate
-- for your real 16-person team

DO $$
DECLARE
    deleted_assessments INT;
    deleted_goals INT;
    deleted_sessions INT;
    deleted_members INT;
BEGIN
    RAISE NOTICE '=== Removing Mock Data ===';
    
    -- 1. Delete skill assessments for all current team members
    DELETE FROM skill_assessments 
    WHERE team_member_id IN (SELECT id FROM practice_members);
    GET DIAGNOSTICS deleted_assessments = ROW_COUNT;
    RAISE NOTICE 'Deleted % skill assessments', deleted_assessments;
    
    -- 2. Delete development goals
    DELETE FROM development_goals 
    WHERE team_member_id IN (SELECT id FROM practice_members);
    GET DIAGNOSTICS deleted_goals = ROW_COUNT;
    RAISE NOTICE 'Deleted % development goals', deleted_goals;
    
    -- 3. Delete survey sessions
    DELETE FROM survey_sessions 
    WHERE team_member_id IN (SELECT id FROM practice_members);
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    RAISE NOTICE 'Deleted % survey sessions', deleted_sessions;
    
    -- 4. Delete practice members (but keep auth users in case they're real)
    -- This only removes the practice_members records, not the auth.users
    DELETE FROM practice_members;
    GET DIAGNOSTICS deleted_members = ROW_COUNT;
    RAISE NOTICE 'Deleted % practice members', deleted_members;
    
    RAISE NOTICE '=== Cleanup Complete! ===';
    RAISE NOTICE 'Database is now ready for your real team members';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Ready for your real team!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to Team Management → Team Invitations';
    RAISE NOTICE '2. Click "New Invitation"';
    RAISE NOTICE '3. Add your first real team member';
END $$;

-- Verify cleanup
SELECT 
    'practice_members' as table_name,
    COUNT(*) as remaining_records
FROM practice_members
UNION ALL
SELECT 
    'skill_assessments',
    COUNT(*)
FROM skill_assessments
UNION ALL
SELECT 
    'development_goals',
    COUNT(*)
FROM development_goals
UNION ALL
SELECT 
    'survey_sessions',
    COUNT(*)
FROM survey_sessions;

-- Should show 0 for all tables above

-- Skills table should still have 85 skills
SELECT 
    '✅ Skills table (should be 85)' as status,
    COUNT(*) as skill_count
FROM skills;

