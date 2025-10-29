-- Diagnostic query to check Luke Tyrrell's skill assessment data
-- This will help identify why all skills are showing as level 2

DO $$
DECLARE
  v_practice_id uuid;
  v_luke_id uuid;
BEGIN
  -- Get IDs
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  SELECT id INTO v_luke_id FROM practice_members 
  WHERE practice_id = v_practice_id AND email = 'luke@rpgcc.co.uk';
  
  RAISE NOTICE 'Luke Tyrrell ID: %', v_luke_id;
  RAISE NOTICE 'Practice ID: %', v_practice_id;
END $$;

-- Check Luke's skill assessments
SELECT 
  sa.current_level,
  COUNT(*) as count_at_this_level,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM skill_assessments sa
JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  AND pm.email = 'luke@rpgcc.co.uk'
GROUP BY sa.current_level
ORDER BY sa.current_level;

-- Sample 10 skills to see actual values
SELECT 
  s.name as skill_name,
  s.category,
  sa.current_level,
  sa.interest_level,
  sa.assessed_at
FROM skill_assessments sa
JOIN skills s ON sa.skill_id = s.id
JOIN practice_members pm ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  AND pm.email = 'luke@rpgcc.co.uk'
ORDER BY s.name
LIMIT 10;

-- Check if there's invitation data with different values
SELECT 
  i.email,
  jsonb_array_length(i.assessment_data) as skill_count,
  (i.assessment_data->0->>'currentLevel') as first_skill_level,
  (i.assessment_data->1->>'currentLevel') as second_skill_level,
  (i.assessment_data->10->>'currentLevel') as tenth_skill_level
FROM invitations i
WHERE i.email = 'luke@rpgcc.co.uk'
  AND i.assessment_data IS NOT NULL;

