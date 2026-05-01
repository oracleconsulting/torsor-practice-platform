-- ============================================================================
-- MANAGEMENT ACCOUNTS - ASSESSMENT REPORTS
-- Two-pass architecture for assessment analysis and report generation
-- ============================================================================

-- Main report table
CREATE TABLE IF NOT EXISTS ma_assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  
  -- Generation status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pass1_running',
    'pass1_complete', 
    'pass2_running',
    'generated',
    'error'
  )),
  
  -- Pass 1: Extraction & Analysis (Claude Sonnet)
  pass1_data JSONB,
  pass1_completed_at TIMESTAMPTZ,
  pass1_model TEXT,
  pass1_cost NUMERIC(10,6),
  
  -- Pass 2: Narrative (Claude Sonnet)
  pass2_data JSONB,
  pass2_completed_at TIMESTAMPTZ,
  pass2_model TEXT,
  pass2_cost NUMERIC(10,6),
  
  -- Combined output views
  admin_view JSONB,
  client_view JSONB,
  
  -- Client access control
  shared_with_client BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  shared_by UUID REFERENCES practice_members(id),
  
  -- Discovery link (for cross-referencing)
  discovery_engagement_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Error tracking
  error_message TEXT,
  error_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ma_reports_engagement ON ma_assessment_reports(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_reports_status ON ma_assessment_reports(status);
CREATE INDEX IF NOT EXISTS idx_ma_reports_shared ON ma_assessment_reports(shared_with_client) WHERE shared_with_client = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ma_assessment_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ma_assessment_reports_timestamp ON ma_assessment_reports;
CREATE TRIGGER update_ma_assessment_reports_timestamp
  BEFORE UPDATE ON ma_assessment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_ma_assessment_reports_timestamp();

-- RLS
ALTER TABLE ma_assessment_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Practice members can view own MA reports" ON ma_assessment_reports;
DROP POLICY IF EXISTS "Practice members can manage own MA reports" ON ma_assessment_reports;
DROP POLICY IF EXISTS "Clients can view shared MA reports" ON ma_assessment_reports;

-- Practice members can view reports for their practice
CREATE POLICY "Practice members can view own MA reports" ON ma_assessment_reports
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
      )
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
  );

-- Clients can view shared reports
CREATE POLICY "Clients can view shared MA reports" ON ma_assessment_reports
  FOR SELECT USING (
    shared_with_client = true
    AND engagement_id IN (
      SELECT id FROM ma_engagements
      WHERE client_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid() AND member_type = 'client'
      )
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'MA Assessment Reports table created successfully';
  RAISE NOTICE 'Columns: id, engagement_id, status, pass1_data, pass2_data, admin_view, client_view, shared_with_client';
END $$;

