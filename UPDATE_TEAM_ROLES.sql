-- Update team member roles to correct titles
-- Jack, Meyanthi, Tanya → Junior
-- Lambros → Senior

DO $$ 
DECLARE
  v_practice_id uuid;
BEGIN
  -- Get practice ID for RPGCC
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  -- Update Jack Attersall to Junior
  UPDATE practice_members 
  SET role = 'Junior'
  WHERE practice_id = v_practice_id 
    AND email = 'jack@rpgcc.co.uk';
  
  -- Update Meyanthi Edirisinghe to Junior
  UPDATE practice_members 
  SET role = 'Junior'
  WHERE practice_id = v_practice_id 
    AND email = 'meyanthi@rpgcc.co.uk';
  
  -- Update Tanya Okorji to Junior
  UPDATE practice_members 
  SET role = 'Junior'
  WHERE practice_id = v_practice_id 
    AND email = 'tanya@rpgcc.co.uk';
  
  -- Update Lambros Zavros to Senior
  UPDATE practice_members 
  SET role = 'Senior'
  WHERE practice_id = v_practice_id 
    AND email = 'lambros@rpgcc.co.uk';
  
  RAISE NOTICE 'Team roles updated successfully!';
END $$;

-- Verify the updates
SELECT 
  name,
  role,
  email,
  CASE 
    WHEN reporting_to IS NOT NULL THEN (SELECT name FROM practice_members WHERE id = pm.reporting_to)
    ELSE 'No manager'
  END as reports_to
FROM practice_members pm
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  AND email IN ('jack@rpgcc.co.uk', 'meyanthi@rpgcc.co.uk', 'tanya@rpgcc.co.uk', 'lambros@rpgcc.co.uk')
ORDER BY role, name;

