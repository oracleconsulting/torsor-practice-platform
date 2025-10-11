-- =====================================================
-- Migrate Assessment Data from Invitations to Skill Assessments
-- =====================================================
-- This migration moves completed assessment data from 
-- invitations.assessment_data to skill_assessments table
-- Date: October 11, 2025
-- =====================================================

DO $$
DECLARE
  invitation_record RECORD;
  skill_data JSONB;
  skill_item JSONB;
  member_id UUID;
  existing_assessment_id UUID;
  inserted_count INT := 0;
  updated_count INT := 0;
BEGIN
  RAISE NOTICE '=== Starting Invitation Assessment Data Migration ===';
  
  -- Loop through all invitations with assessment data
  FOR invitation_record IN 
    SELECT 
      id,
      email,
      name,
      role,
      assessment_data,
      accepted_at
    FROM invitations
    WHERE assessment_data IS NOT NULL 
      AND assessment_data != '[]'::jsonb
      AND jsonb_array_length(assessment_data) > 0
  LOOP
    RAISE NOTICE '--- Processing assessments for: % (%) ---', invitation_record.name, invitation_record.email;
    RAISE NOTICE 'Found % skill assessments', jsonb_array_length(invitation_record.assessment_data);
    
    -- Find the practice member by email
    SELECT id INTO member_id
    FROM practice_members
    WHERE email = invitation_record.email
    LIMIT 1;
    
    IF member_id IS NULL THEN
      RAISE NOTICE '❌ No practice member found for email: %', invitation_record.email;
      CONTINUE;
    END IF;
    
    RAISE NOTICE '✅ Found practice member: %', member_id;
    
    -- Loop through each skill assessment in the invitation data
    FOR skill_item IN SELECT * FROM jsonb_array_elements(invitation_record.assessment_data)
    LOOP
      -- Check if we have the required fields
      IF skill_item ? 'skill_id' AND skill_item ? 'current_level' THEN
        
        -- Check if assessment already exists
        SELECT id INTO existing_assessment_id
        FROM skill_assessments
        WHERE team_member_id = member_id
          AND skill_id = (skill_item->>'skill_id')::UUID;
        
        IF existing_assessment_id IS NOT NULL THEN
          -- Update existing assessment
          UPDATE skill_assessments
          SET
            current_level = (skill_item->>'current_level')::int,
            interest_level = COALESCE((skill_item->>'interest_level')::int, 3),
            notes = skill_item->>'notes',
            assessed_at = COALESCE(invitation_record.accepted_at, NOW()),
            assessment_type = 'self',
            updated_at = NOW()
          WHERE id = existing_assessment_id;
          
          updated_count := updated_count + 1;
          
        ELSE
          -- Insert new assessment
          BEGIN
            INSERT INTO skill_assessments (
              team_member_id,
              skill_id,
              current_level,
              interest_level,
              notes,
              assessed_at,
              assessed_by,
              assessment_type,
              created_at,
              updated_at
            ) VALUES (
              member_id,
              (skill_item->>'skill_id')::UUID,
              (skill_item->>'current_level')::int,
              COALESCE((skill_item->>'interest_level')::int, 3),
              skill_item->>'notes',
              COALESCE(invitation_record.accepted_at, NOW()),
              member_id,
              'self',
              NOW(),
              NOW()
            );
            
            inserted_count := inserted_count + 1;
            
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to insert assessment for skill %: %', skill_item->>'skill_id', SQLERRM;
          END;
        END IF;
      ELSE
        RAISE NOTICE 'Skipping skill item - missing required fields: %', skill_item;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed migration for: % (Inserted: %, Updated: %)', invitation_record.name, inserted_count, updated_count;
  END LOOP;
  
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Total - Inserted: %, Updated: %', inserted_count, updated_count;
  
  -- Show final counts
  RAISE NOTICE '';
  RAISE NOTICE 'Final database state:';
  RAISE NOTICE '- Practice members: %', (SELECT COUNT(*) FROM practice_members);
  RAISE NOTICE '- Skill assessments: %', (SELECT COUNT(*) FROM skill_assessments);
  RAISE NOTICE '- Unique members with assessments: %', (SELECT COUNT(DISTINCT team_member_id) FROM skill_assessments);
  
END $$;

-- Show results by member
SELECT 
  pm.name,
  pm.email,
  pm.role,
  COUNT(sa.*) as assessment_count,
  ROUND(AVG(sa.current_level), 1) as avg_current_level,
  ROUND(AVG(sa.interest_level), 1) as avg_interest_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON pm.id = sa.team_member_id
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY assessment_count DESC;

