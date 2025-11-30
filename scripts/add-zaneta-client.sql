-- ============================================================================
-- ADD ZANETA AS CLIENT
-- ============================================================================
-- Sets up Zaneta Clark (Tom's wife) as a client with her assessment data
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, check if a user exists for Zaneta (she may need to create an account)
-- For now, we'll set her up as a practice_member linked to Tom's practice

-- Get the practice ID (RPGCC)
DO $$
DECLARE
    v_practice_id UUID;
    v_zaneta_id UUID;
    v_zaneta_user_id UUID;
BEGIN
    -- Get RPGCC practice ID
    SELECT id INTO v_practice_id 
    FROM practices 
    WHERE name ILIKE '%RPGCC%' OR name ILIKE '%RP Griffiths%'
    LIMIT 1;

    IF v_practice_id IS NULL THEN
        RAISE EXCEPTION 'RPGCC practice not found. Please run setup-rpgcc-practice.sql first.';
    END IF;

    RAISE NOTICE 'Found practice ID: %', v_practice_id;

    -- Check if Zaneta already exists
    SELECT id INTO v_zaneta_id
    FROM practice_members
    WHERE email ILIKE '%zaneta%' OR name ILIKE '%zaneta%';

    IF v_zaneta_id IS NOT NULL THEN
        RAISE NOTICE 'Zaneta already exists with ID: %', v_zaneta_id;
    ELSE
        -- Create Zaneta as a client member
        -- Note: She will need to create an account with this email to log in
        INSERT INTO practice_members (
            practice_id,
            name,
            email,
            role,
            member_type,
            status,
            invited_at,
            created_at
        ) VALUES (
            v_practice_id,
            'Zaneta Clark',
            'zaneta@rowgear.com',  -- Update if different email
            'Client',
            'client',
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_zaneta_id;

        RAISE NOTICE 'Created Zaneta with ID: %', v_zaneta_id;
    END IF;

END $$;

-- ============================================================================
-- VIEW RESULT
-- ============================================================================
SELECT 
    pm.id,
    pm.name,
    pm.email,
    pm.member_type,
    pm.status,
    p.name as practice_name
FROM practice_members pm
JOIN practices p ON pm.practice_id = p.id
WHERE pm.email ILIKE '%zaneta%' OR pm.name ILIKE '%zaneta%';

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- After running this script:
-- 
-- 1. Zaneta needs to create a Supabase Auth account with her email
--    - Go to client.torsor.co.uk and sign up with zaneta@rowgear.com
--    - Or use Supabase Dashboard > Authentication > Users > Add User
-- 
-- 2. Once she has an account, update her practice_member record:
--    UPDATE practice_members 
--    SET user_id = '<her-auth-user-id>'
--    WHERE email = 'zaneta@rowgear.com';
-- 
-- 3. She can then log in and complete her assessments
-- 
-- 4. To manually populate her assessments (if data already exists):
--    See the insert statements below
-- ============================================================================

-- ============================================================================
-- MANUAL ASSESSMENT POPULATION (if you have her responses)
-- ============================================================================
-- Uncomment and modify these INSERT statements with Zaneta's actual assessment data

/*
-- Get Zaneta's client ID
DO $$
DECLARE
    v_zaneta_id UUID;
    v_practice_id UUID;
BEGIN
    SELECT id, practice_id INTO v_zaneta_id, v_practice_id
    FROM practice_members
    WHERE email = 'zaneta@rowgear.com';

    -- Part 1 Assessment
    INSERT INTO client_assessments (
        client_id,
        practice_id,
        assessment_type,
        status,
        started_at,
        completed_at,
        responses
    ) VALUES (
        v_zaneta_id,
        v_practice_id,
        'part1',
        'completed',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '6 days',
        '{
            "full_name": "Zaneta Clark",
            "company_name": "Rowgear LTD",
            "business_role": "Co-Owner / Operations",
            "tuesday_test": "Describe her ideal Tuesday...",
            "relationship_mirror": "What does her business relationship with work look like?",
            "ten_year_vision": "Her 10-year vision...",
            "family_feedback": "What would family say about work-life?",
            "monday_frustration": "Her biggest Monday frustration...",
            "magic_away_task": "What would she magic away?",
            "danger_zone": "Her danger zone for backsliding...",
            "secret_pride": "What is she secretly proud of?",
            "readiness_level": "7"
        }'::jsonb
    );

    -- Part 2 Assessment  
    INSERT INTO client_assessments (
        client_id,
        practice_id,
        assessment_type,
        status,
        started_at,
        completed_at,
        responses
    ) VALUES (
        v_zaneta_id,
        v_practice_id,
        'part2',
        'completed',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '4 days',
        '{
            "annual_turnover": "£250k-£500k",
            "profit_margin": "20%",
            "years_trading": "3-5 years",
            "team_size": "2-5 employees",
            "growth_rate": "10-20%",
            "current_working_hours": "50",
            "target_working_hours": "35",
            "growth_bottleneck": "Her specific bottleneck...",
            "money_worry": "Her money worry...",
            "three_experts_needed": "Marketing, Operations, Finance",
            "tools_used": "Shopify, Xero, Google Workspace"
        }'::jsonb
    );

    RAISE NOTICE 'Created assessments for Zaneta (ID: %)', v_zaneta_id;
END $$;
*/

-- ============================================================================
-- QUICK CHECK: View all clients for RPGCC
-- ============================================================================
SELECT 
    pm.name,
    pm.email,
    pm.member_type,
    pm.status,
    (SELECT COUNT(*) FROM client_assessments ca WHERE ca.client_id = pm.id) as assessments_count,
    (SELECT COUNT(*) FROM client_roadmaps cr WHERE cr.client_id = pm.id) as roadmaps_count
FROM practice_members pm
JOIN practices p ON pm.practice_id = p.id
WHERE p.name ILIKE '%RPGCC%' AND pm.member_type = 'client';

