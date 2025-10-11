-- =====================================================
-- Link James Howard Auth User to RPGCC Practice
-- Fixes "Setting up your practice..." loop on login
-- Date: October 11, 2025
-- =====================================================

-- ============================================
-- 1. FIND THE AUTH USER AND PRACTICE
-- ============================================

DO $$
DECLARE
    v_auth_user_id UUID;
    v_practice_id UUID;
    v_existing_member_id UUID;
    v_practice_name TEXT;
BEGIN
    -- Find James Howard's auth user ID
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = 'jhoward@rpgcc.co.uk'
    LIMIT 1;
    
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user jhoward@rpgcc.co.uk not found in auth.users table';
    END IF;
    
    RAISE NOTICE 'Found auth user: % (ID: %)', 'jhoward@rpgcc.co.uk', v_auth_user_id;
    
    -- Find RPGCC practice
    SELECT id, name INTO v_practice_id, v_practice_name
    FROM practices
    WHERE name ILIKE '%RPGCC%' OR email ILIKE '%rpgcc%'
    LIMIT 1;
    
    IF v_practice_id IS NULL THEN
        RAISE EXCEPTION 'RPGCC practice not found. Please create practice first.';
    END IF;
    
    RAISE NOTICE 'Found practice: % (ID: %)', v_practice_name, v_practice_id;
    
    -- ============================================
    -- 2. CHECK IF MEMBER RECORD EXISTS
    -- ============================================
    
    -- Check if there's already a practice_members record with this email
    SELECT id INTO v_existing_member_id
    FROM practice_members
    WHERE email = 'jhoward@rpgcc.co.uk'
    LIMIT 1;
    
    IF v_existing_member_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing practice_members record (ID: %)', v_existing_member_id;
        
        -- Update existing record to link auth user
        UPDATE practice_members
        SET 
            user_id = v_auth_user_id,
            permission_role = 'admin'::user_role,
            can_manage_team = true,
            can_invite_members = true,
            can_edit_assessments = true,
            can_delete_data = true,
            updated_at = NOW()
        WHERE id = v_existing_member_id;
        
        RAISE NOTICE '✅ Updated existing practice_members record with auth user_id and admin role';
    ELSE
        RAISE NOTICE 'No existing practice_members record found, creating new one...';
        
        -- Create new practice_members record
        INSERT INTO practice_members (
            user_id,
            practice_id,
            email,
            name,
            role,
            permission_role,
            can_manage_team,
            can_invite_members,
            can_edit_assessments,
            can_delete_data,
            created_at,
            updated_at
        ) VALUES (
            v_auth_user_id,
            v_practice_id,
            'jhoward@rpgcc.co.uk',
            'James Howard',
            'Director',
            'admin'::user_role,
            true,
            true,
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Created new practice_members record with admin role';
    END IF;
    
    -- ============================================
    -- 3. CREATE PROFILE IF MISSING
    -- ============================================
    
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_auth_user_id) THEN
        INSERT INTO profiles (
            id,
            email,
            name,
            portal_access,
            created_at,
            updated_at
        ) VALUES (
            v_auth_user_id,
            'jhoward@rpgcc.co.uk',
            'James Howard',
            ARRAY['accountancy', 'torsor']::text[],
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Created profile record';
    ELSE
        -- Update existing profile to ensure portal access
        UPDATE profiles
        SET 
            portal_access = ARRAY['accountancy', 'torsor']::text[],
            updated_at = NOW()
        WHERE id = v_auth_user_id;
        RAISE NOTICE '✅ Updated existing profile with portal access';
    END IF;
    
    -- ============================================
    -- 4. VERIFICATION
    -- ============================================
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ JAMES HOWARD LINKED TO RPGCC PRACTICE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Auth User ID: %', v_auth_user_id;
    RAISE NOTICE 'Practice: % (ID: %)', v_practice_name, v_practice_id;
    RAISE NOTICE 'Email: jhoward@rpgcc.co.uk';
    RAISE NOTICE 'Role: Director';
    RAISE NOTICE 'Permission Role: Admin';
    RAISE NOTICE 'Portal Access: accountancy, torsor';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now sign in with jhoward@rpgcc.co.uk!';
    RAISE NOTICE '========================================';
    
END $$;

-- Show the final result
SELECT 
    pm.id,
    pm.user_id,
    pm.email,
    pm.name,
    pm.role as job_title,
    pm.permission_role,
    p.name as practice_name,
    pm.can_manage_team,
    pm.can_invite_members,
    pm.can_edit_assessments,
    pm.can_delete_data
FROM practice_members pm
JOIN practices p ON p.id = pm.practice_id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

