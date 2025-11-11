-- =====================================================
-- FORCE RECALCULATE ALL INDIVIDUAL PROFILES
-- =====================================================
-- This script deletes all cached profiles so they will
-- be recalculated with the NEW logic (no default values)
-- =====================================================

BEGIN;

-- Step 1: Delete all existing individual assessment profiles
-- This will force fresh calculation with the fixed code
DELETE FROM individual_assessment_profiles;

-- Step 2: Delete all role competency gaps
-- These will be recalculated along with profiles
DELETE FROM role_competency_gaps;

-- Step 3: Reset suitability scores in role assignments
-- These will be recalculated when profiles are regenerated
UPDATE member_role_assignments
SET suitability_score = NULL,
    last_calculated = NULL;

COMMIT;

SELECT 'All profiles cleared - they will be recalculated when you click Refresh All in Individual Profiles tab' as status;

-- =====================================================
-- AFTER RUNNING THIS:
-- =====================================================
-- 1. Deploy the fixed code to production
-- 2. Go to Team Management → Individual Profiles
-- 3. Click "Refresh All" button
-- 4. Profiles will recalculate with ACTUAL assessment data
-- 5. Your high EQ scores will finally show correctly!
-- =====================================================

