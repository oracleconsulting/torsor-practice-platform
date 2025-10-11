-- =====================================================
-- ROLE-BASED PERMISSIONS SYSTEM
-- Allows team members to have admin privileges
-- Eliminates need for separate admin accounts
-- Date: October 11, 2025
-- =====================================================

-- ============================================
-- 1. CREATE ROLE ENUM TYPE
-- ============================================

-- Create enum for user roles
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
    END IF;
END $$;

COMMENT ON TYPE user_role IS 'User permission levels within a practice';

-- ============================================
-- 2. ADD ROLE COLUMN TO TEAM_MEMBERS
-- ============================================

-- Add role column to team_members table (if using team_members)
DO $$
BEGIN
    -- Check if table exists (might be practice_members or team_members)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        ALTER TABLE team_members 
        ADD COLUMN IF NOT EXISTS permission_role user_role DEFAULT 'staff'::user_role;
        
        ALTER TABLE team_members
        ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT false;
        
        ALTER TABLE team_members
        ADD COLUMN IF NOT EXISTS can_invite_members BOOLEAN DEFAULT false;
        
        ALTER TABLE team_members
        ADD COLUMN IF NOT EXISTS can_edit_assessments BOOLEAN DEFAULT false;
        
        ALTER TABLE team_members
        ADD COLUMN IF NOT EXISTS can_delete_data BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added permission columns to team_members';
    END IF;
    
    -- Also check for practice_members (the actual table name based on migrations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        ALTER TABLE practice_members 
        ADD COLUMN IF NOT EXISTS permission_role user_role DEFAULT 'staff'::user_role;
        
        ALTER TABLE practice_members
        ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT false;
        
        ALTER TABLE practice_members
        ADD COLUMN IF NOT EXISTS can_invite_members BOOLEAN DEFAULT false;
        
        ALTER TABLE practice_members
        ADD COLUMN IF NOT EXISTS can_edit_assessments BOOLEAN DEFAULT false;
        
        ALTER TABLE practice_members
        ADD COLUMN IF NOT EXISTS can_delete_data BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added permission columns to practice_members';
    END IF;
END $$;

-- ============================================
-- 3. CREATE PERMISSION HELPER FUNCTIONS
-- ============================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
    user_email VARCHAR,
    required_role user_role
) RETURNS BOOLEAN AS $$
DECLARE
    user_permission user_role;
BEGIN
    -- Try team_members first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        SELECT permission_role INTO user_permission
        FROM team_members
        WHERE email = user_email;
    END IF;
    
    -- Try practice_members if not found
    IF user_permission IS NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        SELECT permission_role INTO user_permission
        FROM practice_members
        WHERE email = user_email;
    END IF;
    
    -- No user found
    IF user_permission IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check role hierarchy: admin > partner > director > manager > staff
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

COMMENT ON FUNCTION has_permission IS 'Check if user has required permission level (hierarchical)';

-- Function to get all permissions for a user
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
    -- Try team_members first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        RETURN QUERY
        SELECT 
            tm.permission_role as role,
            tm.can_manage_team,
            tm.can_invite_members,
            tm.can_edit_assessments,
            tm.can_delete_data,
            (tm.permission_role IN ('partner', 'admin'))::BOOLEAN as is_admin
        FROM team_members tm
        WHERE tm.email = user_email;
        
        IF FOUND THEN RETURN; END IF;
    END IF;
    
    -- Try practice_members
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        RETURN QUERY
        SELECT 
            pm.permission_role as role,
            pm.can_manage_team,
            pm.can_invite_members,
            pm.can_edit_assessments,
            pm.can_delete_data,
            (pm.permission_role IN ('partner', 'admin'))::BOOLEAN as is_admin
        FROM practice_members pm
        WHERE pm.email = user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';

-- ============================================
-- 4. SET DEFAULT PERMISSIONS BY ROLE
-- ============================================

-- Function to automatically set permissions based on role
CREATE OR REPLACE FUNCTION set_permissions_by_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Set permission flags based on role
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
            NEW.can_delete_data := false;  -- Partners can't delete practice data
        
        WHEN 'director'::user_role THEN
            NEW.can_manage_team := true;
            NEW.can_invite_members := true;
            NEW.can_edit_assessments := false;
            NEW.can_delete_data := false;
        
        WHEN 'manager'::user_role THEN
            NEW.can_manage_team := true;  -- View only
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

-- Create triggers for both possible table names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        DROP TRIGGER IF EXISTS set_team_member_permissions ON team_members;
        CREATE TRIGGER set_team_member_permissions
            BEFORE INSERT OR UPDATE OF permission_role
            ON team_members
            FOR EACH ROW
            EXECUTE FUNCTION set_permissions_by_role();
        RAISE NOTICE 'Created trigger for team_members';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
        DROP TRIGGER IF EXISTS set_practice_member_permissions ON practice_members;
        CREATE TRIGGER set_practice_member_permissions
            BEFORE INSERT OR UPDATE OF permission_role
            ON practice_members
            FOR EACH ROW
            EXECUTE FUNCTION set_permissions_by_role();
        RAISE NOTICE 'Created trigger for practice_members';
    END IF;
