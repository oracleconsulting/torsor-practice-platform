-- Remap skill IDs for Luke, Jaanu, James using position-based mapping
-- Uses Laura's skill IDs as the template (she has current IDs)
-- Preserves each member's actual levels, interest, and notes

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_laura_data JSONB;
  v_member RECORD;
  v_new_assessment JSONB;
  v_old_skill JSONB;
  v_laura_skill_id TEXT;
  v_idx INT;
  v_total_remapped INT := 0;
BEGIN
  
  RAISE NOTICE '=== Starting Position-Based Skill ID Remapping ===';
  
  -- Get Laura's assessment_data as the reference (she has valid/current skill IDs)
  SELECT assessment_data INTO v_laura_data
  FROM invitations
  WHERE practice_id = v_practice_id
    AND email ILIKE '%lpond%'
    AND status = 'accepted'
  LIMIT 1;
  
  IF v_laura_data IS NULL THEN
    RAISE EXCEPTION 'Could not find Laura''s data to use as template';
  END IF;
  
  RAISE NOTICE 'Using Laura''s data as template: % skills', jsonb_array_length(v_laura_data);
  
  -- Process each of the 3 members with old skill IDs
  FOR v_member IN 
    SELECT id, email, assessment_data
    FROM invitations 
    WHERE practice_id = v_practice_id 
      AND email ILIKE ANY(ARRAY['%ltyrrell%', '%jaanu%', '%jhoward%'])
      AND status = 'accepted'
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Processing: % ---', v_member.email;
    RAISE NOTICE 'Original skills: %', jsonb_array_length(v_member.assessment_data);
    
    v_new_assessment := '[]'::jsonb;
    v_idx := 0;
    
    -- For each old skill, map to Laura's skill ID at the same position
    WHILE v_idx < jsonb_array_length(v_member.assessment_data) LOOP
      
      -- Get the old skill at this position
      v_old_skill := v_member.assessment_data->v_idx;
      
      -- Get Laura's skill_id at the same position
      v_laura_skill_id := v_laura_data->v_idx->>'skill_id';
      
      IF v_laura_skill_id IS NULL THEN
        RAISE NOTICE 'WARNING: No Laura skill at position %, skipping', v_idx;
        v_idx := v_idx + 1;
        CONTINUE;
      END IF;
      
      -- Create new skill object with Laura's ID but member's levels
      v_new_assessment := v_new_assessment || jsonb_build_array(
        jsonb_build_object(
          'skill_id', v_laura_skill_id,
          'current_level', COALESCE((v_old_skill->>'current_level')::int, 1),
          'interest_level', COALESCE((v_old_skill->>'interest_level')::int, 3),
          'notes', v_old_skill->>'notes'
        ) - CASE WHEN v_old_skill->>'notes' IS NULL THEN 'notes' ELSE '' END
      );
      
      v_idx := v_idx + 1;
    END LOOP;
    
    RAISE NOTICE 'Remapped to % skills', jsonb_array_length(v_new_assessment);
    
    -- Update the invitation with remapped data
    UPDATE invitations
    SET assessment_data = v_new_assessment
    WHERE id = v_member.id;
    
    v_total_remapped := v_total_remapped + 1;
    RAISE NOTICE 'Successfully updated %', v_member.email;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Remapping Complete ===';
  RAISE NOTICE 'Total members remapped: %', v_total_remapped;
  
END $$;

-- Verify the results
SELECT 
  email,
  jsonb_array_length(assessment_data) as skill_count,
  assessment_data->0->>'skill_id' as first_skill_id,
  assessment_data->0->>'current_level' as first_level
FROM invitations
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND email ILIKE ANY(ARRAY['%ltyrrell%', '%jaanu%', '%jhoward%', '%lpond%'])
  AND status = 'accepted'
ORDER BY email;

-- Verify they now match Laura's skill IDs
WITH luke_check AS (
  SELECT jsonb_array_elements(assessment_data)->>'skill_id' as skill_id
  FROM invitations
  WHERE email ILIKE '%ltyrrell%' AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  LIMIT 5
)
SELECT 
  lc.skill_id as luke_skill_id,
  s.id as skills_table_id,
  s.name as skill_name,
  CASE WHEN s.id IS NULL THEN 'MISSING ❌' ELSE 'FOUND ✅' END as status
FROM luke_check lc
LEFT JOIN skills s ON s.id::text = lc.skill_id;

