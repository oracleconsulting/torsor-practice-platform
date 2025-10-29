-- ==============================================================
-- COMPREHENSIVE RE-MIGRATION: ALL 16 TEAM MEMBERS
-- Restore everyone's assessment data from invitations
-- ==============================================================

DO $$
DECLARE
  v_practice_id uuid;
  invitation_record RECORD;
  member_id uuid;
  skill_item jsonb;
  skill_uuid uuid;
  current_lvl int;
  interest_lvl int;
  migrated_count int := 0;
  skipped_count int := 0;
  error_count int := 0;
  member_count int := 0;
BEGIN
  -- Get RPGCC practice ID
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC';
  
  IF v_practice_id IS NULL THEN
    RAISE EXCEPTION 'Practice RPGCC not found';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RE-MIGRATING ALL TEAM MEMBERS';
  RAISE NOTICE '========================================';

  -- Loop through ALL invitations with assessment data
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
      AND assessment_data IS NOT NULL 
      AND jsonb_array_length(assessment_data) > 0
    ORDER BY name
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Processing: % (%) ---', invitation_record.name, invitation_record.email;
    RAISE NOTICE 'Skills in assessment_data: %', jsonb_array_length(invitation_record.assessment_data);
    
    -- Find practice member by email
    SELECT id INTO member_id
    FROM practice_members
    WHERE email = invitation_record.email
      AND practice_id = v_practice_id;
    
    IF member_id IS NULL THEN
      RAISE NOTICE '❌ No practice_member found for email: %', invitation_record.email;
      CONTINUE;
    END IF;
    
    RAISE NOTICE '✅ Found practice_member: %', member_id;
    member_count := member_count + 1;
    
    -- Delete existing assessments for fresh start
    DELETE FROM skill_assessments WHERE team_member_id = member_id;
    
    -- Process each skill assessment
    FOR skill_item IN 
      SELECT * FROM jsonb_array_elements(invitation_record.assessment_data)
    LOOP
      -- Extract skill_id, current_level, interest_level
      BEGIN
        skill_uuid := (skill_item->>'skill_id')::uuid;
        current_lvl := (skill_item->>'current_level')::int;
        interest_lvl := COALESCE((skill_item->>'interest_level')::int, 3);
        
        -- Validate skill exists
        IF NOT EXISTS (SELECT 1 FROM skills WHERE id = skill_uuid) THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;
        
        -- Insert new assessment
        INSERT INTO skill_assessments (
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          assessed_at
        ) VALUES (
          member_id,
          skill_uuid,
          current_lvl,
          interest_lvl,
          COALESCE(invitation_record.accepted_at, NOW())
        );
        
        migrated_count := migrated_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '   ❌ Error processing skill: % - %', skill_uuid, SQLERRM;
        error_count := error_count + 1;
      END;
    END LOOP;
    
    RAISE NOTICE '   ✅ Migrated skills for %', invitation_record.email;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'Team members processed: %', member_count;
  RAISE NOTICE 'Total assessments inserted: %', migrated_count;
  RAISE NOTICE 'Skills skipped (not found): %', skipped_count;
  RAISE NOTICE 'Errors encountered: %', error_count;
  RAISE NOTICE '========================================';

END $$;

-- ==============================================================
-- VERIFICATION: Show ALL 16 members
-- ==============================================================

SELECT 
  pm.name,
  pm.email,
  pm.role,
  COUNT(sa.id) as total_skills_assessed,
  ROUND(AVG(sa.current_level), 1) as avg_skill_level,
  MAX(sa.assessed_at) as last_assessment_date
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.is_active = true
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY pm.name;

