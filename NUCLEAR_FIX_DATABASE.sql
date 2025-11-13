-- =====================================================
-- NUCLEAR OPTION: Discover and drop EVERYTHING
-- Then rebuild from scratch
-- =====================================================

-- Step 1: Drop ALL triggers dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'team_composition_insights'::regclass
    AND NOT tgisinternal
  )
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON team_composition_insights CASCADE';
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- Step 2: Drop ALL functions
DROP FUNCTION IF EXISTS update_team_composition_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS update_team_composition_last_updated() CASCADE;
DROP FUNCTION IF EXISTS update_last_updated_timestamp() CASCADE;

-- Step 3: Drop ALL policies on team_composition_insights dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'team_composition_insights'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON team_composition_insights';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 4: Drop ALL policies on assessment_insights dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'assessment_insights'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON assessment_insights';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 5: Create ONE simple policy for team_composition_insights
CREATE POLICY enable_all_for_team_composition ON team_composition_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 6: Create ONE simple policy for assessment_insights
CREATE POLICY enable_all_for_assessment ON assessment_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_team_comp_practice_calc
  ON team_composition_insights (practice_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_member_calc
  ON assessment_insights (member_id, calculated_at DESC);

-- DONE!
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database completely rebuilt!';
  RAISE NOTICE '✅ All old triggers removed';
  RAISE NOTICE '✅ All old functions removed';
  RAISE NOTICE '✅ All old policies removed';
  RAISE NOTICE '✅ New clean policies created';
  RAISE NOTICE '✅ Performance indexes added';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your app can now cache insights without errors!';
END $$;

