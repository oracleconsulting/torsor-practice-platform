-- ==============================================================
-- SIMPLE RLS CHECK
-- ==============================================================

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'skill_assessments';

-- 2. Show all RLS policies
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'skill_assessments'
ORDER BY policyname;

-- 3. Check current database role
SELECT current_user as current_db_user;

-- 4. TEMPORARILY DISABLE RLS to test if that's the issue
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;

-- 5. Try insert again
DO $$
DECLARE
  luke_id uuid := '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';
BEGIN
  DELETE FROM skill_assessments WHERE team_member_id = luke_id;
  
  INSERT INTO skill_assessments (
    team_member_id,
    skill_id,
    current_level,
    interest_level,
    assessed_at
  ) 
  SELECT 
    luke_id,
    (assessment_data->0->>'skill_id')::uuid,
    (assessment_data->0->>'current_level')::int,
    3,
    NOW()
  FROM invitations
  WHERE email = 'Ltyrrell@rpgcc.co.uk'
    AND practice_id = (SELECT id FROM practices WHERE name = 'RPGCC');
    
END $$;

-- 6. Check if it worked
SELECT COUNT(*) as lukes_count_with_rls_disabled FROM skill_assessments WHERE team_member_id = '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';

-- 7. RE-ENABLE RLS
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

