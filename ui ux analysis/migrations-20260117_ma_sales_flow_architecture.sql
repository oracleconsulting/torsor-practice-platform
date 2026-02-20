-- ============================================================================
-- Management Accounts Sales Flow Architecture
-- ============================================================================
-- This migration adds the complete MA sales flow following the Systems Audit pattern:
-- 1. Pre-call preparation (admin view)
-- 2. Client presentation (selling the destination)
-- 3. Tier selection and proposal
-- ============================================================================

-- ============================================================================
-- PART 1: Extend ma_engagements with sales flow fields
-- ============================================================================

-- Add pre-call preparation fields
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  discovery_engagement_id UUID REFERENCES discovery_engagements(id);

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  pre_call_completed_at TIMESTAMPTZ;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  pre_call_completed_by UUID REFERENCES practice_members(id);

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  recommended_tier TEXT CHECK (recommended_tier IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  tier_rationale TEXT;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  gaps_remaining JSONB DEFAULT '[]'::jsonb;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  admin_notes TEXT;

-- Add presentation fields  
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  presentation_generated_at TIMESTAMPTZ;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  presentation_shared_at TIMESTAMPTZ;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  presentation_viewed_at TIMESTAMPTZ;

-- Add client tier selection
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  selected_tier TEXT CHECK (selected_tier IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  tier_selected_at TIMESTAMPTZ;

-- Add proposal tracking
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  proposal_sent_at TIMESTAMPTZ;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  proposal_accepted_at TIMESTAMPTZ;

-- Add AI analysis cache
ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  ai_analysis JSONB;

ALTER TABLE ma_engagements ADD COLUMN IF NOT EXISTS
  ai_analysis_generated_at TIMESTAMPTZ;

-- ============================================================================
-- PART 2: Pre-populated client data (from practice knowledge)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_client_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Company details (auto-populated from Companies House / Xero)
  company_number TEXT,
  accounting_software TEXT,
  year_end_month INTEGER CHECK (year_end_month BETWEEN 1 AND 12),
  vat_registered BOOLEAN,
  vat_quarter TEXT, -- e.g., 'Mar/Jun/Sep/Dec'
  vat_scheme TEXT, -- 'standard', 'flat_rate', 'cash_accounting'
  
  -- Financial context
  annual_revenue_estimate DECIMAL(15,2),
  annual_revenue_source TEXT, -- 'accounts_2024', 'estimate', 'xero_ytd'
  headcount_estimate INTEGER,
  
  -- Current accountant relationship
  current_accountant TEXT,
  bookkeeper TEXT,
  bookkeeping_frequency TEXT, -- 'weekly', 'monthly', 'quarterly'
  
  -- Verification status for each field
  verified_fields JSONB DEFAULT '{}'::jsonb, -- { "company_number": true, "vat_registered": false }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engagement_id)
);

-- ============================================================================
-- PART 3: Gaps to fill on call
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_precall_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  
  gap_category TEXT NOT NULL, -- 'known_commitments', 'reporting_audience', 'budget', 'xero_access'
  gap_question TEXT NOT NULL, -- The question to ask
  gap_type TEXT NOT NULL, -- 'checkbox', 'text', 'select', 'multi_select'
  gap_options JSONB, -- For select/multi_select types
  
  -- Response
  is_filled BOOLEAN DEFAULT false,
  response JSONB,
  filled_at TIMESTAMPTZ,
  filled_by UUID REFERENCES practice_members(id),
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate standard gaps for each new engagement
CREATE OR REPLACE FUNCTION create_ma_standard_gaps()
RETURNS TRIGGER AS $$
BEGIN
  -- Known Commitments
  INSERT INTO ma_precall_gaps (engagement_id, gap_category, gap_question, gap_type, gap_options, display_order)
  VALUES
    (NEW.id, 'known_commitments', 'What regular loan/finance payments exist?', 'text', NULL, 1),
    (NEW.id, 'known_commitments', 'Any lease payments?', 'text', NULL, 2),
    (NEW.id, 'known_commitments', 'Key supplier payment terms?', 'text', NULL, 3),
    (NEW.id, 'known_commitments', 'Upcoming large expenses (90 days)?', 'text', NULL, 4),
    (NEW.id, 'known_commitments', 'VAT liability estimate and due date?', 'text', NULL, 5),
    (NEW.id, 'known_commitments', 'Corporation tax provision and due date?', 'text', NULL, 6),
    
    -- Reporting Audience
    (NEW.id, 'reporting_audience', 'Who needs to see these numbers?', 'multi_select', 
     '["Just the director(s)", "Business partner(s)", "Board / advisory board", "Bank (covenant reporting)", "Investors"]'::jsonb, 10),
    
    -- Budget
    (NEW.id, 'budget', 'Do you have a budget to compare against?', 'select',
     '["Yes - detailed monthly", "Yes - annual/high-level", "No - but would like one", "No - not needed"]'::jsonb, 20),
    
    -- Xero Access
    (NEW.id, 'xero_access', 'Can we connect to your Xero for automated data?', 'select',
     '["Yes - will set up advisor access", "Prefer manual upload", "Need to check with bookkeeper"]'::jsonb, 30);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new engagements
