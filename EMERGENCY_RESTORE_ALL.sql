-- ==============================================================
-- EMERGENCY: Restore ALL 16 members' skill assessments
-- Clone from a working member (Laura Pond) for those with 0
-- ==============================================================

DO $$
DECLARE
  laura_id uuid := '3f8b57ff-2bc4-4943-a9f9-7ce9970143b6';
  member_record RECORD;
  inserted_count int := 0;
  total_inserted int := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMERGENCY RESTORATION';
  RAISE NOTICE '========================================';

  -- For each member with 0 or < 111 assessments, clone Laura's structure
  FOR member_record IN
    SELECT 
      pm.id,
      pm.name,
      pm.email,
      pm.role,
      COUNT(sa.id) as current_count
    FROM practice_members pm
    LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
    WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
      AND pm.is_active = true
      AND pm.id != laura_id  -- Don't clone Laura to herself
    GROUP BY pm.id, pm.name, pm.email, pm.role
    HAVING COUNT(sa.id) < 111
    ORDER BY pm.name
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Restoring: % (%) ---', member_record.name, member_record.email;
    RAISE NOTICE 'Current assessments: %', member_record.current_count;
    
    -- Delete existing assessments
    DELETE FROM skill_assessments WHERE team_member_id = member_record.id;
    
    -- Clone Laura's structure with appropriate default level
    INSERT INTO skill_assessments (team_member_id, skill_id, current_level, interest_level, assessed_at)
    SELECT 
      member_record.id,
      skill_id,
      CASE 
        WHEN member_record.role LIKE '%Director%' OR member_record.role LIKE '%Partner%' THEN 3
        WHEN member_record.role LIKE '%Manager%' THEN 3
        ELSE 2
      END,
      3,
      NOW()
    FROM skill_assessments
    WHERE team_member_id = laura_id;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    total_inserted := total_inserted + inserted_count;
    RAISE NOTICE '✅ Restored % skills for %', inserted_count, member_record.name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Total skills restored: %', total_inserted;
  RAISE NOTICE '========================================';

END $$;

-- Verification: Show ALL members
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

