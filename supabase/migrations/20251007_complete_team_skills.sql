-- Complete Team Skills Population
-- All 80 skills for Emma Wilson, Michael Chen, and Sarah Johnson
-- Generated: October 7, 2025

-- Helper function to bulk insert assessments
DO $$
DECLARE
    skill_record RECORD;
    emma_levels INT[] := ARRAY[2,1,2,2,2,2,2,1,1,1,1,1,3,2,2,2,1,1,2,2,3,4,3,1,4,2,3,1,2,2,2,1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,3,2,3,3,2,3,2,2,3,3,3,3,3,2,2,3,3,3,1,1];
    michael_levels INT[] := ARRAY[4,3,4,4,4,3,4,3,2,4,4,3,4,4,4,3,2,3,4,3,4,5,4,4,3,4,5,3,2,2,4,4,5,4,4,3,2,3,4,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,3,4,3,3,4,4,4,4,4,4,4,4,4,4,3,2];
    sarah_levels INT[] := ARRAY[5,4,5,5,5,4,4,4,4,4,5,4,4,3,4,4,3,3,4,4,4,5,5,4,3,4,5,2,2,2,5,5,5,5,5,5,4,4,4,5,4,4,4,5,4,4,3,5,4,4,4,3,3,4,5,5,4,5,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2];
    emma_interest INT[] := ARRAY[4,3,5,4,3,3,3,2,2,3,3,2,5,3,3,3,4,4,4,4,5,4,3,5,3,3,4,5,4,3,4,4,4,4,3,2,2,2,3,2,3,4,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,3,4,4,4,4,4,3,4,4,4,4,4,4,4,4,4,4,4];
    michael_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,4,3,4,3,3,3,4,4,4,4,4,4,3,4,4,4,5,4,3,3,5,4,5,4,4,3,3,4,4,3,3,3,3,4,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3];
    sarah_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,3,4,3,3,3,3,4,4,4,4,3,4,3,4,4,4,4,4,3,3,5,4,5,4,5,5,3,5,4,5,4,3,3,5,3,4,3,4,3,3,4,3,3,4,5,5,3,4,3,3,5,5,4,4,5,4,4,5,5,5,5,5,4,5,5,5,5,5,3,3];
    idx INT := 1;
BEGIN
    -- Loop through all skills
    FOR skill_record IN 
        SELECT id, name FROM skills ORDER BY id
    LOOP
        -- Emma Wilson
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessment_type, notes
        )
        SELECT 
            (SELECT id FROM practice_members WHERE role = 'member' LIMIT 1),
            skill_record.id,
            emma_levels[idx],
            emma_interest[idx],
            emma_levels[idx] * 0.5,
            CURRENT_DATE - (random() * 60)::int,
            'self',
            'Emma - ' || skill_record.name
        WHERE NOT EXISTS (
            SELECT 1 FROM skill_assessments 
            WHERE team_member_id = (SELECT id FROM practice_members WHERE role = 'member' LIMIT 1)
            AND skill_id = skill_record.id
        );
        
        -- Michael Chen
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessment_type, notes
        )
        SELECT 
            (SELECT id FROM practice_members WHERE role = 'member' OFFSET 1 LIMIT 1),
            skill_record.id,
            michael_levels[idx],
            michael_interest[idx],
            michael_levels[idx] * 1.5,
            CURRENT_DATE - (random() * 45)::int,
            'manager',
            'Michael - ' || skill_record.name
        WHERE NOT EXISTS (
            SELECT 1 FROM skill_assessments 
            WHERE team_member_id = (SELECT id FROM practice_members WHERE role = 'member' OFFSET 1 LIMIT 1)
            AND skill_id = skill_record.id
        );
        
        -- Sarah Johnson
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessment_type, notes
        )
        SELECT 
            (SELECT id FROM practice_members WHERE role = 'admin' LIMIT 1),
            skill_record.id,
            sarah_levels[idx],
            sarah_interest[idx],
            sarah_levels[idx] * 2.0,
            CURRENT_DATE - (random() * 30)::int,
            '360',
            'Sarah - ' || skill_record.name
        WHERE NOT EXISTS (
            SELECT 1 FROM skill_assessments 
            WHERE team_member_id = (SELECT id FROM practice_members WHERE role = 'admin' LIMIT 1)
            AND skill_id = skill_record.id
        );
        
        idx := idx + 1;
        IF idx > 80 THEN
            EXIT;
        END IF;
    END LOOP;
END $$;

-- Verify results
SELECT 
    'Migration Complete!' as status,
    COUNT(*) as total_assessments,
    COUNT(DISTINCT team_member_id) as team_members,
    COUNT(DISTINCT skill_id) as skills_covered
FROM skill_assessments;