DROP TRIGGER IF EXISTS create_ma_gaps_on_engagement ON ma_engagements;
CREATE TRIGGER create_ma_gaps_on_engagement
  AFTER INSERT ON ma_engagements
  FOR EACH ROW
  EXECUTE FUNCTION create_ma_standard_gaps();

-- ============================================================================
-- PART 4: Talking points and objection handling
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_talking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  
  point_category TEXT NOT NULL, -- 'opening', 'pain_reference', 'destination', 'question', 'objection'
  point_title TEXT NOT NULL,
  point_content TEXT NOT NULL,
  
  -- For objections: the response
  objection_response TEXT,
  
  -- Source (which assessment question generated this)
  source_question_id TEXT,
  source_answer TEXT,
  
  -- Usage tracking
  was_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 5: Client presentation interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_presentation_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id),
  
  interaction_type TEXT NOT NULL, -- 'viewed', 'scenario_played', 'tier_clicked', 'cta_clicked', 'time_spent'
  details JSONB,
  
  -- For time tracking
  duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 6: Scenario definitions for interactive dashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_scenario_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES ma_engagements(id) ON DELETE CASCADE,
  
  scenario_type TEXT NOT NULL, -- 'hire', 'price_change', 'client_loss', 'debtor_days', 'overhead_cut', 'revenue_drop', 'project', 'capex'
  scenario_name TEXT NOT NULL,
  
  -- Parameters (depends on scenario type)
  parameters JSONB NOT NULL,
  
  -- Calculated results (cached)
  results JSONB,
  results_calculated_at TIMESTAMPTZ,
  
  -- Client interaction
  is_client_created BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 7: Tier definitions (reference table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ma_tier_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  
  tier_code TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  tier_name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  
  -- Features (what's included)
  features JSONB NOT NULL,
  
  -- Qualifying criteria (when to recommend)
  qualifying_criteria JSONB,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(practice_id, tier_code)
);

-- Insert default tier definitions
INSERT INTO ma_tier_definitions (tier_code, tier_name, monthly_price, features, qualifying_criteria, display_order)
VALUES 
  ('bronze', 'Essentials', 750.00, 
   '{"monthly_pnl": true, "monthly_bs": true, "true_cash": true, "tuesday_answer": true, "key_insights": 3, "watch_list_items": 3}'::jsonb,
   '{"max_revenue": 500000, "decision_confidence_max": 5}'::jsonb,
   1),
  ('silver', 'Full Picture', 1500.00,
   '{"monthly_pnl": true, "monthly_bs": true, "true_cash": true, "tuesday_answer": true, "key_insights": 5, "watch_list_items": 5, "six_month_trends": true, "optimisations": true, "decisions_enabled": true}'::jsonb,
   '{"min_revenue": 500000, "max_revenue": 1500000}'::jsonb,
   2),
  ('gold', 'Decision-Ready', 3000.00,
   '{"monthly_pnl": true, "monthly_bs": true, "true_cash": true, "tuesday_answer": true, "key_insights": "unlimited", "watch_list_items": "unlimited", "six_month_trends": true, "optimisations": true, "decisions_enabled": true, "thirteen_week_forecast": true, "scenario_dashboard": true, "monthly_call": true, "pre_built_scenarios": 3}'::jsonb,
   '{"min_revenue": 1000000, "has_upcoming_decisions": true, "decision_confidence_max": 6}'::jsonb,
   3),
  ('platinum', 'Board-Level', 5000.00,
   '{"monthly_pnl": true, "monthly_bs": true, "true_cash": true, "tuesday_answer": true, "key_insights": "unlimited", "watch_list_items": "unlimited", "six_month_trends": true, "optimisations": true, "decisions_enabled": true, "thirteen_week_forecast": true, "scenario_dashboard": true, "weekly_flash": true, "fortnightly_calls": true, "unlimited_scenarios": true, "custom_kpis": true, "benchmarking": true}'::jsonb,
   '{"min_revenue": 2000000, "has_board": true, "has_investors": true}'::jsonb,
   4)
ON CONFLICT (practice_id, tier_code) WHERE practice_id IS NULL DO NOTHING;

-- ============================================================================
-- PART 8: RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ma_client_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_precall_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_talking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_presentation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_scenario_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_tier_definitions ENABLE ROW LEVEL SECURITY;

-- ma_client_profile: Practice members can manage, clients can view their own
CREATE POLICY "Practice members can manage client profiles" ON ma_client_profile
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_client_profile.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin', 'advisor')
    )
  );

