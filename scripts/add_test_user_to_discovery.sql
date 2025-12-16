-- ============================================================================
-- ADD TEST USER TO DISCOVERY ASSESSMENT
-- ============================================================================
-- Adds laspartnership@googlemail.com to destination_discovery so they can
-- be assigned other services for testing
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_practice_member_id UUID;
    v_practice_id UUID;
    v_discovery_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'laspartnership@googlemail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User laspartnership@googlemail.com not found in auth.users';
    END IF;
    
    RAISE NOTICE 'Found user: %', v_user_id;
    
    -- Find the practice_member record
    SELECT id, practice_id INTO v_practice_member_id, v_practice_id
    FROM practice_members
    WHERE user_id = v_user_id
    LIMIT 1;
    
    IF v_practice_member_id IS NULL THEN
        RAISE EXCEPTION 'Practice member record not found for user';
    END IF;
    
    RAISE NOTICE 'Found practice_member: % (practice_id: %)', v_practice_member_id, v_practice_id;
    
    -- Check if destination_discovery already exists
    SELECT id INTO v_discovery_id
    FROM destination_discovery
    WHERE client_id = v_practice_member_id
    LIMIT 1;
    
    IF v_discovery_id IS NOT NULL THEN
        RAISE NOTICE '✅ Destination discovery already exists: %', v_discovery_id;
        RAISE NOTICE 'User is already enrolled in discovery assessment';
    ELSE
        -- Create destination_discovery record
        INSERT INTO destination_discovery (
            client_id,
            practice_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_practice_member_id,
            v_practice_id,
            'pending', -- or 'in_progress' if they've started
            NOW(),
            NOW()
        )
        RETURNING id INTO v_discovery_id;
        
        RAISE NOTICE '✅ Created destination_discovery record: %', v_discovery_id;
        RAISE NOTICE 'User is now enrolled in discovery assessment';
    END IF;
    
    -- Display summary
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SUMMARY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'User Email: laspartnership@googlemail.com';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Practice Member ID: %', v_practice_member_id;
    RAISE NOTICE 'Practice ID: %', v_practice_id;
    RAISE NOTICE 'Discovery ID: %', v_discovery_id;
    RAISE NOTICE '==============================================';
    
END $$;

