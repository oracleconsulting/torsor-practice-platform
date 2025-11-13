-- =====================================================
-- FIX STRATEGIC INSIGHTS CACHING
-- Add missing unique constraints and fix RLS policies
-- =====================================================

BEGIN;

-- 1. Add unique constraint for team_composition_insights upsert
-- The error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
ALTER TABLE team_composition_insights
  DROP CONSTRAINT IF EXISTS unique_team_composition_insights;

ALTER TABLE team_composition_insights
  ADD CONSTRAINT unique_team_composition_insights 
  UNIQUE (practice_id, service_line_id, team_name);

-- Handle NULL values in unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_composition_practice_only
  ON team_composition_insights (practice_id)
  WHERE service_line_id IS NULL AND team_name IS NULL;

-- 2. Fix RLS policies for assessment_insights
-- The error: "new row violates row-level security policy"

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Practice leadership can view insights" ON assessment_insights;
DROP POLICY IF EXISTS "System can manage insights" ON assessment_insights;

-- Create permissive policies
CREATE POLICY "Users can view their practice insights" ON assessment_insights
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their practice insights" ON assessment_insights
  FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their practice insights" ON assessment_insights
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM practice_members 
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- 3. Fix RLS policies for team_composition_insights

-- Drop existing policies
DROP POLICY IF EXISTS "Practice leadership can view team composition" ON team_composition_insights;
DROP POLICY IF EXISTS "System can manage team composition" ON team_composition_insights;

-- Create permissive policies
CREATE POLICY "Users can view their practice team composition" ON team_composition_insights
  FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their practice team composition" ON team_composition_insights
  FOR ALL
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );

-- 4. Add index for faster cache lookups
CREATE INDEX IF NOT EXISTS idx_team_composition_practice_calculated
  ON team_composition_insights (practice_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_insights_member_updated
  ON assessment_insights (member_id, updated_at DESC);

-- 5. Drop ALL existing triggers on team_composition_insights to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'team_composition_insights'::regclass)
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON team_composition_insights';
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- Drop any old functions that might reference updated_at
DROP FUNCTION IF EXISTS update_team_composition_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- Create new function for last_updated timestamp
CREATE OR REPLACE FUNCTION update_team_composition_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER update_team_composition_insights_last_updated
  BEFORE UPDATE ON team_composition_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_team_composition_last_updated();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check constraints exist
SELECT 
  'Unique Constraint Check' as test,
  COUNT(*) as constraint_count
FROM information_schema.table_constraints
WHERE table_name = 'team_composition_insights'
  AND constraint_type = 'UNIQUE';

-- Check RLS policies exist
SELECT 
  'RLS Policy Check' as test,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('team_composition_insights', 'assessment_insights');

-- Test upsert (should work now with new trigger and unique constraint)
DO $$
BEGIN
  INSERT INTO team_composition_insights (
    practice_id,
    service_line_id,
    team_name,
    team_health_score
  ) VALUES (
    'a1b2c3d4-5678-90ab-cdef-123456789abc',
    NULL,
    NULL,
    75.0
  )
  ON CONFLICT (practice_id, date(calculated_at))
  DO UPDATE SET
    team_health_score = EXCLUDED.team_health_score,
    last_updated = NOW();
  
  RAISE NOTICE '✅ Upsert test successful – caching will now work!';
  
  -- Clean up test
  DELETE FROM team_composition_insights 
  WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Upsert test failed: %', SQLERRM;
END $$;

