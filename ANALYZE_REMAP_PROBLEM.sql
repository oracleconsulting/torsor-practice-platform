-- Remap old skill IDs to new skill IDs while PRESERVING assessed levels
-- Maps based on skill NAME (which should be stable across reimports)

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_invitation RECORD;
  v_old_skill JSONB;
  v_new_assessment JSONB;
  v_new_skill_id UUID;
  v_remapped_count INT := 0;
  v_total_skills INT := 0;
BEGIN
  
  RAISE NOTICE '=== Starting skill ID remapping for Luke, Jaanu, James ===';
  
  -- Process each of the 3 members
  FOR v_invitation IN 
    SELECT id, email, assessment_data 
    FROM invitations 
    WHERE practice_id = v_practice_id 
      AND email ILIKE ANY(ARRAY['%ltyrrell%', '%jaanu%', '%jhoward%'])
      AND status = 'accepted'
      AND assessment_data IS NOT NULL
  LOOP
    RAISE NOTICE 'Processing: %', v_invitation.email;
    
    v_new_assessment := '[]'::jsonb;
    v_remapped_count := 0;
    v_total_skills := jsonb_array_length(v_invitation.assessment_data);
    
    -- Process each skill in their assessment_data
    FOR v_old_skill IN 
      SELECT * FROM jsonb_array_elements(v_invitation.assessment_data)
    LOOP
      -- We don't have skill names in the JSONB, only IDs
      -- So we need to get them from a working member's data
      -- This is the problem: we need skill_name to do the mapping
      
      -- For now, let's just log what we have
      RAISE NOTICE 'Old skill ID: %, level: %, interest: %', 
        v_old_skill->>'skill_id',
        v_old_skill->>'current_level',
        v_old_skill->>'interest_level';
    END LOOP;
    
    RAISE NOTICE 'Member % has % skills to remap', v_invitation.email, v_total_skills;
    
  END LOOP;
  
  RAISE NOTICE '=== Remapping analysis complete ===';
  RAISE NOTICE 'PROBLEM: assessment_data only has skill_id, not skill_name';
  RAISE NOTICE 'Cannot map old IDs to new IDs without names';
  
END $$;

