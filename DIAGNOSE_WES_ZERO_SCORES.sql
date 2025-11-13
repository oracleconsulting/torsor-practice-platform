-- =====================================================
-- DIAGNOSE & FIX WES'S ZERO SCORES
-- Run these queries ONE AT A TIME in Supabase SQL Editor
-- =====================================================

-- STEP 1: Verify Wes's assessment data exists
-- =====================================================

SELECT '=== WES MASON DIAGNOSTIC ===' as step;

-- Find Wes
SELECT 
  'Step 1: Find Wes' as step,
  id, 
  name, 
  email, 
  role 
FROM practice_members 
WHERE name ILIKE '%wes%mason%' 
LIMIT 1;

-- His ID should be: 2b5f8f65-97bb-4c44-9d6b-56788ab593b9

-- STEP 2: Check EQ Assessment (most critical for role suitability)
-- =====================================================

SELECT 
  'Step 2: EQ Assessment' as step,
  practice_member_id,
  self_awareness_score,
  self_management_score,
  social_awareness_score,
  relationship_management_score,
  overall_eq,
  eq_level,
  created_at
FROM eq_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- EXPECTED: Should show scores (e.g., 75, 80, etc.)
-- IF EMPTY: EQ assessment not saved - this is the problem!

-- STEP 3: Check Motivational Drivers
-- =====================================================

SELECT 
  'Step 3: Motivational Drivers' as step,
  practice_member_id,
  achievement_score,
  affiliation_score,
  autonomy_score,
  influence_score,
  dominant_driver
FROM motivational_drivers
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- EXPECTED: Should show scores (e.g., 85, 60, 70, 80)
-- IF EMPTY: Motivational assessment not saved!

-- STEP 4: Check Belbin
-- =====================================================

SELECT 
  'Step 4: Belbin Roles' as step,
  practice_member_id,
  primary_role,
  secondary_role
FROM belbin_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- EXPECTED: Should show primary and secondary roles

-- STEP 5: Check Working Preferences
-- =====================================================

SELECT 
  'Step 5: Working Preferences' as step,
  practice_member_id,
  work_environment,
  communication_preference,
  autonomy_preference
FROM working_preferences
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- STEP 6: Check Conflict Style
-- =====================================================

SELECT 
  'Step 6: Conflict Style' as step,
  practice_member_id,
  primary_style
FROM conflict_style_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- STEP 7: Check Current Profile (likely cached with old data)
-- =====================================================

SELECT 
  'Step 7: Current Profile (CACHED)' as step,
  member_id,
  advisory_suitability,
  technical_suitability,
  leadership_readiness,
  created_at,
  updated_at,
  AGE(NOW(), updated_at) as cache_age
FROM individual_assessment_profiles
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- IF cache_age > 7 days: Profile is stale and needs recalculation
-- IF advisory/technical/leadership all 0: Something is wrong with calculation

-- STEP 8: Check assessment_insights (strategic insights cache)
-- =====================================================

SELECT 
  'Step 8: Assessment Insights (CACHED)' as step,
  member_id,
  current_role_match_percentage,
  advisory_suitability,
  technical_suitability,
  leadership_readiness,
  created_at,
  updated_at
FROM assessment_insights
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- =====================================================
-- STEP 9: FIX - Delete cached profiles to force recalculation
-- =====================================================

-- Run this ONLY if assessment data exists in Steps 2-6 above

BEGIN;

SELECT 'Step 9: Deleting cached profiles for Wes...' as step;

DELETE FROM individual_assessment_profiles 
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

DELETE FROM role_competency_gaps
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

DELETE FROM assessment_insights
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

SELECT 'Profiles deleted. Now go to Individual Profiles page and click "Refresh All"' as next_step;

COMMIT;

-- =====================================================
-- EXPECTED OUTCOME:
-- =====================================================

-- After running Step 9 and clicking "Refresh All":
-- 1. Profile should recalculate using fresh assessment data
-- 2. Advisory/Technical/Leadership scores should be >0
-- 3. If still 0, the problem is in the calculation logic (role-fit-analyzer.ts)

-- =====================================================
-- IF ASSESSMENT DATA IS MISSING (Steps 2-6 show no rows):
-- =====================================================

-- The assessments are showing as "complete" in the UI, but data is not in the database.
-- This suggests:
-- 1. Assessment completion flag is set, but data didn't save
-- 2. Wrong table names or columns
-- 3. RLS policy blocking data save

-- To fix: Have Wes retake the assessments that are missing data

