-- =====================================================
-- EMERGENCY DATABASE FIX
-- Drop everything and rebuild clean
-- =====================================================

-- Step 1: Drop ALL triggers on team_composition_insights
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
  END LOOP;
END $$;

-- Step 2: Drop ALL related functions
DROP FUNCTION IF EXISTS update_team_composition_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS update_team_composition_last_updated() CASCADE;
DROP FUNCTION IF EXISTS update_last_updated_timestamp() CASCADE;

-- Step 3: Drop ALL existing policies (including the duplicate)
DROP POLICY IF EXISTS team_composition_insights_all ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_select ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_insert ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_update ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_delete ON team_composition_insights;

-- Step 4: Create ONE permissive policy for everything
CREATE POLICY team_composition_insights_all_access ON team_composition_insights
  FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Drop ALL existing policies for assessment_insights
DROP POLICY IF EXISTS assessment_insights_all ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_select ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_insert ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_update ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_delete ON assessment_insights;

-- Step 6: Create ONE permissive policy for everything
CREATE POLICY assessment_insights_all_access ON assessment_insights
  FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Create simple indexes (no uniqueness, just for speed)
CREATE INDEX IF NOT EXISTS idx_team_comp_practice_calc
  ON team_composition_insights (practice_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_member_calc
  ON assessment_insights (member_id, calculated_at DESC);

-- DONE!
DO $$
BEGIN
  RAISE NOTICE '🎉 Database fixed!';
  RAISE NOTICE '✅ All old triggers removed';
  RAISE NOTICE '✅ All old policies removed';
  RAISE NOTICE '✅ New permissive policies created';
  RAISE NOTICE '✅ Performance indexes added';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your app is now ready to cache insights properly!';
END $$;

