-- ============================================================================
-- Setup RPGCC Practice and Link All Users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create practices table if it doesn't exist
CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  domain text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(auth_user_id, practice_id)
);

-- Step 3: Insert RPGCC practice (upsert)
INSERT INTO practices (id, name, slug, domain)
VALUES (
  '8624cd8c-b4c2-4fc3-85b8-e559d14b0568',
  'RPGCC',
  'rpgcc',
  'rpgcc.co.uk'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain,
  updated_at = now();

-- Step 4: Link all @rpgcc.co.uk users to RPGCC practice as team members
INSERT INTO team_members (practice_id, auth_user_id, name, email, role)
SELECT 
  '8624cd8c-b4c2-4fc3-85b8-e559d14b0568',
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  email,
  'admin'
FROM auth.users
WHERE email LIKE '%@rpgcc.co.uk'
ON CONFLICT (auth_user_id, practice_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = now();

-- Step 5: Ensure practice_members table has the right structure
-- (This table stores both team members and clients)
ALTER TABLE practice_members 
  ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES practices(id);

-- Step 6: Update practice_members to link to RPGCC
-- First, update all team members (those with @rpgcc.co.uk emails)
UPDATE practice_members 
SET practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
WHERE email LIKE '%@rpgcc.co.uk'
  OR practice_id IS NULL;

-- Step 7: Update Tom Clark's record to be linked to RPGCC
UPDATE practice_members
SET 
  practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568',
  member_type = 'client',
  program_status = 'active'
WHERE email = 'tom@rowgear.com';

-- Step 8: Enable RLS on new tables
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Step 9: RLS Policies for practices
DROP POLICY IF EXISTS "Users can view their practices" ON practices;
CREATE POLICY "Users can view their practices" ON practices
  FOR SELECT USING (
    id IN (
      SELECT practice_id FROM team_members WHERE auth_user_id = auth.uid()
    )
    OR
    id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Step 10: RLS Policies for team_members
DROP POLICY IF EXISTS "Team members can view their practice team" ON team_members;
CREATE POLICY "Team members can view their practice team" ON team_members
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can manage their practice team" ON team_members;
CREATE POLICY "Team members can manage their practice team" ON team_members
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM team_members WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 11: Verify the setup
SELECT 'Practices:' as table_name;
SELECT id, name, slug, domain FROM practices;

SELECT 'Team Members:' as table_name;
SELECT tm.id, tm.name, tm.email, tm.role, p.name as practice_name
FROM team_members tm
JOIN practices p ON tm.practice_id = p.id;

SELECT 'Practice Members (Clients):' as table_name;
SELECT pm.id, pm.name, pm.email, pm.member_type, pm.program_status, p.name as practice_name
FROM practice_members pm
LEFT JOIN practices p ON pm.practice_id = p.id
WHERE pm.member_type = 'client';

-- ============================================================================
-- Summary: After running this script:
-- 1. RPGCC practice exists with ID: 8624cd8c-b4c2-4fc3-85b8-e559d14b0568
-- 2. All @rpgcc.co.uk users are linked as team admins
-- 3. Tom Clark is linked as a client
-- 4. RLS policies allow proper access
-- ============================================================================

