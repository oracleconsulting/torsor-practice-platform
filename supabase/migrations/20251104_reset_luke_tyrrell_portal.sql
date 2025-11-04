-- =====================================================
-- RESET LUKE TYRRELL'S PORTAL
-- =====================================================
-- Purpose: 
-- 1. Reset password to Torsorteam2025!
-- 2. Clear test CPD activities
-- 3. Keep skills assessment data
-- 4. Clear other assessment completions so he can redo them
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Find Luke's user and member IDs
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_member_name TEXT;
BEGIN
  -- Find Luke's auth user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: ltyrrell@rpgcc.co.uk';
  END IF;
  
  -- Find Luke's practice member record
  SELECT id, name INTO v_member_id, v_member_name
  FROM practice_members
  WHERE user_id = v_user_id;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Practice member not found for user_id: %', v_user_id;
  END IF;
  
  RAISE NOTICE '📋 Found User:';
  RAISE NOTICE '  User ID: %', v_user_id;
  RAISE NOTICE '  Member ID: %', v_member_id;
  RAISE NOTICE '  Name: %', v_member_name;
END $$;

-- =====================================================
-- Step 2: Preview what will be deleted
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_cpd_count INTEGER;
  v_cpd_activities_count INTEGER;
  v_cpd_recommendations_count INTEGER;
  v_tickets_count INTEGER;
  v_skill_assessments_count INTEGER;
BEGIN
  -- Get IDs
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Count what will be affected
  SELECT COUNT(*) INTO v_cpd_activities_count
  FROM cpd_activities
  WHERE practice_member_id = v_member_id;
  
  SELECT COUNT(*) INTO v_cpd_recommendations_count
  FROM cpd_recommendations
  WHERE member_id = v_member_id;
  
  SELECT COUNT(*) INTO v_tickets_count
  FROM tickets
  WHERE raised_by = v_member_id;
  
  SELECT COUNT(*) INTO v_skill_assessments_count
  FROM skill_assessments
  WHERE team_member_id = v_member_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 PREVIEW - What will happen:';
  RAISE NOTICE '  ✅ KEEP: % skill assessments (your 111 skills data)', v_skill_assessments_count;
  RAISE NOTICE '  🗑️  DELETE: % CPD activities (test data)', v_cpd_activities_count;
  RAISE NOTICE '  🗑️  DELETE: % CPD recommendations', v_cpd_recommendations_count;
  RAISE NOTICE '  🗑️  DELETE: % tickets (if any)', v_tickets_count;
  RAISE NOTICE '  🔑 UPDATE: Password to Torsorteam2025!';
  RAISE NOTICE '  🔄 RESET: All other assessments (VARK, OCEAN, etc.) for redo';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Step 3: Delete test CPD data
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_deleted_activities INTEGER;
  v_deleted_recommendations INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Delete CPD activities
  DELETE FROM cpd_activities
  WHERE practice_member_id = v_member_id;
  
  GET DIAGNOSTICS v_deleted_activities = ROW_COUNT;
  
  -- Delete CPD recommendations
  DELETE FROM cpd_recommendations
  WHERE member_id = v_member_id;
  
  GET DIAGNOSTICS v_deleted_recommendations = ROW_COUNT;
  
  RAISE NOTICE '✅ Deleted % CPD activities', v_deleted_activities;
  RAISE NOTICE '✅ Deleted % CPD recommendations', v_deleted_recommendations;
END $$;

-- =====================================================
-- Step 4: Delete tickets (if any)
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_deleted_tickets INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Delete tickets raised by Luke
  DELETE FROM tickets
  WHERE raised_by = v_member_id;
  
  GET DIAGNOSTICS v_deleted_tickets = ROW_COUNT;
  
  RAISE NOTICE '✅ Deleted % tickets', v_deleted_tickets;
END $$;

-- =====================================================
-- Step 5: Reset other assessments (keep skills only)
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Clear invitations assessment data (VARK, OCEAN, etc.) but keep skills
  UPDATE invitations
  SET 
    vark_results = NULL,
    ocean_results = NULL,
    strengths_data = NULL,
    motivations_data = NULL,
    service_line_preferences = NULL,
    assessment_complete = false,
    completed_at = NULL
  WHERE practice_member_id = v_member_id;
  
  RAISE NOTICE '✅ Reset assessments (VARK, OCEAN, etc.) - ready to redo';
  RAISE NOTICE '✅ Skills assessment data preserved';
END $$;

-- =====================================================
-- Step 6: Reset password
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  -- Update password in auth.users
  -- Note: Password will be hashed by Supabase
  UPDATE auth.users
  SET 
    encrypted_password = crypt('Torsorteam2025!', gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Password reset to: Torsorteam2025!';
END $$;

-- =====================================================
-- Step 7: Reset CPD hours counter
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Reset CPD hour counters to 0
  UPDATE practice_members
  SET 
    cpd_completed_hours = 0,
    cpd_determined_completed = 0,
    cpd_self_allocated_completed = 0
  WHERE id = v_member_id;
  
  RAISE NOTICE '✅ Reset CPD hours to 0';
END $$;

-- =====================================================
-- Step 8: Summary
-- =====================================================

DO $$ 
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_skill_count INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ltyrrell@rpgcc.co.uk';
  SELECT id INTO v_member_id FROM practice_members WHERE user_id = v_user_id;
  
  -- Count remaining skills
  SELECT COUNT(*) INTO v_skill_count
  FROM skill_assessments
  WHERE team_member_id = v_member_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 RESET COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Luke Tyrrell Portal Status:';
  RAISE NOTICE '  Email: ltyrrell@rpgcc.co.uk';
  RAISE NOTICE '  Password: Torsorteam2025!';
  RAISE NOTICE '  ✅ Skills Assessment: % assessments preserved', v_skill_count;
  RAISE NOTICE '  ✅ CPD Activities: Cleared (0)';
  RAISE NOTICE '  ✅ Other Assessments: Ready to complete (0/7)';
  RAISE NOTICE '  ✅ CPD Hours: Reset to 0';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Luke can now log in and complete:';
  RAISE NOTICE '   1. VARK Assessment';
  RAISE NOTICE '   2. OCEAN Assessment';
  RAISE NOTICE '   3. Strengths Assessment';
  RAISE NOTICE '   4. Motivations Assessment';
  RAISE NOTICE '   5. Service Line Preferences';
  RAISE NOTICE '   6. AI Profile Generation';
  RAISE NOTICE '   7. CPD Planning';
  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run separately after migration)
-- =====================================================

-- Check Luke's current state
-- SELECT 
--   pm.name,
--   pm.email,
--   pm.cpd_completed_hours,
--   pm.cpd_determined_completed,
--   pm.cpd_self_allocated_completed,
--   (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = pm.id) as skill_assessments,
--   (SELECT COUNT(*) FROM cpd_activities WHERE practice_member_id = pm.id) as cpd_activities,
--   i.vark_results IS NOT NULL as has_vark,
--   i.ocean_results IS NOT NULL as has_ocean,
--   i.assessment_complete
-- FROM practice_members pm
-- LEFT JOIN invitations i ON i.practice_member_id = pm.id
-- WHERE pm.email = 'ltyrrell@rpgcc.co.uk';

