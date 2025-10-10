-- Check all members in database
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as assessment_count
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY created_at;

