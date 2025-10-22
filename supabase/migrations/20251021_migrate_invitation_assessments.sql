-- Migrate assessment data from invitations table to skill_assessments table
-- This script copies assessment data for all accepted invitations that haven't been migrated yet

DO $$
DECLARE
  invitation_record RECORD;
  assessment_item JSONB;
  member_id UUID;
BEGIN
  RAISE NOTICE 'Starting assessment data migration...';
  
  -- Loop through all accepted invitations with assessment data
  FOR invitation_record IN 
    SELECT 
      i.id as invitation_id,
      i.email,
      i.name,
      i.practice_id,
      i.assessment_data,
      i.accepted_at
    FROM invitations i
    WHERE i.status = 'accepted'
      AND i.assessment_data IS NOT NULL
      AND jsonb_array_length(i.assessment_data) > 0
  LOOP
    RAISE NOTICE 'Processing invitation for: % (%)', invitation_record.name, invitation_record.email;
    
    -- Find or create practice_member record
    SELECT id INTO member_id
    FROM practice_members
    WHERE email = invitation_record.email
      AND practice_id = invitation_record.practice_id;
    
    IF member_id IS NULL THEN
      RAISE NOTICE '  Creating practice_member record...';
      INSERT INTO practice_members (
        practice_id,
        email,
        name,
        role,
        is_active,
        joined_at
      )
      VALUES (
        invitation_record.practice_id,
        invitation_record.email,
        invitation_record.name,
        'team_member',
        true,
        invitation_record.accepted_at
      )
      RETURNING id INTO member_id;
      RAISE NOTICE '  Created practice_member with ID: %', member_id;
    ELSE
      RAISE NOTICE '  Found existing practice_member with ID: %', member_id;
    END IF;
    
    -- Delete existing assessments for this member (to avoid duplicates)
    DELETE FROM skill_assessments
    WHERE team_member_id = member_id;
    
    RAISE NOTICE '  Inserting % skill assessments...', jsonb_array_length(invitation_record.assessment_data);
    
    -- Insert each skill assessment
    FOR assessment_item IN 
      SELECT * FROM jsonb_array_elements(invitation_record.assessment_data)
    LOOP
      INSERT INTO skill_assessments (
        team_member_id,
        skill_id,
        current_level,
        interest_level,
        assessed_at
      )
      VALUES (
        member_id,
        (assessment_item->>'skill_id')::UUID,
        (assessment_item->>'current_level')::INTEGER,
        (assessment_item->>'interest_level')::INTEGER,
        invitation_record.accepted_at
      )
      ON CONFLICT (team_member_id, skill_id) 
      DO UPDATE SET
        current_level = EXCLUDED.current_level,
        interest_level = EXCLUDED.interest_level,
        assessed_at = EXCLUDED.assessed_at;
    END LOOP;
    
    RAISE NOTICE '  ✅ Completed migration for %', invitation_record.email;
  END LOOP;
  
  RAISE NOTICE 'Migration complete!';
END $$;

-- Verify the migration
SELECT 
  pm.name,
  pm.email,
  COUNT(sa.id) as skill_count,
  ROUND(AVG(sa.current_level), 2) as avg_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc'
GROUP BY pm.id, pm.name, pm.email
ORDER BY pm.name;

