-- =====================================================
-- ROLE-BASED PERMISSIONS SYSTEM V2 (Fixed)
-- Allows team members to have admin privileges
-- Eliminates need for separate admin accounts
-- Date: October 11, 2025
-- =====================================================

-- ============================================
-- 1. CREATE ROLE ENUM TYPE
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'staff',      -- Standard team member (assessment only)
            'manager',    -- Can view team reports
            'director',   -- Can view and edit team settings
            'partner',    -- Full admin access except practice deletion
            'admin'       -- Full system access
        );
        RAISE NOTICE 'Created user_role enum type';
    ELSE
        RAISE NOTICE 'user_role enum type already exists';
    END IF;
END $$;

-- ============================================
-- 2. ADD ROLE COLUMNS TO PRACTICE_MEMBERS
-- ============================================

DO $$
BEGIN
    -- Add permission_role column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_members' AND column_name = 'permission_role'
    ) THEN
        ALTER TABLE practice_members 
        ADD COLUMN permission_role user_role DEFAULT 'staff'::user_role;
        RAISE NOTICE 'Added permission_role column';
    ELSE
        RAISE NOTICE 'permission_role column already exists';
    END IF;
    
    -- Add permission flags
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_members' AND column_name = 'can_manage_team'
    ) THEN
        ALTER TABLE practice_members
        ADD COLUMN can_manage_team BOOLEAN DEFAULT false,
        ADD COLUMN can_invite_members BOOLEAN DEFAULT false,
        ADD COLUMN can_edit_assessments BOOLEAN DEFAULT false,
        ADD COLUMN can_delete_data BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added permission flag columns';
    ELSE
        RAISE NOTICE 'Permission flag columns already exist';
    END IF;
END $$;

-- ============================================
-- 3. CREATE PERMISSION HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION has_permission(
    user_email VARCHAR,
    required_role user_role
) RETURNS BOOLEAN AS $$
DECLARE
    user_permission user_role;
BEGIN
    SELECT permission_role INTO user_permission
    FROM practice_members
    WHERE email = user_email
    LIMIT 1;
    
    IF user_permission IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check role hierarchy
    RETURN CASE
        WHEN required_role = 'staff'::user_role THEN true
        WHEN required_role = 'manager'::user_role THEN user_permission IN ('manager', 'director', 'partner', 'admin')
        WHEN required_role = 'director'::user_role THEN user_permission IN ('director', 'partner', 'admin')
        WHEN required_role = 'partner'::user_role THEN user_permission IN ('partner', 'admin')
        WHEN required_role = 'admin'::user_role THEN user_permission = 'admin'
        ELSE false
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR)
RETURNS TABLE(
    role user_role,
    can_manage_team BOOLEAN,
    can_invite_members BOOLEAN,
    can_edit_assessments BOOLEAN,
    can_delete_data BOOLEAN,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.permission_role as role,
        pm.can_manage_team,
        pm.can_invite_members,
        pm.can_edit_assessments,
        pm.can_delete_data,
        (pm.permission_role IN ('partner', 'admin'))::BOOLEAN as is_admin
    FROM practice_members pm
    WHERE pm.email = user_email
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. AUTO-SET PERMISSIONS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION set_permissions_by_role()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.permission_role
        WHEN 'admin'::user_role THEN
            NEW.can_manage_team := true;
            NEW.can_invite_members := true;
            NEW.can_edit_assessments := true;
            NEW.can_delete_data := true;
        WHEN 'partner'::user_role THEN
            NEW.can_manage_team := true;
            NEW.can_invite_members := true;
            NEW.can_edit_assessments := true;
            NEW.can_delete_data := false;
        WHEN 'director'::user_role THEN
            NEW.can_manage_team := true;
            NEW.can_invite_members := true;
            NEW.can_edit_assessments := false;
            NEW.can_delete_data := false;
        WHEN 'manager'::user_role THEN
            NEW.can_manage_team := true;
            NEW.can_invite_members := false;
            NEW.can_edit_assessments := false;
            NEW.can_delete_data := false;
        WHEN 'staff'::user_role THEN
            NEW.can_manage_team := false;
            NEW.can_invite_members := false;
            NEW.can_edit_assessments := false;
            NEW.can_delete_data := false;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_practice_member_permissions ON practice_members;
CREATE TRIGGER set_practice_member_permissions
    BEFORE INSERT OR UPDATE OF permission_role
    ON practice_members
    FOR EACH ROW
    EXECUTE FUNCTION set_permissions_by_role();

-- ============================================
-- 5. ROLE CHANGES AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS role_changes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    member_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255),
    previous_role user_role,
    new_role user_role NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_changes_practice ON role_changes_log(practice_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_member ON role_changes_log(member_email);
CREATE INDEX IF NOT EXISTS idx_role_changes_date ON role_changes_log(changed_at DESC);

-- ============================================
-- 6. CREATE PERMISSIONS VIEW
-- ============================================

DROP VIEW IF EXISTS v_team_permissions;
CREATE OR REPLACE VIEW v_team_permissions AS
SELECT 
    pm.id,
    pm.practice_id,
    pm.email,
    pm.name,
    pm.role as job_title,
    pm.permission_role,
    pm.can_manage_team,
    pm.can_invite_members,
    pm.can_edit_assessments,
    pm.can_delete_data,
    (pm.permission_role IN ('partner', 'admin'))::BOOLEAN as is_admin,
    pm.created_at
FROM practice_members pm
ORDER BY 
    CASE pm.permission_role
        WHEN 'admin' THEN 1
        WHEN 'partner' THEN 2
        WHEN 'director' THEN 3
        WHEN 'manager' THEN 4
        WHEN 'staff' THEN 5
    END,
    pm.name;

-- ============================================
-- 7. GRANT ADMIN ROLE TO JAMES HOWARD
-- ============================================

DO $$
DECLARE
    member_count INT;
BEGIN
    UPDATE practice_members
    SET 
        permission_role = 'admin'::user_role,
        can_manage_team = true,
        can_invite_members = true,
        can_edit_assessments = true,
        can_delete_data = true
    WHERE email = 'jhoward@rpgcc.co.uk';
    
    GET DIAGNOSTICS member_count = ROW_COUNT;
    
    IF member_count > 0 THEN
        RAISE NOTICE '✅ Granted admin role to jhoward@rpgcc.co.uk';
    ELSE
        RAISE NOTICE '⚠️  jhoward@rpgcc.co.uk not found - will be set when member is created';
    END IF;
END $$;

-- ============================================
-- 8. VERIFICATION
-- ============================================

DO $$
DECLARE
    v_result RECORD;
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM v_team_permissions;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ROLE-BASED PERMISSIONS SYSTEM READY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Found % team member(s)', v_count;
    RAISE NOTICE '';
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Current Permissions:';
        FOR v_result IN SELECT name, email, permission_role, is_admin FROM v_team_permissions LOOP
            RAISE NOTICE '  - %: % (Admin: %)', v_result.name, v_result.permission_role, v_result.is_admin;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Go to Admin Dashboard > Role Management tab';
    RAISE NOTICE '2. Assign roles to team members as needed';
    RAISE NOTICE '3. Partners/Directors can now access admin features!';
    RAISE NOTICE '========================================';
END $$;

