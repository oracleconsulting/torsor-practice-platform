-- Simple Skills Population for Team Members
-- Works with existing practice_members schema
-- Generated: October 7, 2025

-- This migration populates all 80 skills for the first 3 practice members
-- Adjust the WHERE clause if you need different members

DO $$
DECLARE
    skill_record RECORD;
    member_record RECORD;
    member_ids UUID[] := ARRAY[]::UUID[];
    member_names TEXT[] := ARRAY['Emma Wilson', 'Michael Chen', 'Sarah Johnson'];
    member_idx INT := 1;
    skill_idx INT := 1;
    
    -- Skill levels for each member (80 skills each)
    emma_levels INT[] := ARRAY[2,1,2,2,2,2,2,1,1,1,1,1,3,2,2,2,1,1,2,2,3,4,3,1,4,2,3,1,2,2,2,1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,3,2,3,3,2,3,2,2,3,3,3,3,3,2,2,3,3,3,1,1];
    michael_levels INT[] := ARRAY[4,3,4,4,4,3,4,3,2,4,4,3,4,4,4,3,2,3,4,3,4,5,4,4,3,4,5,3,2,2,4,4,5,4,4,3,2,3,4,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,3,4,3,3,4,4,4,4,4,4,4,4,4,4,3,2];
    sarah_levels INT[] := ARRAY[5,4,5,5,5,4,4,4,4,4,5,4,4,3,4,4,3,3,4,4,4,5,5,4,3,4,5,2,2,2,5,5,5,5,5,5,4,4,4,5,4,4,4,5,4,4,3,5,4,4,4,3,3,4,5,5,4,5,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2];
    
    emma_interest INT[] := ARRAY[4,3,5,4,3,3,3,2,2,3,3,2,5,3,3,3,4,4,4,4,5,4,3,5,3,3,4,5,4,3,4,4,4,4,3,2,2,2,3,2,3,4,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,3,4,4,4,4,4,3,4,4,4,4,4,4,4,4,4,4,4];
    michael_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,4,3,4,3,3,3,4,4,4,4,4,4,3,4,4,4,5,4,3,3,5,4,5,4,4,3,3,4,4,3,3,3,3,4,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3];
    sarah_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,3,4,3,3,3,3,4,4,4,4,3,4,3,4,4,4,4,4,3,3,5,4,5,4,5,5,3,5,4,5,4,3,3,5,3,4,3,4,3,3,4,3,3,4,5,5,3,4,3,3,5,5,4,4,5,4,4,5,5,5,5,5,4,5,5,5,5,5,3,3];
    
    current_member_id UUID;
    current_levels INT[];
    current_interests INT[];
    
BEGIN
    RAISE NOTICE '===== Starting Skills Population =====';
    
    -- Get the first 3 practice members
    FOR member_record IN 
        SELECT id FROM practice_members 
        ORDER BY created_at 
        LIMIT 3
    LOOP
        member_ids := array_append(member_ids, member_record.id);
        RAISE NOTICE 'Found member ID: %', member_record.id;
    END LOOP;
    
    -- If we don't have 3 members, create a note
    IF array_length(member_ids, 1) IS NULL OR array_length(member_ids, 1) < 3 THEN
        RAISE EXCEPTION 'Need at least 3 practice members in the database. Found: %', COALESCE(array_length(member_ids, 1), 0);
    END IF;
    
    -- Clear any existing assessments for these members
    DELETE FROM skill_assessments WHERE team_member_id = ANY(member_ids);
    RAISE NOTICE 'Cleared existing assessments for % members', array_length(member_ids, 1);
    
    -- Process each member
    FOR member_idx IN 1..3 LOOP
        current_member_id := member_ids[member_idx];
        
        -- Set the appropriate skill levels and interests
        IF member_idx = 1 THEN
            current_levels := emma_levels;
            current_interests := emma_interest;
            RAISE NOTICE 'Processing Emma Wilson (Member 1) - ID: %', current_member_id;
        ELSIF member_idx = 2 THEN
            current_levels := michael_levels;
            current_interests := michael_interest;
            RAISE NOTICE 'Processing Michael Chen (Member 2) - ID: %', current_member_id;
        ELSE
            current_levels := sarah_levels;
            current_interests := sarah_interest;
            RAISE NOTICE 'Processing Sarah Johnson (Member 3) - ID: %', current_member_id;
        END IF;
        
        -- Loop through all skills
        skill_idx := 1;
        FOR skill_record IN
            SELECT id, name FROM skills ORDER BY id
        LOOP
            -- Insert skill assessment
            INSERT INTO skill_assessments (
                team_member_id,
                skill_id,
                current_level,
                interest_level,
                years_experience,
                last_used_date,
                assessed_by,
                assessment_type,
                notes
            ) VALUES (
                current_member_id,
                skill_record.id,
                current_levels[skill_idx],
                current_interests[skill_idx],
                CASE 
                    WHEN current_levels[skill_idx] > 1 THEN (current_levels[skill_idx] - 1) * 0.5 * member_idx
                    ELSE 0.5 
                END,
                CURRENT_DATE - (member_idx * 5 || ' days')::INTERVAL,
                current_member_id,
                CASE member_idx
                    WHEN 1 THEN 'self'
                    WHEN 2 THEN 'manager'
                    ELSE '360'
                END,
                member_names[member_idx] || ' - ' || skill_record.name
            );
            
            skill_idx := skill_idx + 1;
        END LOOP;
        
        RAISE NOTICE 'Populated % skills for %', skill_idx - 1, member_names[member_idx];
    END LOOP;
    
    RAISE NOTICE '===== Migration Complete! =====';
END $$;

-- Verification Query
SELECT 
    'Migration Complete!' as status,
    COUNT(*) as total_assessments,
    COUNT(DISTINCT team_member_id) as team_members,
    COUNT(DISTINCT skill_id) as skills_covered
FROM skill_assessments;

-- Summary by team member
SELECT 
    sa.team_member_id,
    COUNT(*) as skills_assessed,
    ROUND(AVG(sa.current_level), 2) as avg_skill_level,
    ROUND(AVG(sa.interest_level), 2) as avg_interest_level,
    MIN(sa.current_level) as min_level,
    MAX(sa.current_level) as max_level
FROM skill_assessments sa
GROUP BY sa.team_member_id
ORDER BY avg_skill_level DESC;

