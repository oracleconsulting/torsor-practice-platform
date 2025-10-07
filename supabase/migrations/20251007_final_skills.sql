-- COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- Works with ANY practice_members table structure

DO $$
DECLARE
    skill_record RECORD;
    member_record RECORD;
    member_ids UUID[] := ARRAY[]::UUID[];
    member_names TEXT[] := ARRAY['Emma Wilson', 'Michael Chen', 'Sarah Johnson'];
    member_idx INT := 1;
    skill_idx INT := 1;
    
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
    RAISE NOTICE '=== Starting Skills Population ===';
    
    -- Get first 3 members (order by ID to be consistent)
    FOR member_record IN 
        SELECT id FROM practice_members ORDER BY id LIMIT 3
    LOOP 
        member_ids := array_append(member_ids, member_record.id); 
        RAISE NOTICE 'Found member: %', member_record.id;
    END LOOP;
    
    IF array_length(member_ids, 1) < 3 THEN 
        RAISE EXCEPTION 'Need at least 3 members in practice_members table. Found: %', COALESCE(array_length(member_ids, 1), 0);
    END IF;
    
    -- Clear existing
    DELETE FROM skill_assessments WHERE team_member_id = ANY(member_ids);
    RAISE NOTICE 'Cleared existing assessments';
    
    -- Populate each member
    FOR member_idx IN 1..3 LOOP
        current_member_id := member_ids[member_idx];
        
        IF member_idx = 1 THEN 
            current_levels := emma_levels; 
            current_interests := emma_interest;
            RAISE NOTICE 'Processing Emma Wilson (member 1)';
        ELSIF member_idx = 2 THEN 
            current_levels := michael_levels; 
            current_interests := michael_interest;
            RAISE NOTICE 'Processing Michael Chen (member 2)';
        ELSE 
            current_levels := sarah_levels; 
            current_interests := sarah_interest;
            RAISE NOTICE 'Processing Sarah Johnson (member 3)';
        END IF;
        
        skill_idx := 1;
        FOR skill_record IN SELECT id FROM skills ORDER BY id LOOP
            INSERT INTO skill_assessments (
                team_member_id, 
                skill_id, 
                current_level, 
                interest_level, 
                years_experience, 
                last_used_date, 
                assessed_by, 
                assessment_type
            ) VALUES (
                current_member_id, 
                skill_record.id, 
                current_levels[skill_idx], 
                current_interests[skill_idx], 
                1.0, 
                CURRENT_DATE, 
                current_member_id, 
                'self'
            );
            skill_idx := skill_idx + 1;
        END LOOP;
        
        RAISE NOTICE 'Populated % skills for member %', skill_idx - 1, member_idx;
    END LOOP;
    
    RAISE NOTICE '=== Migration Complete! ===';
END $$;

-- Show results
SELECT 
    'SUCCESS!' as status,
    COUNT(*) as total_assessments, 
    COUNT(DISTINCT team_member_id) as team_members,
    COUNT(DISTINCT skill_id) as skills_covered
FROM skill_assessments;

