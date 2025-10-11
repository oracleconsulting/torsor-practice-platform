-- Check what data exists

SELECT 'SURVEY_SESSIONS' as table_name, COUNT(*) as count FROM survey_sessions;
SELECT 'PRACTICE_MEMBERS' as table_name, COUNT(*) as count FROM practice_members;
SELECT 'SKILL_ASSESSMENTS' as table_name, COUNT(*) as count FROM skill_assessments;
SELECT 'INVITATIONS' as table_name, COUNT(*) as count FROM invitations;

-- Show practice members
SELECT 'PRACTICE_MEMBERS_DETAIL' as info;
SELECT id, name, email, role, created_at FROM practice_members ORDER BY created_at DESC LIMIT 10;

-- Show invitations
SELECT 'INVITATIONS_DETAIL' as info;
SELECT email, name, status, accepted_at FROM invitations WHERE status IN ('accepted', 'completed') ORDER BY created_at DESC LIMIT 10;

-- Show survey sessions
SELECT 'SURVEY_SESSIONS_DETAIL' as info;
SELECT email, status, progress_percentage, submitted_at, LENGTH(survey_data::text) as data_length FROM survey_sessions ORDER BY created_at DESC LIMIT 10;

-- Show skill assessments count by member
SELECT 'ASSESSMENTS_BY_MEMBER' as info;
SELECT pm.name, pm.email, COUNT(sa.*) as assessment_count
FROM practice_members pm
LEFT JOIN skill_assessments sa ON pm.id = sa.team_member_id
GROUP BY pm.id, pm.name, pm.email
ORDER BY assessment_count DESC;

