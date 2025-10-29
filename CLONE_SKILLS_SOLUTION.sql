-- ==============================================================
-- SOLUTION: Copy assessment structure from working members
-- Use Laura Pond's skills as template, then we can adjust levels manually
-- ==============================================================

DO $$
DECLARE
  jaanu_id uuid := '621fb1ce-9396-4b38-a249-e9f94840d511';
  james_id uuid := '6800ff5a-6a1b-4e21-a48a-1a2ac032af78';
  luke_id uuid := '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e';
  laura_id uuid := '3f8b57ff-2bc4-4943-a9f9-7ce9970143b6';
  inserted_count int := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Cloning skill structure from Laura Pond';
  RAISE NOTICE 'This gives all 111 skills with default level 2';
  RAISE NOTICE 'Members can update their levels in the portal';
  RAISE NOTICE '========================================';

  -- Clear existing assessments for the 3 members
  DELETE FROM skill_assessments WHERE team_member_id IN (jaanu_id, james_id, luke_id);
  
  -- Clone Laura's skill structure for Jaanu (with level 2)
  INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, assessed_at)
  SELECT 
    jaanu_id,
    skill_id,
    2, -- Default level
    3, -- Default interest
    NOW()
  FROM skill_assessments
  WHERE team_member_id = laura_id;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Jaanu: Created % skill assessments', inserted_count;
  
  -- Clone for James (with level 3 since he's a Director)
  INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, assessed_at)
  SELECT 
    james_id,
    skill_id,
    3, -- Higher default for Director
    3,
    NOW()
  FROM skill_assessments
  WHERE team_member_id = laura_id;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'James: Created % skill assessments', inserted_count;
  
  -- Clone for Luke (with level 2)
  INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, assessed_at)
  SELECT 
    luke_id,
    skill_id,
    2,
    3,
    NOW()
  FROM skill_assessments
  WHERE team_member_id = laura_id;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Luke: Created % skill assessments', inserted_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ All 3 members now have complete skill assessments';
  RAISE NOTICE '📝 They should log into their portal to update levels';
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT 
  pm.name,
  pm.email,
  pm.role,
  COUNT(sa.id) as total_skills,
  ROUND(AVG(sa.current_level), 1) as avg_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.is_active = true
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY pm.name;

