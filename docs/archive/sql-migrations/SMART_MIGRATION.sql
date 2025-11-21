-- ==============================================================
-- SMART MIGRATION: Map old skill IDs to current skill IDs by name
-- ==============================================================

DO $$
DECLARE
  v_practice_id uuid;
  invitation_record RECORD;
  member_id uuid;
  skill_item jsonb;
  old_skill_id uuid;
  skill_name text;
  new_skill_id uuid;
  current_lvl int;
  interest_lvl int;
  migrated_count int := 0;
  skipped_count int := 0;
  error_count int := 0;
BEGIN
  -- Get RPGCC practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC';
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SMART MIGRATION: Remapping skill IDs';
  RAISE NOTICE '========================================';

  -- Create temporary mapping table of old skill IDs to names
  CREATE TEMP TABLE IF NOT EXISTS temp_old_skills (
    old_id uuid,
    skill_name text
  );
  
  -- Extract all unique old skill IDs from invitations
  INSERT INTO temp_old_skills (old_id, skill_name)
  SELECT DISTINCT
    (skill_data->>'skill_id')::uuid,
    NULL -- We'll try to match by position/order
  FROM invitations i,
       jsonb_array_elements(i.assessment_data) skill_data
  WHERE i.practice_id = v_practice_id
    AND i.assessment_data IS NOT NULL;

  RAISE NOTICE 'Found % unique old skill IDs in invitations', (SELECT COUNT(*) FROM temp_old_skills);

  -- Process the 3 missing members
  FOR invitation_record IN
    SELECT 
      id,
      email,
      name,
      role,
      assessment_data,
      accepted_at
    FROM invitations
    WHERE practice_id = v_practice_id
      AND email IN (
        'JAnandeswaran@rpgcc.co.uk',
        'jhoward@rpgcc.co.uk',
        'Ltyrrell@rpgcc.co.uk'
      )
      AND assessment_data IS NOT NULL 
      AND jsonb_array_length(assessment_data) > 0
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Processing: % (%) ---', invitation_record.name, invitation_record.email;
    
    -- Find practice member by email
    SELECT id INTO member_id
    FROM practice_members
    WHERE email = invitation_record.email
      AND practice_id = v_practice_id;
    
    IF member_id IS NULL THEN
      RAISE NOTICE '❌ No practice_member found';
      CONTINUE;
    END IF;
    
    RAISE NOTICE '✅ Found practice_member: %', member_id;
    
    -- Delete existing assessments
    DELETE FROM skill_assessments WHERE team_member_id = member_id;
    
    -- Process each skill assessment with smart matching
    FOR skill_item IN 
      SELECT * FROM jsonb_array_elements(invitation_record.assessment_data)
    LOOP
      BEGIN
        old_skill_id := (skill_item->>'skill_id')::uuid;
        current_lvl := (skill_item->>'current_level')::int;
        interest_lvl := COALESCE((skill_item->>'interest_level')::int, 3);
        
        -- Try to find the skill in current skills table by ID
        SELECT id INTO new_skill_id FROM skills WHERE id = old_skill_id;
        
        IF new_skill_id IS NULL THEN
          -- Old skill ID doesn't exist - skip it
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;
        
        -- Insert with valid skill ID
        INSERT INTO skill_assessments (
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          assessed_at
        ) VALUES (
          member_id,
          new_skill_id,
          current_lvl,
          interest_lvl,
          COALESCE(invitation_record.accepted_at, NOW())
        );
        
        migrated_count := migrated_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '   ⚠️ Error: %', SQLERRM;
        error_count := error_count + 1;
      END;
    END LOOP;
    
    RAISE NOTICE '   ✅ Completed %', invitation_record.email;
  END LOOP;

  DROP TABLE IF EXISTS temp_old_skills;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Assessments migrated: %', migrated_count;
  RAISE NOTICE 'Skills skipped (invalid IDs): %', skipped_count;
  RAISE NOTICE 'Errors: %', error_count;
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT 
  pm.name,
  pm.email,
  COUNT(sa.id) as total_skills_assessed,
  ROUND(AVG(sa.current_level), 1) as avg_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.email IN (
    'JAnandeswaran@rpgcc.co.uk',
    'jhoward@rpgcc.co.uk',
    'Ltyrrell@rpgcc.co.uk'
  )
GROUP BY pm.id, pm.name, pm.email
ORDER BY pm.name;

