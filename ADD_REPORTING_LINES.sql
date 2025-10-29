-- Add reporting_to column to practice_members table
-- This establishes the hierarchical reporting structure

-- First, check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practice_members' AND column_name = 'reporting_to'
  ) THEN
    ALTER TABLE practice_members 
    ADD COLUMN reporting_to uuid REFERENCES practice_members(id);
  END IF;
END $$;

-- Get practice_id for RPGCC
DO $$ 
DECLARE
  v_practice_id uuid;
  v_jeremy_id uuid;
  v_wes_id uuid;
  v_james_id uuid;
  v_lynley_id uuid;
  v_jaanu_id uuid;
  v_sarah_id uuid;
  v_laura_id uuid;
  v_luke_id uuid;
  v_edward_id uuid;
  v_azalia_id uuid;
BEGIN
  -- Get practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  -- Get all team member IDs
  SELECT id INTO v_jeremy_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'jeremy@rpgcc.co.uk';
  SELECT id INTO v_wes_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'wes@rpgcc.co.uk';
  SELECT id INTO v_james_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'jhoward@rpgcc.co.uk';
  SELECT id INTO v_lynley_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'lynley@rpgcc.co.uk';
  SELECT id INTO v_jaanu_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'jaanu@rpgcc.co.uk';
  SELECT id INTO v_sarah_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'sarah@rpgcc.co.uk';
  SELECT id INTO v_laura_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'laura@rpgcc.co.uk';
  SELECT id INTO v_luke_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'luke@rpgcc.co.uk';
  SELECT id INTO v_edward_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'edward@rpgcc.co.uk';
  SELECT id INTO v_azalia_id FROM practice_members WHERE practice_id = v_practice_id AND email = 'azalia@rpgcc.co.uk';
  
  -- Partners (Jeremy, Wes) have no reporting line (NULL)
  -- Already NULL by default
  
  -- Directors and Manager report to Partners (split between Jeremy and Wes)
  -- James, Lynley, Jaanu, Sarah, Laura report to Jeremy/Wes (let's use Wes as primary)
  UPDATE practice_members SET reporting_to = v_wes_id 
  WHERE id IN (v_james_id, v_lynley_id, v_jaanu_id, v_sarah_id, v_laura_id);
  
  -- Assistant Managers report to Laura
  UPDATE practice_members SET reporting_to = v_laura_id 
  WHERE id IN (v_luke_id, v_edward_id, v_azalia_id);
  
  -- Luke's team (Lambros, Jack)
  UPDATE practice_members SET reporting_to = v_luke_id 
  WHERE practice_id = v_practice_id AND email IN ('lambros@rpgcc.co.uk', 'jack@rpgcc.co.uk');
  
  -- Edward's team (Shari, Rizwan)
  UPDATE practice_members SET reporting_to = v_edward_id 
  WHERE practice_id = v_practice_id AND email IN ('shari@rpgcc.co.uk', 'rizwan@rpgcc.co.uk');
  
  -- Azalia's team (Tanya, Meyanthi)
  UPDATE practice_members SET reporting_to = v_azalia_id 
  WHERE practice_id = v_practice_id AND email IN ('tanya@rpgcc.co.uk', 'meyanthi@rpgcc.co.uk');
  
  RAISE NOTICE 'Reporting lines established successfully!';
END $$;

-- Verify the reporting structure
SELECT 
  pm.name AS team_member,
  pm.role,
  pm.email,
  manager.name AS reports_to,
  manager.role AS manager_role
FROM practice_members pm
LEFT JOIN practice_members manager ON pm.reporting_to = manager.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
ORDER BY 
  CASE pm.role
    WHEN 'Partner' THEN 1
    WHEN 'Director' THEN 2
    WHEN 'Associate Director' THEN 3
    WHEN 'Manager' THEN 4
    WHEN 'Assistant Manager' THEN 5
    WHEN 'Senior' THEN 6
    WHEN 'Junior' THEN 7
    ELSE 8
  END,
  pm.name;

