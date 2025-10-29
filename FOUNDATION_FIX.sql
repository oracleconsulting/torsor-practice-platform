-- DEFINITIVE DATA FIX - Run this ONCE after reviewing FOUNDATION_AUDIT.sql
-- This establishes a clean, consistent data foundation
-- 
-- RULES:
-- 1. invitations.assessment_data is the SOURCE OF TRUTH
-- 2. skill_assessments table mirrors this data
-- 3. If no invitation data exists, we DON'T create fake data
-- 4. We ONLY work with real assessed skills

-- ============================================================================
-- STEP 1: CLEAN SLATE - Remove corrupted/cloned data
-- ============================================================================

DO $$
DECLARE
  v_practice_id uuid;
  v_deleted_count int;
BEGIN
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  -- Delete ALL skill assessments for members who DON'T have invitation data
  -- (These are fake/cloned assessments)
  DELETE FROM skill_assessments sa
  WHERE sa.team_member_id IN (
    SELECT pm.id 
    FROM practice_members pm
    LEFT JOIN invitations i ON pm.email = i.email 
      AND i.practice_id = pm.practice_id
    WHERE pm.practice_id = v_practice_id
      AND (i.id IS NULL OR i.assessment_data IS NULL)
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % fake/cloned skill assessments', v_deleted_count;
  
  -- Delete ALL existing skill assessments (we'll recreate from invitations)
  DELETE FROM skill_assessments sa
  WHERE sa.team_member_id IN (
    SELECT id FROM practice_members WHERE practice_id = v_practice_id
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % existing skill assessments for clean migration', v_deleted_count;
END $$;

-- ============================================================================
-- STEP 2: REBUILD from invitations (SOURCE OF TRUTH)
-- ============================================================================

DO $$
DECLARE
  v_practice_id uuid;
  invitation_record RECORD;
  skill_record JSONB;
  v_member_id uuid;
  v_skill_id uuid;
  v_inserted_count int := 0;
  v_skipped_count int := 0;
BEGIN
  SELECT id INTO v_practice_id FROM practices WHERE name = 'RPGCC' LIMIT 1;
  
  -- Loop through each invitation with assessment data
  FOR invitation_record IN (
    SELECT 
      i.email,
      i.assessment_data,
      pm.id as member_id,
      pm.name as member_name
    FROM invitations i
    JOIN practice_members pm ON i.email = pm.email AND i.practice_id = pm.practice_id
    WHERE i.practice_id = v_practice_id
      AND i.assessment_data IS NOT NULL
      AND i.status = 'accepted'
  ) LOOP
    
    RAISE NOTICE 'Processing: % (%)', invitation_record.member_name, invitation_record.email;
    
    -- Loop through each skill in their assessment
    FOR skill_record IN (
      SELECT * FROM jsonb_array_elements(invitation_record.assessment_data)
    ) LOOP
      
      -- Find the skill by name (more reliable than ID which may have changed)
      SELECT id INTO v_skill_id 
      FROM skills 
      WHERE name = skill_record->>'skillName'
      LIMIT 1;
      
      IF v_skill_id IS NOT NULL THEN
        -- Insert the assessment
        INSERT INTO skill_assessments (
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          assessed_at,
          created_at,
          updated_at
        ) VALUES (
          invitation_record.member_id,
          v_skill_id,
          COALESCE((skill_record->>'currentLevel')::int, 0),
          COALESCE((skill_record->>'interestLevel')::int, 3),
          COALESCE((skill_record->>'assessedAt')::timestamptz, NOW()),
          NOW(),
          NOW()
        )
        ON CONFLICT (team_member_id, skill_id) DO UPDATE
        SET 
          current_level = EXCLUDED.current_level,
          interest_level = EXCLUDED.interest_level,
          assessed_at = EXCLUDED.assessed_at,
          updated_at = NOW();
        
        v_inserted_count := v_inserted_count + 1;
      ELSE
        v_skipped_count := v_skipped_count + 1;
        RAISE WARNING 'Skill not found: %', skill_record->>'skillName';
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed: % - % skills inserted', invitation_record.member_name, v_inserted_count;
  END LOOP;
  
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Total skills inserted: %', v_inserted_count;
  RAISE NOTICE 'Total skills skipped (not found): %', v_skipped_count;
END $$;

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

-- Verify each member now has correct data
SELECT 
  pm.name,
  pm.email,
  pm.role,
  COUNT(sa.id) as skills_count,
  ROUND(AVG(sa.current_level), 2) as avg_level,
  COUNT(DISTINCT sa.current_level) as unique_levels,
  STRING_AGG(DISTINCT sa.current_level::text, ', ' ORDER BY sa.current_level::text) as level_distribution
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
GROUP BY pm.id, pm.name, pm.email, pm.role
ORDER BY pm.role, pm.name;

-- Check for any remaining issues
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL MEMBERS HAVE VARIED SKILL LEVELS'
    ELSE '⚠️ ' || COUNT(*) || ' MEMBERS STILL HAVE "ALL SAME LEVEL" ISSUE'
  END as status
FROM (
  SELECT pm.id
  FROM practice_members pm
  JOIN skill_assessments sa ON sa.team_member_id = pm.id
  WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC' LIMIT 1)
  GROUP BY pm.id
  HAVING COUNT(DISTINCT sa.current_level) = 1
) subq;

