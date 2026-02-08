-- ============================================================================
-- SERVICE INTELLIGENCE SYSTEM - PHASE 1
-- Client Opportunities Table
-- ============================================================================
-- Opportunities identified for a specific client engagement
-- Links to services (for existing recommendations) or concepts (for new ideas)

CREATE TABLE IF NOT EXISTS client_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  engagement_id UUID NOT NULL REFERENCES bm_engagements(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  
  -- Opportunity identity
  opportunity_code TEXT NOT NULL,       -- 'concentration_critical', 'margin_gap', etc.
  title TEXT NOT NULL,
  category TEXT NOT NULL,               -- 'risk', 'efficiency', 'growth', 'value', 'governance'
  severity TEXT NOT NULL,               -- 'critical', 'high', 'medium', 'low', 'opportunity'
  
  -- Evidence from data
  data_evidence TEXT NOT NULL,          -- "99% revenue from top 3 clients"
  data_values JSONB DEFAULT '{}',       -- {concentration: 99, revenue: 63000000, ...}
  benchmark_comparison TEXT,            -- "Industry healthy level: <40%"
  
  -- Financial impact
  financial_impact_type TEXT,           -- 'risk', 'upside', 'cost_saving', 'value_creation'
  financial_impact_amount DECIMAL(12,2),
  financial_impact_confidence TEXT,     -- 'high', 'medium', 'low'
  impact_calculation TEXT,              -- How we calculated it
  
  -- Service mapping (one or the other)
  recommended_service_id UUID REFERENCES services(id),
  service_fit_score INTEGER,            -- 1-100
  service_fit_rationale TEXT,
  
  -- OR new concept suggestion
  suggested_concept_id UUID REFERENCES service_concepts(id),
  
  -- Adviser tools - ready to use in conversation
  talking_point TEXT,                   -- Script for the adviser
  question_to_ask TEXT,                 -- Discovery question
  quick_win TEXT,                       -- Something they can do this week
  
  -- Status tracking
  discussed_with_client BOOLEAN DEFAULT false,
  client_interested BOOLEAN,
  converted_to_engagement BOOLEAN DEFAULT false,
  conversion_service_id UUID,
  conversion_value DECIMAL(10,2),
  
  -- Generation metadata
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by TEXT DEFAULT 'llm',      -- 'llm', 'manual', 'rule_based'
  llm_model TEXT,
  
  -- Unique per engagement-opportunity combination
  UNIQUE(engagement_id, opportunity_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_opps_engagement ON client_opportunities(engagement_id);
CREATE INDEX IF NOT EXISTS idx_client_opps_severity ON client_opportunities(severity);
CREATE INDEX IF NOT EXISTS idx_client_opps_service ON client_opportunities(recommended_service_id);
CREATE INDEX IF NOT EXISTS idx_client_opps_concept ON client_opportunities(suggested_concept_id);
CREATE INDEX IF NOT EXISTS idx_client_opps_category ON client_opportunities(category);

-- Enable RLS
ALTER TABLE client_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "client_opps_read" ON client_opportunities FOR SELECT USING (true);
CREATE POLICY "client_opps_insert" ON client_opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "client_opps_update" ON client_opportunities FOR UPDATE USING (true);

-- ============================================================================
-- Add opportunity columns to bm_reports
-- ============================================================================

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS opportunity_assessment JSONB,
ADD COLUMN IF NOT EXISTS scenario_suggestions JSONB,
ADD COLUMN IF NOT EXISTS opportunities_generated_at TIMESTAMPTZ;

-- Comment for clarity
COMMENT ON COLUMN bm_reports.opportunity_assessment IS 'Overall assessment from opportunity analysis: clientHealth, topPriority, quickWins, totalOpportunityValue';
COMMENT ON COLUMN bm_reports.scenario_suggestions IS 'LLM-suggested scenarios for the scenario explorer based on opportunity analysis';
COMMENT ON COLUMN bm_reports.opportunities_generated_at IS 'When the opportunity analysis was last run';

