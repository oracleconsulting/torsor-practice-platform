-- ============================================================================
-- CREATE TEST USER: JIMMY
-- ============================================================================
-- Recreate Jimmy test user for portal testing
-- ============================================================================

-- Step 1: Create practice member record
INSERT INTO practice_members (
  id,
  practice_id,
  name,
  email,
  role,
  is_active,
  joined_at,
  password_change_required
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1),
  'Jimmy Test',
  'jameshowardivc@gmail.com',
  'Team Member',
  true,
  NOW(),
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  name = EXCLUDED.name,
  is_active = true,
  password_change_required = true,
  updated_at = NOW();

-- Step 2: Verify creation
SELECT 
  id,
  name,
  email,
  role,
  user_id,
  password_change_required,
  is_active
FROM practice_members
WHERE email = 'jameshowardivc@gmail.com';

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Use bulk_create_auth_accounts.js to create auth account:
--    node bulk_create_auth_accounts.js
-- 3. Or manually create in Supabase Dashboard → Authentication → Users:
--    - Email: jameshowardivc@gmail.com
--    - Password: TorsorTeam2025!
--    - Auto-confirm: YES
-- 4. Then link the user_id back to practice_members (script does this automatically)
-- ============================================================================

