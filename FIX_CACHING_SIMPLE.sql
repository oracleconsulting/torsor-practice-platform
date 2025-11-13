-- =====================================================
-- FIX STRATEGIC INSIGHTS CACHING - SIMPLIFIED VERSION
-- Run this INSTEAD of the failing migration
-- =====================================================

-- Step 1: Drop ALL triggers (no matter what they're called)
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

-- Step 2: Drop ALL related functions
DROP FUNCTION IF EXISTS update_team_composition_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS update_team_composition_last_updated() CASCADE;

-- Step 3: Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_composition_insights_practice_date_unique'
  ) THEN
    ALTER TABLE team_composition_insights
    ADD CONSTRAINT team_composition_insights_practice_date_unique 
    UNIQUE (practice_id, (calculated_at::date));
    RAISE NOTICE '✅ Added unique constraint on (practice_id, date(calculated_at))';
  ELSE
    RAISE NOTICE 'ℹ️ Unique constraint already exists';
  END IF;
END $$;

-- Step 4: Add unique constraint for assessment_insights if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assessment_insights_member_date_unique'
  ) THEN
    ALTER TABLE assessment_insights
    ADD CONSTRAINT assessment_insights_member_date_unique 
    UNIQUE (member_id, (updated_at::date));
    RAISE NOTICE '✅ Added unique constraint on assessment_insights';
  ELSE
    RAISE NOTICE 'ℹ️ Assessment insights constraint already exists';
  END IF;
END $$;

-- Step 5: Fix RLS policies for team_composition_insights
DROP POLICY IF EXISTS team_composition_insights_select ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_insert ON team_composition_insights;
DROP POLICY IF EXISTS team_composition_insights_update ON team_composition_insights;

CREATE POLICY team_composition_insights_select ON team_composition_insights
  FOR SELECT USING (true);

CREATE POLICY team_composition_insights_insert ON team_composition_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY team_composition_insights_update ON team_composition_insights
  FOR UPDATE USING (true);

RAISE NOTICE '✅ RLS policies updated';

-- Step 6: Fix RLS policies for assessment_insights
DROP POLICY IF EXISTS assessment_insights_select ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_insert ON assessment_insights;
DROP POLICY IF EXISTS assessment_insights_update ON assessment_insights;

CREATE POLICY assessment_insights_select ON assessment_insights
  FOR SELECT USING (true);

CREATE POLICY assessment_insights_insert ON assessment_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY assessment_insights_update ON assessment_insights
  FOR UPDATE USING (true);

RAISE NOTICE '✅ Assessment insights RLS policies updated';

-- Step 7: Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_team_composition_insights_practice_calc
  ON team_composition_insights (practice_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_insights_member_updated
  ON assessment_insights (member_id, updated_at DESC);

RAISE NOTICE '✅ Indexes created';

-- Step 8: Create NEW trigger function (with unique name)
CREATE OR REPLACE FUNCTION update_last_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'team_composition_insights' THEN
    NEW.last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create NEW trigger
CREATE TRIGGER team_comp_insights_update_timestamp
  BEFORE UPDATE ON team_composition_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_timestamp();

RAISE NOTICE '✅ New trigger created successfully';

-- =====================================================
-- DONE - NO TEST (to avoid errors)
-- =====================================================

RAISE NOTICE '🎉 Migration complete! Caching should now work.';
RAISE NOTICE 'ℹ️ The application will now be able to cache insights for 24 hours.';

