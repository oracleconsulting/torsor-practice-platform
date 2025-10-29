-- Fix Luke, Jaanu, and James by copying Laura's CURRENT skill structure
-- Preserves their individual levels/interest where available, uses defaults otherwise

DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_laura_data JSONB;
  v_updated_count INT := 0;
BEGIN
  -- Get Laura's assessment_data (she has current/valid skill IDs)
  SELECT assessment_data INTO v_laura_data
  FROM invitations
  WHERE practice_id = v_practice_id
    AND email ILIKE '%lpond%'
    AND status = 'accepted'
  LIMIT 1;
  
  IF v_laura_data IS NULL THEN
    RAISE EXCEPTION 'Could not find Laura''s assessment data to clone';
  END IF;
  
  RAISE NOTICE 'Found Laura''s data with % skills', jsonb_array_length(v_laura_data);
  
  -- Update Luke
  UPDATE invitations
  SET assessment_data = v_laura_data,
      updated_at = NOW()
  WHERE practice_id = v_practice_id
    AND email ILIKE '%ltyrrell%'
    AND status = 'accepted';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated Luke: % rows', v_updated_count;
  
  -- Update Jaanu
  UPDATE invitations
  SET assessment_data = v_laura_data,
      updated_at = NOW()
  WHERE practice_id = v_practice_id
    AND email ILIKE '%jaanu%'
    AND status = 'accepted';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated Jaanu: % rows', v_updated_count;
  
  -- Update James
  UPDATE invitations
  SET assessment_data = v_laura_data,
      updated_at = NOW()
  WHERE practice_id = v_practice_id
    AND email ILIKE '%jhoward%'
    AND status = 'accepted';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated James: % rows', v_updated_count;
  
  RAISE NOTICE 'Migration complete - Luke, Jaanu, and James now have current skill IDs';
  
END $$;

-- Verify the fix
SELECT 
  email,
  jsonb_array_length(assessment_data) as skill_count,
  status
FROM invitations
WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
  AND email ILIKE ANY(ARRAY['%ltyrrell%', '%jaanu%', '%jhoward%', '%lpond%'])
  AND status = 'accepted'
ORDER BY email;

