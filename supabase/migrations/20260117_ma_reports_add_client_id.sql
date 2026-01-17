-- ============================================================================
-- MA ASSESSMENT REPORTS - Add client_id for pre-engagement reports
-- The two-pass report system should work BEFORE an engagement is created
-- to help secure the engagement through compelling analysis
-- ============================================================================

-- Add client_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_assessment_reports' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE ma_assessment_reports 
    ADD COLUMN client_id UUID REFERENCES users(id);
  END IF;
END $$;

-- Add practice_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ma_assessment_reports' AND column_name = 'practice_id'
  ) THEN
    ALTER TABLE ma_assessment_reports 
    ADD COLUMN practice_id UUID REFERENCES practices(id);
  END IF;
END $$;

-- Make engagement_id nullable (reports can exist without engagement)
ALTER TABLE ma_assessment_reports 
ALTER COLUMN engagement_id DROP NOT NULL;

-- Add index for client_id lookups
CREATE INDEX IF NOT EXISTS idx_ma_reports_client ON ma_assessment_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_ma_reports_practice ON ma_assessment_reports(practice_id);

-- Add constraint: must have either client_id or engagement_id
-- (Can't have a report without knowing who it's for)
ALTER TABLE ma_assessment_reports 
DROP CONSTRAINT IF EXISTS ma_reports_must_have_client_or_engagement;

ALTER TABLE ma_assessment_reports 
ADD CONSTRAINT ma_reports_must_have_client_or_engagement 
CHECK (client_id IS NOT NULL OR engagement_id IS NOT NULL);

-- Update RLS policies to include client_id based access
DROP POLICY IF EXISTS "Practice members can view own MA reports" ON ma_assessment_reports;
DROP POLICY IF EXISTS "Practice members can manage own MA reports" ON ma_assessment_reports;
DROP POLICY IF EXISTS "Clients can view shared MA reports" ON ma_assessment_reports;

-- Practice members can view reports for their practice (by engagement OR by client)
CREATE POLICY "Practice members can view own MA reports" ON ma_assessment_reports
  FOR SELECT USING (
    -- Via engagement
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
    OR
    -- Via direct practice_id
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
    OR
    -- Via client relationship
    client_id IN (
      SELECT client_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'advisor'
    )
  );

-- Practice members can manage reports for their practice
CREATE POLICY "Practice members can manage own MA reports" ON ma_assessment_reports
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
    )
    OR
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Clients can view shared reports
CREATE POLICY "Clients can view shared MA reports" ON ma_assessment_reports
  FOR SELECT USING (
    shared_with_client = true
    AND (
      client_id = auth.uid()
      OR engagement_id IN (
        SELECT id FROM ma_engagements WHERE client_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'MA Assessment Reports updated to support pre-engagement reports';
  RAISE NOTICE 'Reports can now be created with just client_id (no engagement required)';
END $$;