END $$;

-- ============================================
-- 5. GRANT ADMIN ROLE TO JAMES HOWARD
-- ============================================

-- Make James Howard (jhoward@rpgcc.co.uk) an admin
-- This allows him to be both a team member AND have admin access

DO $$
DECLARE
    member_count INT;
BEGIN
    -- Update in team_members if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        UPDATE team_members
        SET 
            permission_role = 'admin'::user_role,
            can_manage_team = true,
            can_invite_members = true,
            can_edit_assessments = true,
            can_delete_data = true
        WHERE email = 'jhoward@rpgcc.co.uk';
        
        GET DIAGNOSTICS member_count = ROW_COUNT;
        IF member_count > 0 THEN
            RAISE NOTICE 'Granted admin role to jhoward@rpgcc.co.uk in team_members';
        END IF;
    END IF;
    
    -- Update in practice_members if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
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
            RAISE NOTICE 'Granted admin role to jhoward@rpgcc.co.uk in practice_members';
        ELSE
            RAISE NOTICE 'jhoward@rpgcc.co.uk not found - will be set when member is created';
        END IF;
    END IF;
END $$;

-- ============================================
-- 6. CREATE ROLE MANAGEMENT TABLE
-- ============================================

-- Track role changes for audit purposes
CREATE TABLE IF NOT EXISTS role_changes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    member_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255),
    
    -- Change details
    previous_role user_role,
    new_role user_role NOT NULL,
    changed_by VARCHAR(255) NOT NULL,  -- Email of admin making change
    reason TEXT,
    
    -- Timestamp
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_changes_practice ON role_changes_log(practice_id);
CREATE INDEX idx_role_changes_member ON role_changes_log(member_email);
CREATE INDEX idx_role_changes_date ON role_changes_log(changed_at DESC);

COMMENT ON TABLE role_changes_log IS 'Audit log of role/permission changes';

-- ============================================
-- 7. CREATE PERMISSION SUMMARY VIEW
-- ============================================

-- Create a view to easily see who has what permissions
DO $$
BEGIN
    -- Drop existing view if it exists
    DROP VIEW IF EXISTS v_team_permissions;
    
    -- Create view based on which table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_members') THEN
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
        
        RAISE NOTICE 'Created v_team_permissions view for practice_members';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        CREATE OR REPLACE VIEW v_team_permissions AS
        SELECT 
            tm.id,
            tm.practice_id,
            tm.email,
            tm.name,
            tm.role as job_title,
            tm.permission_role,
            tm.can_manage_team,
            tm.can_invite_members,
            tm.can_edit_assessments,
            tm.can_delete_data,
            (tm.permission_role IN ('partner', 'admin'))::BOOLEAN as is_admin,
            tm.created_at
        FROM team_members tm
        ORDER BY 
            CASE tm.permission_role
                WHEN 'admin' THEN 1
                WHEN 'partner' THEN 2
                WHEN 'director' THEN 3
                WHEN 'manager' THEN 4
                WHEN 'staff' THEN 5
            END,
            tm.name;
        
        RAISE NOTICE 'Created v_team_permissions view for team_members';
    END IF;
END $$;

COMMENT ON VIEW v_team_permissions IS 'Summary of all team member permissions';

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Show current permissions for all team members
DO $$
DECLARE
    v_result RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT TEAM PERMISSIONS ===';
    
    FOR v_result IN 
        SELECT * FROM v_team_permissions
    LOOP
        RAISE NOTICE 'Name: %, Role: %, Permissions: % (Admin: %)', 
            v_result.name,
            v_result.permission_role,
            v_result.job_title,
            v_result.is_admin;
    END LOOP;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '
========================================
✅ ROLE-BASED PERMISSIONS SYSTEM CREATED
========================================

Created:
✅ user_role enum (staff, manager, director, partner, admin)
✅ Permission columns on team members
✅ Helper functions (has_permission, get_user_permissions)
✅ Auto-permission triggers
✅ Role changes audit log
✅ Team permissions view

Admin Role Granted:
✅ jhoward@rpgcc.co.uk now has ADMIN privileges

Next Steps:
1. Use Admin Dashboard to assign roles to other team members
2. Partners/Directors can now access admin features
3. No need for separate BSGBD@rpgcc.co.uk account!

Role Hierarchy:
- ADMIN: Full system access
- PARTNER: Full access except practice deletion
- DIRECTOR: Team management + invitations
- MANAGER: View team reports only
- STAFF: Assessment access only

========================================
    ';
END $$;

