-- Populate reporting lines based on organizational structure
-- Structure:
--   - Luke (Assistant Manager) → Lambros, Jack
--   - Edward (Assistant Manager) → Shari, Rizwan
--   - Azalia (Assistant Manager) → Tanya, Meyanthi
--   - Laura (Manager) → Luke, Edward, Azalia
--   - Wes, Jeremy (Partners) → James, Lynley, Jaanu, Sarah, Laura

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_luke_id UUID;
  v_edward_id UUID;
  v_azalia_id UUID;
  v_laura_id UUID;
  v_wes_id UUID;
  v_jeremy_id UUID;
BEGIN
  RAISE NOTICE 'Setting up reporting lines...';
  
  -- Get manager IDs
  SELECT id INTO v_luke_id FROM practice_members WHERE email ILIKE '%ltyrrell%' AND practice_id = v_practice_id;
  SELECT id INTO v_edward_id FROM practice_members WHERE email ILIKE '%edale%' AND practice_id = v_practice_id;
  SELECT id INTO v_azalia_id FROM practice_members WHERE email ILIKE '%afarman%' AND practice_id = v_practice_id;
  SELECT id INTO v_laura_id FROM practice_members WHERE email ILIKE '%lpond%' AND practice_id = v_practice_id;
  SELECT id INTO v_wes_id FROM practice_members WHERE email ILIKE '%wturner%' AND practice_id = v_practice_id;
  SELECT id INTO v_jeremy_id FROM practice_members WHERE email ILIKE '%jtyrrell%' AND practice_id = v_practice_id;
  
  RAISE NOTICE 'Manager IDs found:';
  RAISE NOTICE '  Luke: %', v_luke_id;
  RAISE NOTICE '  Edward: %', v_edward_id;
  RAISE NOTICE '  Azalia: %', v_azalia_id;
  RAISE NOTICE '  Laura: %', v_laura_id;
  RAISE NOTICE '  Wes: %', v_wes_id;
  RAISE NOTICE '  Jeremy: %', v_jeremy_id;
  
  -- Luke's Reports: Lambros, Jack
  UPDATE practice_members
  SET reports_to_id = v_luke_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%lzarros%'  -- Lambros
      OR email ILIKE '%jattersall%'  -- Jack
    );
  RAISE NOTICE 'Set % reports for Luke', FOUND;
  
  -- Edward's Reports: Shari, Rizwan
  UPDATE practice_members
  SET reports_to_id = v_edward_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%sthomas%'  -- Shari
      OR email ILIKE '%rpaderwala%'  -- Rizwan
    );
  RAISE NOTICE 'Set % reports for Edward', FOUND;
  
  -- Azalia's Reports: Tanya, Meyanthi
  UPDATE practice_members
  SET reports_to_id = v_azalia_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%tokorji%'  -- Tanya
      OR email ILIKE '%msipalan%'  -- Meyanthi
    );
  RAISE NOTICE 'Set % reports for Azalia', FOUND;
  
  -- Laura's Reports: Luke, Edward, Azalia
  UPDATE practice_members
  SET reports_to_id = v_laura_id
  WHERE practice_id = v_practice_id
    AND id IN (v_luke_id, v_edward_id, v_azalia_id);
  RAISE NOTICE 'Set % reports for Laura', FOUND;
  
  -- Wes's Reports: James, Lynley, Jaanu, Sarah, Laura
  UPDATE practice_members
  SET reports_to_id = v_wes_id
  WHERE practice_id = v_practice_id
    AND (
      email ILIKE '%jhoward%'  -- James
      OR email ILIKE '%lallagapen%'  -- Lynley
      OR email ILIKE '%janandeswaran%'  -- Jaanu
      OR email ILIKE '%schauhan%'  -- Sarah
      OR id = v_laura_id  -- Laura
    );
  RAISE NOTICE 'Set % reports for Wes', FOUND;
  
  -- Jeremy's Reports: Same as Wes (shared oversight)
  UPDATE practice_members
  SET reports_to_id = v_jeremy_id
  WHERE practice_id = v_practice_id
    AND reports_to_id = v_wes_id;
  RAISE NOTICE 'Set % reports for Jeremy (mirrored Wes)', FOUND;
  
  RAISE NOTICE 'Reporting lines configured!';
END $$;

-- Verify the setup
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

-- Show hierarchy summary
SELECT 
  manager.name as manager,
  manager.role as manager_role,
  COUNT(pm.id) as direct_reports,
  STRING_AGG(pm.name, ', ' ORDER BY pm.name) as reports
FROM practice_members manager
INNER JOIN practice_members pm ON pm.reports_to_id = manager.id
WHERE manager.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY manager.id, manager.name, manager.role
ORDER BY direct_reports DESC, manager.name;

