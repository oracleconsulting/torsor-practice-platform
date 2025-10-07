-- Complete Team Setup with Skills
-- Creates team members and populates all 80 skills
-- Generated: October 7, 2025

-- First, ensure we have auth users for the team members
DO $$
DECLARE
    emma_user_id UUID;
    michael_user_id UUID;
    sarah_user_id UUID;
BEGIN
    -- Create or get Emma Wilson's auth user
    SELECT id INTO emma_user_id FROM auth.users WHERE email = 'emma.wilson@praxis.com';
    IF emma_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'emma.wilson@praxis.com',
            crypt('TempPassword123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Emma Wilson"}',
            false,
            ''
        ) RETURNING id INTO emma_user_id;
        RAISE NOTICE 'Created auth user for Emma Wilson: %', emma_user_id;
    END IF;

    -- Create or get Michael Chen's auth user
    SELECT id INTO michael_user_id FROM auth.users WHERE email = 'michael.chen@praxis.com';
    IF michael_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'michael.chen@praxis.com',
            crypt('TempPassword123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Michael Chen"}',
            false,
            ''
        ) RETURNING id INTO michael_user_id;
        RAISE NOTICE 'Created auth user for Michael Chen: %', michael_user_id;
    END IF;

    -- Create or get Sarah Johnson's auth user
    SELECT id INTO sarah_user_id FROM auth.users WHERE email = 'sarah.johnson@praxis.com';
    IF sarah_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'sarah.johnson@praxis.com',
            crypt('TempPassword123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Sarah Johnson"}',
            false,
            ''
        ) RETURNING id INTO sarah_user_id;
        RAISE NOTICE 'Created auth user for Sarah Johnson: %', sarah_user_id;
    END IF;

    -- Now create or update practice members
    INSERT INTO practice_members (user_id, name, role, department, email, phone, status, created_at, updated_at)
    VALUES 
        (emma_user_id, 'Emma Wilson', 'Junior Advisor', 'Advisory Services', 'emma.wilson@praxis.com', '+44 20 7123 4567', 'active', NOW(), NOW()),
        (michael_user_id, 'Michael Chen', 'Advisory Consultant', 'Advisory Services', 'michael.chen@praxis.com', '+44 20 7123 4568', 'active', NOW(), NOW()),
        (sarah_user_id, 'Sarah Johnson', 'Senior Manager', 'Advisory Services', 'sarah.johnson@praxis.com', '+44 20 7123 4569', 'active', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RAISE NOTICE 'Team members created/updated successfully';
END $$;

-- Now populate all skills for all team members
DO $$
DECLARE
    skill_record RECORD;
    emma_id UUID;
    michael_id UUID;
    sarah_id UUID;
    emma_levels INT[] := ARRAY[2,1,2,2,2,2,2,1,1,1,1,1,3,2,2,2,1,1,2,2,3,4,3,1,4,2,3,1,2,2,2,1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,3,2,3,3,2,3,2,2,3,3,3,3,3,2,2,3,3,3,1,1];
    michael_levels INT[] := ARRAY[4,3,4,4,4,3,4,3,2,4,4,3,4,4,4,3,2,3,4,3,4,5,4,4,3,4,5,3,2,2,4,4,5,4,4,3,2,3,4,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,3,4,3,3,4,4,4,4,4,4,4,4,4,4,3,2];
    sarah_levels INT[] := ARRAY[5,4,5,5,5,4,4,4,4,4,5,4,4,3,4,4,3,3,4,4,4,5,5,4,3,4,5,2,2,2,5,5,5,5,5,5,4,4,4,5,4,4,4,5,4,4,3,5,4,4,4,3,3,4,5,5,4,5,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,2,2];
    emma_interest INT[] := ARRAY[4,3,5,4,3,3,3,2,2,3,3,2,5,3,3,3,4,4,4,4,5,4,3,5,3,3,4,5,4,3,4,4,4,4,3,2,2,2,3,2,3,4,3,3,4,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,3,4,4,4,4,4,3,4,4,4,4,4,4,4,4,4,4,4];
    michael_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,4,3,4,3,3,3,4,4,4,4,4,4,3,4,4,4,5,4,3,3,5,4,5,4,4,3,3,4,4,3,3,3,3,4,3,3,3,3,3,3,4,3,3,3,4,4,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3];
    sarah_interest INT[] := ARRAY[4,3,4,4,4,3,3,4,3,4,3,4,3,3,3,3,4,4,4,4,3,4,3,4,4,4,4,4,3,3,5,4,5,4,5,5,3,5,4,5,4,3,3,5,3,4,3,4,3,3,4,3,3,4,5,5,3,4,3,3,5,5,4,4,5,4,4,5,5,5,5,5,4,5,5,5,5,5,3,3];
    idx INT := 1;
