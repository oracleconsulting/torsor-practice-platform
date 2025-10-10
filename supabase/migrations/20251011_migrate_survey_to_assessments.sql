-- =====================================================
-- Migrate Survey Session Data to Skill Assessments
-- =====================================================
-- This migration moves completed assessment data from 
-- survey_sessions.survey_data to skill_assessments table
-- Date: October 11, 2025
-- =====================================================

DO $$
DECLARE
  session_record RECORD;
  skill_data JSONB;
  skill_item JSONB;
  member_id UUID;
  practice_id_var UUID;
  existing_assessment_id UUID;
BEGIN
  RAISE NOTICE '=== Starting Survey to Assessment Migration ===';
  
  -- Get the RPGCC practice ID
  SELECT id INTO practice_id_var 
  FROM practices 
  WHERE email LIKE '%rpgcc.co.uk%' 
  LIMIT 1;
  
  RAISE NOTICE 'Practice ID: %', practice_id_var;
  
  -- Loop through all survey sessions with data
  FOR session_record IN 
    SELECT 
      id,
      email,
      practice_member_id,
      survey_data,
      status,
      submitted_at
    FROM survey_sessions
    WHERE survey_data IS NOT NULL 
      AND survey_data != '{}'::jsonb
      AND status IN ('submitted', 'in_progress')
  LOOP
    RAISE NOTICE '--- Processing survey for: % ---', session_record.email;
    RAISE NOTICE 'Status: %, Submitted: %', session_record.status, session_record.submitted_at;
    
    -- Get or create practice member
    IF session_record.practice_member_id IS NULL THEN
      -- Try to find existing member by email
      SELECT id INTO member_id
      FROM practice_members
      WHERE email = session_record.email
      LIMIT 1;
      
      IF member_id IS NULL THEN
        -- Create new practice member
        INSERT INTO practice_members (
          practice_id,
          email,
          name,
          role,
          is_active
        ) VALUES (
          practice_id_var,
          session_record.email,
          COALESCE(
            (SELECT name FROM invitations WHERE email = session_record.email LIMIT 1),
            SPLIT_PART(session_record.email, '@', 1)
          ),
          'member',
          true
        )
        RETURNING id INTO member_id;
        
        RAISE NOTICE 'Created new practice member: %', member_id;
        
        -- Update survey session with member_id
        UPDATE survey_sessions
        SET practice_member_id = member_id
        WHERE id = session_record.id;
      ELSE
        RAISE NOTICE 'Found existing practice member: %', member_id;
      END IF;
    ELSE
      member_id := session_record.practice_member_id;
      RAISE NOTICE 'Using session practice_member_id: %', member_id;
    END IF;
    
    -- Extract skills data from survey_data
    -- The structure might be: { "skills": [...] } or { "assessments": [...] } or array directly
    skill_data := CASE
      WHEN jsonb_typeof(session_record.survey_data) = 'array' THEN session_record.survey_data
      WHEN session_record.survey_data ? 'skills' THEN session_record.survey_data->'skills'
      WHEN session_record.survey_data ? 'assessments' THEN session_record.survey_data->'assessments'
      WHEN session_record.survey_data ? 'responses' THEN session_record.survey_data->'responses'
      ELSE '[]'::jsonb
    END;
    
    RAISE NOTICE 'Found % skill entries in survey_data', jsonb_array_length(skill_data);
    
    -- Loop through each skill assessment in the survey data
    FOR skill_item IN SELECT * FROM jsonb_array_elements(skill_data)
    LOOP
      -- Check if we have the required fields
      IF skill_item ? 'skill_id' AND (skill_item ? 'current_level' OR skill_item ? 'currentLevel') THEN
        
        -- Check if assessment already exists
        SELECT id INTO existing_assessment_id
        FROM skill_assessments
        WHERE team_member_id = member_id
          AND skill_id = (skill_item->>'skill_id')::UUID;
        
        IF existing_assessment_id IS NOT NULL THEN
          -- Update existing assessment
          UPDATE skill_assessments
          SET
            current_level = COALESCE(
              (skill_item->>'current_level')::int,
              (skill_item->>'currentLevel')::int,
              current_level
            ),
            interest_level = COALESCE(
              (skill_item->>'interest_level')::int,
              (skill_item->>'interestLevel')::int,
              interest_level
            ),
            years_experience = COALESCE(
              (skill_item->>'years_experience')::decimal,
              (skill_item->>'yearsExperience')::decimal,
              years_experience
            ),
            notes = COALESCE(
              skill_item->>'notes',
              notes
            ),
            assessed_at = COALESCE(
              session_record.submitted_at,
              NOW()
            ),
            assessment_type = 'self'
          WHERE id = existing_assessment_id;
          
        ELSE
          -- Insert new assessment
          BEGIN
            INSERT INTO skill_assessments (
              team_member_id,
              skill_id,
              current_level,
              interest_level,
              years_experience,
              notes,
              assessed_at,
              assessed_by,
              assessment_type
            ) VALUES (
              member_id,
              (skill_item->>'skill_id')::UUID,
              COALESCE(
                (skill_item->>'current_level')::int,
                (skill_item->>'currentLevel')::int,
                0
              ),
              COALESCE(
                (skill_item->>'interest_level')::int,
                (skill_item->>'interestLevel')::int,
                3
              ),
              COALESCE(
                (skill_item->>'years_experience')::decimal,
                (skill_item->>'yearsExperience')::decimal,
                0
              ),
              skill_item->>'notes',
              COALESCE(session_record.submitted_at, NOW()),
              member_id,
              'self'
            );
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to insert assessment for skill %: %', skill_item->>'skill_id', SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed migration for: %', session_record.email;
  END LOOP;
  
  RAISE NOTICE '=== Migration Complete ===';
  
  -- Show final counts
  RAISE NOTICE 'Final counts:';
  RAISE NOTICE '- Practice members: %', (SELECT COUNT(*) FROM practice_members);
  RAISE NOTICE '- Skill assessments: %', (SELECT COUNT(*) FROM skill_assessments);
  RAISE NOTICE '- Unique members with assessments: %', (SELECT COUNT(DISTINCT team_member_id) FROM skill_assessments);
  
END $$;

-- Show results
SELECT 
  pm.name,
  pm.email,
  COUNT(sa.*) as assessment_count,
  ROUND(AVG(sa.current_level), 1) as avg_level
FROM practice_members pm
LEFT JOIN skill_assessments sa ON pm.id = sa.team_member_id
GROUP BY pm.id, pm.name, pm.email
ORDER BY assessment_count DESC;

