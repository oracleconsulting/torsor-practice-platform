-- ============================================================================
-- Client Scenarios Storage
-- Created: 2026-02-01
-- Purpose: Enable clients to save and compare "what-if" scenarios
-- ============================================================================

-- =============================================================================
-- CLIENT SCENARIOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS bm_client_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES bm_engagements(id) ON DELETE CASCADE,
  client_id UUID,
  practice_id UUID,
  
  -- Scenario identification
  scenario_type TEXT NOT NULL, -- 'margin', 'cash', 'diversification', 'pricing', 'efficiency', 'exit'
  scenario_name TEXT,
  
  -- Input parameters
  inputs JSONB NOT NULL,
  -- Example: { "targetGrossMargin": 25.5 } or { "rateIncrease": 5, "volumeRetention": 95 }
  
  -- Calculated outputs (denormalized for fast display)
  outputs JSONB NOT NULL,
  -- Example: { "primaryImpact": 150000, "businessValueImpact": 750000, "summary": "..." }
  
  -- Metadata
  is_default BOOLEAN DEFAULT false, -- Practitioner-created default scenario
  is_starred BOOLEAN DEFAULT false, -- Client starred this scenario
  notes TEXT, -- Client/practitioner notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_scenario_type CHECK (
    scenario_type IN ('margin', 'pricing', 'cash', 'efficiency', 'diversification', 'exit')
  )
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_scenarios_engagement ON bm_client_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_client ON bm_client_scenarios(client_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON bm_client_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_starred ON bm_client_scenarios(is_starred) WHERE is_starred = true;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE bm_client_scenarios ENABLE ROW LEVEL SECURITY;

-- Clients can view scenarios for their engagements
CREATE POLICY "Clients view own scenarios" ON bm_client_scenarios
  FOR SELECT USING (
    client_id = auth.uid() OR 
    engagement_id IN (
      SELECT id FROM bm_engagements WHERE client_id = auth.uid()
    )
  );

-- Clients can create scenarios for their engagements
CREATE POLICY "Clients create own scenarios" ON bm_client_scenarios
  FOR INSERT WITH CHECK (
    engagement_id IN (
      SELECT id FROM bm_engagements WHERE client_id = auth.uid()
    )
  );

-- Clients can update their own scenarios
CREATE POLICY "Clients update own scenarios" ON bm_client_scenarios
  FOR UPDATE USING (
    engagement_id IN (
      SELECT id FROM bm_engagements WHERE client_id = auth.uid()
    )
  );

-- Clients can delete their own scenarios
CREATE POLICY "Clients delete own scenarios" ON bm_client_scenarios
  FOR DELETE USING (
    engagement_id IN (
      SELECT id FROM bm_engagements WHERE client_id = auth.uid()
    )
  );

-- Practice members can view/manage scenarios for their clients
CREATE POLICY "Practice members manage client scenarios" ON bm_client_scenarios
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scenarios_updated_at ON bm_client_scenarios;
CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON bm_client_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_scenarios_updated_at();

-- =============================================================================
-- HELPER FUNCTION: Get scenario summary for engagement
-- =============================================================================
CREATE OR REPLACE FUNCTION get_engagement_scenarios_summary(p_engagement_id UUID)
RETURNS TABLE (
  scenario_type TEXT,
  scenario_count BIGINT,
  max_impact NUMERIC,
  latest_created TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.scenario_type,
    COUNT(*)::BIGINT as scenario_count,
    MAX((s.outputs->>'businessValueImpact')::NUMERIC) as max_impact,
    MAX(s.created_at) as latest_created
  FROM bm_client_scenarios s
  WHERE s.engagement_id = p_engagement_id
  GROUP BY s.scenario_type
  ORDER BY max_impact DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

