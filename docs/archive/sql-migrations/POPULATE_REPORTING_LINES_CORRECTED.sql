-- CORRECTED: Populate reporting lines to match BSG Organizational Chart
-- Structure (reading from chart):
--   Partners:
--     - Jeremy Tyrrell → Jaanu, Sarah, Laura
--     - Wes Mason → James, Lynley, Laura (shared oversight)
--   Manager:
--     - Laura Pond → Luke, Edward, Azalia
--   Assistant Managers:
--     - Luke Tyrrell → Lambros, Jack
--     - Edward Gale → Shari, Rizwan
--     - Azalia Farman → Tanya, Meyanthi

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_jeremy_id UUID;
  v_wes_id UUID;
  v_laura_id UUID;
  v_luke_id UUID;
  v_edward_id UUID;
  v_azalia_id UUID;
BEGIN
  RAISE NOTICE 'Setting up reporting lines to match BSG Org Chart...';
  
  -- Get manager IDs
  SELECT id INTO v_jeremy_id FROM practice_members WHERE email ILIKE '%jtyrrell%' AND practice_id = v_practice_id;
  SELECT id INTO v_wes_id FROM practice_members WHERE email ILIKE '%wturner%' AND practice_id = v_practice_id;
  SELECT id INTO v_laura_id FROM practice_members WHERE email ILIKE '%lpond%' AND practice_id = v_practice_id;
  SELECT id INTO v_luke_id FROM practice_members WHERE email ILIKE '%ltyrrell%' AND practice_id = v_practice_id;
  SELECT id INTO v_edward_id FROM practice_members WHERE email ILIKE '%edale%' OR email ILIKE '%egale%' AND practice_id = v_practice_id;
  SELECT id INTO v_azalia_id FROM practice_members WHERE email ILIKE '%afarman%' AND practice_id = v_practice_id;
  
  RAISE NOTICE 'Manager IDs found:';
  RAISE NOTICE '  Jeremy: %', v_jeremy_id;
  RAISE NOTICE '  Wes: %', v_wes_id;
  RAISE NOTICE '  Laura: %', v_laura_id;
  RAISE NOTICE '  Luke: %', v_luke_id;
  RAISE NOTICE '  Edward: %', v_edward_id;
  RAISE NOTICE '  Azalia: %', v_azalia_id;
  
  -- Clear all existing reporting lines first
  UPDATE practice_members
  SET reports_to_id = NULL
  WHERE practice_id = v_practice_id;
  RAISE NOTICE 'Cleared existing reporting lines';
  
  -- Jeremy's Reports: Jaanu, Sarah, Laura
  UPDATE practice_members
  SET reports_to_id = v_jeremy_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%janandeswaran%'  -- Jaanu
      OR email ILIKE '%schauhan%' OR email ILIKE '%soreilly%'  -- Sarah
      OR id = v_laura_id  -- Laura
    );
  RAISE NOTICE 'Set % reports for Jeremy', FOUND;
  
  -- Wes's Reports: James, Lynley (Laura is shared with Jeremy, so we'll keep Jeremy as primary)
  UPDATE practice_members
  SET reports_to_id = v_wes_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%jhoward%'  -- James
      OR email ILIKE '%lallagapen%'  -- Lynley
    );
  RAISE NOTICE 'Set % reports for Wes', FOUND;
  
  -- Laura's Reports: Luke, Edward, Azalia
  UPDATE practice_members
  SET reports_to_id = v_laura_id
  WHERE practice_id = v_practice_id
    AND id IN (v_luke_id, v_edward_id, v_azalia_id);
  RAISE NOTICE 'Set % reports for Laura', FOUND;
  
  -- Luke's Reports: Lambros, Jack
  UPDATE practice_members
  SET reports_to_id = v_luke_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%lzarros%' OR email ILIKE '%lzavros%'  -- Lambros
      OR email ILIKE '%jattersall%'  -- Jack
    );
  RAISE NOTICE 'Set % reports for Luke', FOUND;
  
  -- Edward's Reports: Shari, Rizwan
  UPDATE practice_members
  SET reports_to_id = v_edward_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%sthomas%' OR email ILIKE '%sbaird%'  -- Shari
      OR email ILIKE '%rpaderwala%'  -- Rizwan
    );
  RAISE NOTICE 'Set % reports for Edward', FOUND;
  
  -- Azalia's Reports: Tanya, Meyanthi
  UPDATE practice_members
  SET reports_to_id = v_azalia_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%tokorji%'  -- Tanya
      OR email ILIKE '%msipalan%' OR email ILIKE '%medirisinghe%'  -- Meyanthi
    );
  RAISE NOTICE 'Set % reports for Azalia', FOUND;
  
  RAISE NOTICE 'Reporting lines configured to match BSG Org Chart!';
END $$;

-- Verify the setup matches the chart
SELECT 
  pm.name as team_member,
  pm.role,
  manager.name as reports_to,
  manager.role as manager_role
FROM practice_members pm
LEFT JOIN practice_members manager ON pm.reports_to_id = manager.id
WHERE pm.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
ORDER BY 
  CASE 
    WHEN manager.name IS NULL THEN 0 
    ELSE 1 
  END,
  manager.name,
  pm.name;

-- Show hierarchy summary (should match org chart)
SELECT 
  manager.name as manager,
  manager.role as manager_role,
  COUNT(pm.id) as direct_reports,
  STRING_AGG(pm.name, ', ' ORDER BY pm.name) as reports
FROM practice_members manager
INNER JOIN practice_members pm ON pm.reports_to_id = manager.id
WHERE manager.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY manager.id, manager.name, manager.role
ORDER BY 
  CASE manager.role
    WHEN 'Partner' THEN 1
    WHEN 'Manager' THEN 2
    WHEN 'Assistant Manager' THEN 3
    ELSE 4
  END,
  manager.name;

