-- ==============================================================
-- MANUAL TEST: Try inserting ONE assessment for Luke
-- ==============================================================

-- First, let's see Luke's invitation data structure
SELECT 
  email,
  name,
  jsonb_array_length(assessment_data) as skill_count,
  assessment_data->0 as first_skill_sample
FROM invitations
WHERE email = 'Ltyrrell@rpgcc.co.uk'
  AND practice_id = (SELECT id FROM practices WHERE name = 'RPGCC');

-- Try manually inserting ONE skill assessment for Luke
DO $$
DECLARE
  luke_id uuid := '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';
  test_skill_id uuid;
  test_level int;
BEGIN
  -- Get the first skill from Luke's invitation data
  SELECT 
    (assessment_data->0->>'skill_id')::uuid,
    (assessment_data->0->>'current_level')::int
  INTO test_skill_id, test_level
  FROM invitations
  WHERE email = 'Ltyrrell@rpgcc.co.uk'
    AND practice_id = (SELECT id FROM practices WHERE name = 'RPGCC');

  RAISE NOTICE 'Attempting to insert skill_id: %, level: %', test_skill_id, test_level;

  -- Try to insert
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

  RAISE NOTICE '✅ SUCCESS! Insert worked.';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERROR: %', SQLERRM;
  RAISE NOTICE 'Error detail: %', SQLSTATE;
END $$;

-- Check if it was inserted
SELECT 
  COUNT(*) as lukes_assessment_count
FROM skill_assessments
WHERE team_member_id = '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';

