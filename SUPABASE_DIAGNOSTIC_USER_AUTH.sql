-- Diagnostic: Check what the client-side query sees
-- This simulates what AccountancyContext is trying to do

-- Step 1: Check if RLS policies exist for practice_members
SELECT 
  'RLS POLICIES ON practice_members' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'practice_members';

-- Step 2: Check what data exists (bypassing RLS)
SELECT 
  'DATA IN practice_members (no RLS)' as info,
  pm.id,
  pm.user_id,
  pm.practice_id,
  pm.email,
  pm.name,
  pm.role,
  u.email as auth_email
FROM practice_members pm
LEFT JOIN auth.users u ON u.id = pm.user_id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- Step 3: Check if the user can see their own data with RLS
-- This simulates the client-side query
SELECT 
  '🔍 CLIENT-SIDE VIEW (with RLS)' as info,
  pm.practice_id,
  pm.role,
  p.name as practice_name
FROM practice_members pm
LEFT JOIN practices p ON p.id = pm.practice_id
WHERE pm.user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk');

-- If Step 3 returns 0 rows, RLS is blocking the query!