CREATE POLICY "Clients can view their own profile" ON ma_client_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = ma_client_profile.client_id
      AND pm.user_id = auth.uid()
    )
  );

-- ma_precall_gaps: Practice members only
CREATE POLICY "Practice members can manage precall gaps" ON ma_precall_gaps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_precall_gaps.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin', 'advisor')
    )
  );

-- ma_talking_points: Practice members only
CREATE POLICY "Practice members can manage talking points" ON ma_talking_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_talking_points.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin', 'advisor')
    )
  );

-- ma_presentation_interactions: Practice members can view, clients can create
CREATE POLICY "Practice members can view presentation interactions" ON ma_presentation_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_presentation_interactions.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin', 'advisor')
    )
  );

CREATE POLICY "Clients can create their own interactions" ON ma_presentation_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = ma_presentation_interactions.client_id
      AND pm.user_id = auth.uid()
    )
  );

-- ma_scenario_definitions: Practice members full access, clients limited based on tier
CREATE POLICY "Practice members can manage scenarios" ON ma_scenario_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.practice_id = e.practice_id
      WHERE e.id = ma_scenario_definitions.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin', 'advisor')
    )
  );

CREATE POLICY "Clients can view shared scenarios" ON ma_scenario_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.id = e.client_id
      WHERE e.id = ma_scenario_definitions.engagement_id
      AND pm.user_id = auth.uid()
      AND e.selected_tier IN ('gold', 'platinum')
    )
  );

CREATE POLICY "Gold/Platinum clients can create scenarios" ON ma_scenario_definitions
  FOR INSERT WITH CHECK (
    is_client_created = true
    AND EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON pm.id = e.client_id
      WHERE e.id = ma_scenario_definitions.engagement_id
      AND pm.user_id = auth.uid()
      AND e.selected_tier IN ('gold', 'platinum')
    )
  );

-- ma_tier_definitions: Everyone can view, only practice admins can manage
CREATE POLICY "Anyone can view tier definitions" ON ma_tier_definitions
  FOR SELECT USING (true);

CREATE POLICY "Practice admins can manage tier definitions" ON ma_tier_definitions
  FOR ALL USING (
    practice_id IS NULL -- Global defaults
    OR EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.practice_id = ma_tier_definitions.practice_id
      AND pm.user_id = auth.uid()
      AND pm.member_type IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- PART 9: Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ma_client_profile_engagement ON ma_client_profile(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_client_profile_client ON ma_client_profile(client_id);
CREATE INDEX IF NOT EXISTS idx_ma_precall_gaps_engagement ON ma_precall_gaps(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_precall_gaps_filled ON ma_precall_gaps(engagement_id, is_filled);
CREATE INDEX IF NOT EXISTS idx_ma_talking_points_engagement ON ma_talking_points(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_talking_points_category ON ma_talking_points(engagement_id, point_category);
CREATE INDEX IF NOT EXISTS idx_ma_presentation_interactions_engagement ON ma_presentation_interactions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_presentation_interactions_type ON ma_presentation_interactions(engagement_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_ma_scenario_definitions_engagement ON ma_scenario_definitions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenario_definitions_type ON ma_scenario_definitions(engagement_id, scenario_type);
CREATE INDEX IF NOT EXISTS idx_ma_tier_definitions_practice ON ma_tier_definitions(practice_id, tier_code);

-- ============================================================================
-- PART 10: Update timestamp triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ma_client_profile_updated_at ON ma_client_profile;
CREATE TRIGGER update_ma_client_profile_updated_at
  BEFORE UPDATE ON ma_client_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ma_scenario_definitions_updated_at ON ma_scenario_definitions;
CREATE TRIGGER update_ma_scenario_definitions_updated_at
  BEFORE UPDATE ON ma_scenario_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ma_tier_definitions_updated_at ON ma_tier_definitions;
CREATE TRIGGER update_ma_tier_definitions_updated_at
  BEFORE UPDATE ON ma_tier_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Done!
-- ============================================================================
COMMENT ON TABLE ma_client_profile IS 'Pre-populated client data for MA engagement pre-call preparation';
COMMENT ON TABLE ma_precall_gaps IS 'Gaps to fill during follow-up call';
COMMENT ON TABLE ma_talking_points IS 'AI-generated talking points and objection handling';
COMMENT ON TABLE ma_presentation_interactions IS 'Track client interactions with presentation';
COMMENT ON TABLE ma_scenario_definitions IS 'Scenario configurations for interactive dashboard';
COMMENT ON TABLE ma_tier_definitions IS 'MA service tier definitions and pricing';

