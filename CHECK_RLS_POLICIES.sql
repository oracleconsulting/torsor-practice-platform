-- ==============================================================
-- CHECK RLS POLICIES on skill_assessments table
-- ==============================================================

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'skill_assessments';

-- List all policies on skill_assessments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'skill_assessments'
ORDER BY policyname;

-- Check current user/role
SELECT current_user, current_role;

-- Try disabling RLS temporarily and inserting
-- (This is a diagnostic - we'll re-enable it after)

-- First, let's try with RLS BYPASSED using security definer function
DO $$
DECLARE
  luke_id uuid := '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';
  test_skill_id uuid;
  test_level int;
  v_practice_id uuid;
BEGIN
  -- Get practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC';
  
  -- Get the first skill from Luke's invitation data
  SELECT 
    (assessment_data->0->>'skill_id')::uuid,
    (assessment_data->0->>'current_level')::int
  INTO test_skill_id, test_level
  FROM invitations
  WHERE email = 'Ltyrrell@rpgcc.co.uk'
    AND practice_id = v_practice_id;

  RAISE NOTICE 'Luke ID: %', luke_id;
  RAISE NOTICE 'Skill ID: %', test_skill_id;
  RAISE NOTICE 'Level: %', test_level;
  RAISE NOTICE 'Practice ID: %', v_practice_id;
  
  -- Verify Luke exists in practice_members
  IF NOT EXISTS (
    SELECT 1 FROM practice_members 
    WHERE id = luke_id AND practice_id = v_practice_id
  ) THEN
    RAISE NOTICE '❌ Luke not found in practice_members!';
  ELSE
    RAISE NOTICE '✅ Luke exists in practice_members';
  END IF;
  
  -- Verify skill exists
  IF NOT EXISTS (SELECT 1 FROM skills WHERE id = test_skill_id) THEN
    RAISE NOTICE '❌ Skill not found!';
  ELSE
    RAISE NOTICE '✅ Skill exists';
  END IF;

  -- Try the insert with explicit error handling
  BEGIN
    INSERT INTO skill_assessments (
      team_member_id,
      skill_id,
      current_level,
      interest_level,
      assessed_at
    ) VALUES (
      luke_id,
      test_skill_id,
      test_level,
      3,
      NOW()
    );
    
    RAISE NOTICE '✅ INSERT completed without error';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT ERROR: %', SQLERRM;
    RAISE NOTICE '❌ SQLSTATE: %', SQLSTATE;
    RAISE NOTICE '❌ Error detail: %', SQLERRM;
  END;
  
END $$;

-- Check result
SELECT COUNT(*) as lukes_count FROM skill_assessments WHERE team_member_id = '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';

