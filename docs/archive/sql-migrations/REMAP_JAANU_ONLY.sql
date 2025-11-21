-- Remap Jaanu's skills specifically (using exact email match)
DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_laura_data JSONB;
  v_jaanu_data JSONB;
  v_new_assessment JSONB;
  v_old_skill JSONB;
  v_laura_skill_id TEXT;
  v_idx INT;
BEGIN
  
  RAISE NOTICE 'Remapping Jaanu specifically...';
  
  -- Get Laura's data
  SELECT assessment_data INTO v_laura_data
  FROM invitations
  WHERE email ILIKE '%lpond%'
    AND practice_id = v_practice_id
    AND status = 'accepted';
  
  -- Get Jaanu's current data
  SELECT assessment_data INTO v_jaanu_data
  FROM invitations
  WHERE email = 'JAnandeswaran@rpgcc.co.uk'
    AND practice_id = v_practice_id
    AND status = 'accepted';
  
  RAISE NOTICE 'Laura has % skills, Jaanu has % skills', 
    jsonb_array_length(v_laura_data), 
    jsonb_array_length(v_jaanu_data);
  
  v_new_assessment := '[]'::jsonb;
  v_idx := 0;
  
  -- Remap position by position
  WHILE v_idx < jsonb_array_length(v_jaanu_data) LOOP
    v_old_skill := v_jaanu_data->v_idx;
    v_laura_skill_id := v_laura_data->v_idx->>'skill_id';
    
    IF v_laura_skill_id IS NULL THEN
      RAISE NOTICE 'No Laura skill at position %, stopping', v_idx;
      EXIT;
    END IF;
    
    -- Build new skill with Laura's ID but Jaanu's levels
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
  
  RAISE NOTICE 'Remapped % skills for Jaanu', jsonb_array_length(v_new_assessment);
  
  -- Update Jaanu's data
  UPDATE invitations
  SET assessment_data = v_new_assessment
  WHERE email = 'JAnandeswaran@rpgcc.co.uk'
    AND practice_id = v_practice_id;
  
  RAISE NOTICE 'Successfully updated Jaanu!';
  
END $$;

-- Verify it worked
SELECT 
  email,
  jsonb_array_length(assessment_data) as skill_count,
  (assessment_data->0)->>'skill_id' as first_skill_id,
  (assessment_data->0)->>'current_level' as first_level
FROM invitations
WHERE email = 'JAnandeswaran@rpgcc.co.uk'
  AND practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';

