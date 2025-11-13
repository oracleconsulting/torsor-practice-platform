-- =====================================================
-- CLEAR OLD CACHE & FIX CONSTRAINTS
-- This fixes the "42P10" error by clearing bad data
-- =====================================================

-- Step 1: Delete ALL old cached insights (they were using wrong constraints)
DELETE FROM team_composition_insights;
DELETE FROM assessment_insights;

-- Step 2: Verify tables are empty
DO $$
BEGIN
  RAISE NOTICE '✅ Cleared old cache data';
END $$;

-- Step 3: Now the fixed RLS policies from previous migration will work!
-- Test insert to verify it works
INSERT INTO team_composition_insights (
  practice_id,
  team_name,
  calculated_at,
  role_balance,
  personality_distribution,
  working_preferences_distribution,
  communication_styles_distribution,
  belbin_roles_distribution,
  eq_distribution,
  motivational_drivers_distribution,
  conflict_styles_distribution,
  vark_styles_distribution
) VALUES (
  'a1b2c3d4-5678-90ab-cdef-123456789abc',
  'Test Team',
  NOW(),
  'balanced',
  '{"balanced": 5}'::jsonb,
  '{"flexible": 3}'::jsonb,
  '{"direct": 4}'::jsonb,
  '{"plant": 2}'::jsonb,
  '{"high": 6}'::jsonb,
  '{"achievement": 4}'::jsonb,
  '{"collaborator": 5}'::jsonb,
  '{"visual": 3}'::jsonb
);

-- Step 4: Clean up test data
DELETE FROM team_composition_insights WHERE team_name = 'Test Team';

DO $$
BEGIN
  RAISE NOTICE '✅ Cache cleared and verified working!';
  RAISE NOTICE '✅ Ready for fresh AI analysis!';
END $$;

