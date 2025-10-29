-- Update outdated skill IDs in invitations.assessment_data
-- Maps old skill IDs to new ones based on skill NAME

-- Step 1: Create a temporary mapping table with sample skill names from Luke's data
-- (We'll extract these from the first invitation that has assessment_data)

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_invitation RECORD;
  v_skill JSONB;
  v_new_skill_id UUID;
  v_skill_name TEXT;
  v_updated_assessment JSONB;
  v_updated_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting skill ID remapping for practice: %', v_practice_id;
  
  -- Process each invitation
  FOR v_invitation IN 
    SELECT id, email, assessment_data 
    FROM invitations 
    WHERE practice_id = v_practice_id 
      AND status = 'accepted'
      AND assessment_data IS NOT NULL
      AND jsonb_array_length(assessment_data) > 0
  LOOP
    RAISE NOTICE 'Processing invitation for: %', v_invitation.email;
    
    v_updated_assessment := '[]'::jsonb;
    
    -- Process each skill in assessment_data
    FOR v_skill IN SELECT * FROM jsonb_array_elements(v_invitation.assessment_data)
    LOOP
      -- Try to find the current skill ID by matching on skill name
      -- (We'll use a best-effort approach since we don't have the original names)
      
      -- For now, just preserve the skill with its current data
      -- We need to see what skill names exist in the skills table
      v_updated_assessment := v_updated_assessment || jsonb_build_array(v_skill);
    END LOOP;
    
  END LOOP;
  
  RAISE NOTICE 'Remapping complete. Updated % invitations', v_updated_count;
END $$;

-- First, let's see what skills we have available
SELECT id, name, category 
FROM skills 
ORDER BY category, name
LIMIT 20;

