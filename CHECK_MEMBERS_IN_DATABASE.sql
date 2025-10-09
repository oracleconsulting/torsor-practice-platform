-- =====================================================
-- CHECK WHO ARE THE 3 MEMBERS IN DATABASE
-- =====================================================
-- You expect 2, but system shows 3
-- Let's find out who the extra member is
-- =====================================================

-- Show all practice members
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    user_id
FROM practice_members
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY created_at;

-- Count assessments per member
SELECT 
    pm.name,
    pm.email,
    pm.role,
    COUNT(sa.id) as assessment_count,
    pm.created_at
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY pm.id, pm.name, pm.email, pm.role, pm.created_at
ORDER BY pm.created_at;

-- Expected result:
-- Should show 3 members with their assessment counts
-- One of them is probably:
-- 1. Your test data (jhoward@rpgcc.co.uk) - needs deletion
-- 2. Luke Tyrrell (laspartnership@googlemail.com) - real data
-- 3. Jaanu's test - if he completed one
--
-- OR your admin account got mixed in somehow

-- =====================================================
-- QUICK FIX: Delete the extra member
-- =====================================================
-- Once you identify who shouldn't be there, run:
-- (Replace EMAIL_TO_DELETE with the actual email)

/*
DO $$
DECLARE
    v_member_id uuid;
BEGIN
    SELECT id INTO v_member_id
    FROM practice_members
    WHERE email = 'EMAIL_TO_DELETE'
    LIMIT 1;
    
    IF v_member_id IS NOT NULL THEN
        DELETE FROM skill_assessments WHERE team_member_id = v_member_id;
        DELETE FROM practice_members WHERE id = v_member_id;
        DELETE FROM invitations WHERE email = 'EMAIL_TO_DELETE';
        RAISE NOTICE '✅ Deleted member: EMAIL_TO_DELETE';
    END IF;
END $$;
*/

