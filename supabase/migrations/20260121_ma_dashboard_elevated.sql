-- ============================================
-- ELEVATED MA DASHBOARD SCHEMA
-- Visual storytelling & team editor support
-- ============================================

-- ============================================
-- MA REPORT CONFIGURATION
-- Stores the customised layout for each period's report
-- ============================================

CREATE TABLE IF NOT EXISTS ma_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Layout configuration
  section_order JSONB DEFAULT '["tuesday_question", "true_cash", "cash_forecast", "insights", "profitability", "kpis"]',
  
  -- Section visibility
  sections_visible JSONB DEFAULT '{
    "tuesday_question": true,
    "true_cash": true,
    "cash_forecast": true,
    "insights": true,
    "profitability": true,
    "kpis": true,
    "revenue_trend": true,
    "documents": true
  }',
  
  -- Theme/style preferences
  theme VARCHAR(20) DEFAULT 'default' CHECK (theme IN ('default', 'minimal', 'detailed')),
  
  -- Custom branding (future)
  custom_logo_path TEXT,
  primary_color VARCHAR(7), -- Hex color
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MA INSIGHTS (Enhanced)
-- Adding visualization and scenario linking
-- ============================================

ALTER TABLE ma_insights ADD COLUMN IF NOT EXISTS 
  visualization_type VARCHAR(50) CHECK (visualization_type IN (
    'none',
    'bar_chart',
    'waterfall',
    'timeline',
    'comparison',
    'progress',
    'mini_table',
    'custom'
  )) DEFAULT 'none';

ALTER TABLE ma_insights ADD COLUMN IF NOT EXISTS 
  visualization_config JSONB;

ALTER TABLE ma_insights ADD COLUMN IF NOT EXISTS 
  linked_scenario_id UUID;

ALTER TABLE ma_insights ADD COLUMN IF NOT EXISTS 
  is_collapsed_default BOOLEAN DEFAULT FALSE;

-- ============================================
-- MA SCENARIOS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS ma_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL,
  period_id UUID,
  
  -- Scenario details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  scenario_type VARCHAR(50) DEFAULT 'custom',
  
  -- Assumptions
  assumptions JSONB DEFAULT '{}',
  
  -- Results
  forecast_data JSONB,
  impact_on_cash DECIMAL(15,2),
  impact_on_runway DECIMAL(10,2),
  
  -- Display
  short_label VARCHAR(50),
  scenario_color VARCHAR(7) DEFAULT '#3b82f6',
  is_featured BOOLEAN DEFAULT FALSE,
  impact_summary TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add columns if table already existed
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS short_label VARCHAR(50);
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS scenario_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS impact_summary TEXT;
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS assumptions JSONB DEFAULT '{}';
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS forecast_data JSONB;
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS impact_on_cash DECIMAL(15,2);
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS impact_on_runway DECIMAL(10,2);
ALTER TABLE ma_scenarios ADD COLUMN IF NOT EXISTS scenario_type VARCHAR(50) DEFAULT 'custom';

-- Add foreign key for linked_scenario_id if table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ma_insights_linked_scenario_id_fkey'
  ) THEN
    ALTER TABLE ma_insights 
    ADD CONSTRAINT ma_insights_linked_scenario_id_fkey 
    FOREIGN KEY (linked_scenario_id) REFERENCES ma_scenarios(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- MA CHART DATA
-- Pre-calculated data for visualizations
-- ============================================

CREATE TABLE IF NOT EXISTS ma_chart_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES ma_periods(id) ON DELETE CASCADE NOT NULL,
  
  chart_type VARCHAR(50) NOT NULL CHECK (chart_type IN (
    'true_cash_trend',
    'true_cash_waterfall',
    'cash_forecast',
    'revenue_trend',
    'client_profitability',
    'margin_trend',
    'kpi_sparklines'
  )),
  
  -- The actual data points
  data_points JSONB NOT NULL,
  
  -- Chart configuration
  config JSONB DEFAULT '{}',
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_id, chart_type)
);

-- ============================================
-- MA PERIODS (Enhanced for Tuesday Question)
-- ============================================

ALTER TABLE ma_periods ADD COLUMN IF NOT EXISTS 
  tuesday_answer_short TEXT;

ALTER TABLE ma_periods ADD COLUMN IF NOT EXISTS 
  tuesday_answer_detail TEXT;

ALTER TABLE ma_periods ADD COLUMN IF NOT EXISTS 
  tuesday_linked_scenario_id UUID;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ma_report_config_period ON ma_report_config(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_insights_display_order ON ma_insights(period_id, display_order);
CREATE INDEX IF NOT EXISTS idx_ma_chart_data_period ON ma_chart_data(period_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenarios_engagement ON ma_scenarios(engagement_id);
CREATE INDEX IF NOT EXISTS idx_ma_scenarios_featured ON ma_scenarios(engagement_id, is_featured);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ma_report_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_chart_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ma_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ma_report_config
CREATE POLICY "Practice members can view report configs" ON ma_report_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ma_periods p
      JOIN ma_engagements e ON p.engagement_id = e.id
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE p.id = ma_report_config.period_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Practice members can manage report configs" ON ma_report_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_periods p
      JOIN ma_engagements e ON p.engagement_id = e.id
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE p.id = ma_report_config.period_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for ma_chart_data
CREATE POLICY "Practice members can view chart data" ON ma_chart_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ma_periods p
      JOIN ma_engagements e ON p.engagement_id = e.id
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE p.id = ma_chart_data.period_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Practice members can manage chart data" ON ma_chart_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_periods p
      JOIN ma_engagements e ON p.engagement_id = e.id
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE p.id = ma_chart_data.period_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for ma_scenarios
CREATE POLICY "Practice members can view scenarios" ON ma_scenarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE e.id = ma_scenarios.engagement_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Practice members can manage scenarios" ON ma_scenarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ma_engagements e
      JOIN practice_members pm ON e.practice_id = pm.practice_id
      WHERE e.id = ma_scenarios.engagement_id
      AND pm.user_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ma_report_config IS 'Stores customised report layout and visibility settings per period';
COMMENT ON TABLE ma_chart_data IS 'Pre-calculated chart data for dashboard visualizations';
COMMENT ON TABLE ma_scenarios IS 'What-if scenarios for cash forecasting';

COMMENT ON COLUMN ma_insights.visualization_type IS 'Type of visualization to show with insight';
COMMENT ON COLUMN ma_insights.visualization_config IS 'JSON config for the visualization (data points, labels, etc)';
COMMENT ON COLUMN ma_insights.linked_scenario_id IS 'Optional link to a scenario for "See scenario" button';