BEGIN
    -- Get team member IDs
    SELECT id INTO emma_id FROM practice_members WHERE email = 'emma.wilson@praxis.com';
    SELECT id INTO michael_id FROM practice_members WHERE email = 'michael.chen@praxis.com';
    SELECT id INTO sarah_id FROM practice_members WHERE email = 'sarah.johnson@praxis.com';

    RAISE NOTICE 'Emma ID: %, Michael ID: %, Sarah ID: %', emma_id, michael_id, sarah_id;

    -- Delete existing assessments for these members to avoid duplicates
    DELETE FROM skill_assessments WHERE team_member_id IN (emma_id, michael_id, sarah_id);
    RAISE NOTICE 'Cleared existing assessments';

    -- Loop through all skills
    FOR skill_record IN
        SELECT id, name FROM skills ORDER BY id
    LOOP
        -- Insert for Emma Wilson (Junior Advisor)
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessed_by, assessment_type, notes
        ) VALUES (
            emma_id,
            skill_record.id,
            emma_levels[idx],
            emma_interest[idx],
            CASE WHEN emma_levels[idx] > 1 THEN (emma_levels[idx] - 1) * 0.5 + 0.5 ELSE 0.5 END,
            '2024-09-01',
            emma_id,
            'self',
            'Initial self-assessment for junior role'
        );

        -- Insert for Michael Chen (Advisory Consultant)
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessed_by, assessment_type, notes
        ) VALUES (
            michael_id,
            skill_record.id,
            michael_levels[idx],
            michael_interest[idx],
            CASE WHEN michael_levels[idx] > 1 THEN (michael_levels[idx] - 1) * 1.5 + 1 ELSE 1 END,
            '2024-09-15',
            sarah_id,
            'manager',
            'Manager assessment for advisory consultant'
        );

        -- Insert for Sarah Johnson (Senior Manager)
        INSERT INTO skill_assessments (
            team_member_id, skill_id, current_level, interest_level, 
            years_experience, last_used_date, assessed_by, assessment_type, notes
        ) VALUES (
            sarah_id,
            skill_record.id,
            sarah_levels[idx],
            sarah_interest[idx],
            CASE WHEN sarah_levels[idx] > 1 THEN (sarah_levels[idx] - 1) * 2.5 + 2 ELSE 2 END,
            '2024-09-20',
            sarah_id,
            '360',
            '360-degree assessment for senior manager'
        );

        idx := idx + 1;
    END LOOP;

    RAISE NOTICE 'Successfully populated % skills for 3 team members', idx - 1;
END $$;

-- Verify results
SELECT 
    'Migration Complete!' as status,
    COUNT(*) as total_assessments,
    COUNT(DISTINCT team_member_id) as team_members,
    COUNT(DISTINCT skill_id) as skills_covered
FROM skill_assessments
WHERE team_member_id IS NOT NULL;

-- Show summary by team member
SELECT 
    pm.name,
    pm.role,
    COUNT(sa.*) as skills_assessed,
    ROUND(AVG(sa.current_level), 2) as avg_skill_level,
    ROUND(AVG(sa.interest_level), 2) as avg_interest_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON pm.id = sa.team_member_id
WHERE pm.email IN ('emma.wilson@praxis.com', 'michael.chen@praxis.com', 'sarah.johnson@praxis.com')
GROUP BY pm.name, pm.role
ORDER BY pm.name;

