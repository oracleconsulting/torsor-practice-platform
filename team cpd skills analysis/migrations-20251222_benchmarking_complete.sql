-- ============================================================================
-- BENCHMARKING SERVICE LINE - COMPLETE SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: industries
-- Reference table for industry taxonomy
-- ============================================================================

CREATE TABLE IF NOT EXISTS industries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sic_codes TEXT[],
  keywords TEXT[],
  benchmark_profile JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: industry_categories
-- Reference table for industry categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_categories (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: benchmark_metrics
-- Reference table for all possible benchmark metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_metrics (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('percent', 'currency', 'days', 'ratio', 'number')),
  calculation_method TEXT,
  higher_is_better BOOLEAN DEFAULT true,
  typical_range_min DECIMAL,
  typical_range_max DECIMAL,
  display_format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: benchmark_data
-- The actual benchmark numbers (percentiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_code TEXT REFERENCES industries(code),
  metric_code TEXT REFERENCES benchmark_metrics(code),
  
  -- Size segmentation
  revenue_band TEXT CHECK (revenue_band IN ('under_250k', '250k_500k', '500k_1m', '1m_2m', '2m_5m', '5m_10m', '10m_plus', 'all')),
  employee_band TEXT CHECK (employee_band IN ('1_5', '6_10', '11_25', '26_50', '51_100', '100_plus', 'all')),
  
  -- Percentile values
  p10 DECIMAL,
  p25 DECIMAL,
  p50 DECIMAL,
  p75 DECIMAL,
  p90 DECIMAL,
  mean DECIMAL,
  
  -- Metadata
  sample_size INTEGER,
  data_year INTEGER,
  data_source TEXT,
  source_url TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  
  -- Versioning
  version INTEGER DEFAULT 1,
  valid_from DATE,
  valid_to DATE,
  is_current BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(industry_code, metric_code, revenue_band, employee_band, version)
);

-- ============================================================================
-- TABLE: benchmark_sources
-- Data sources for benchmarks (ONS, trade associations, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ons', 'trade_association', 'companies_house', 'internal', 'research')),
  url TEXT,
  api_endpoint TEXT,
  api_key_env_var TEXT,
  refresh_frequency TEXT CHECK (refresh_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  last_refresh TIMESTAMPTZ,
  next_refresh TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  industries_covered TEXT[],
  metrics_provided TEXT[],
  data_lag_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: benchmark_refresh_log
-- Log of benchmark data refresh runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_refresh_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES benchmark_sources(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'partial', 'failed')),
  records_processed INTEGER,
  records_updated INTEGER,
  records_created INTEGER,
  errors JSONB,
  notes TEXT
);

-- ============================================================================
-- TABLE: industry_requests
-- Requests for new industries (from AI classification or users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggested_by TEXT CHECK (suggested_by IN ('ai', 'user', 'admin')),
  client_id UUID REFERENCES practice_members(id),
  
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[],
  reasoning TEXT,
  similar_to TEXT[],
  
  -- AI classification context
  business_description TEXT,
  original_classification_result JSONB,
  
  -- Review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewed_by UUID REFERENCES practice_members(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  merged_into TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: bm_engagements
-- Core engagement record for benchmarking
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'assessment_complete', 'pass1_complete', 'generated', 'approved', 'published', 'delivered')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assessment_completed_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES practice_members(id),
  delivered_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: bm_assessment_responses
-- Assessment responses from the client
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_assessment_responses (
  engagement_id UUID PRIMARY KEY REFERENCES bm_engagements(id) ON DELETE CASCADE,
  
  -- Section 1: Classification
  business_description TEXT,
  industry_code TEXT REFERENCES industries(code),
  industry_confidence INTEGER,
  industry_override TEXT,
  sub_sector TEXT,
  sic_code TEXT,
  
  -- Section 2: Size & Context
  revenue_band TEXT CHECK (revenue_band IN ('under_250k', '250k_500k', '500k_1m', '1m_2m', '2m_5m', '5m_10m', '10m_plus')),
  employee_count INTEGER,
  business_age TEXT CHECK (business_age IN ('under_2', '2_5', '5_10', '10_plus')),
  location_type TEXT CHECK (location_type IN ('london', 'south_east', 'midlands', 'north', 'scotland', 'wales', 'ni', 'national', 'international')),
  
  -- Section 3: Self-Assessment
  performance_perception TEXT CHECK (performance_perception IN ('top_10', 'top_25', 'middle', 'below_avg', 'dont_know')),
  current_tracking TEXT[],
  comparison_method TEXT,
  
  -- Section 4: Pain & Priority
  suspected_underperformance TEXT,
  leaving_money TEXT,
  top_quartile_ambition TEXT[],
  competitor_envy TEXT,
  
  -- Section 5: Magic & Action
  benchmark_magic_fix TEXT,
  action_readiness TEXT CHECK (action_readiness IN ('immediate', 'planning', 'awareness', 'team')),
  blind_spot_fear TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: bm_reports
-- Generated benchmark reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_reports (
  engagement_id UUID PRIMARY KEY REFERENCES bm_engagements(id) ON DELETE CASCADE,
  
  -- Classification used
  industry_code TEXT REFERENCES industries(code),
  revenue_band TEXT,
  employee_band TEXT,
  
  -- Narratives (from Pass 2)
  headline TEXT,
  executive_summary TEXT,
  position_narrative TEXT,
  strength_narrative TEXT,
  gap_narrative TEXT,
  opportunity_narrative TEXT,
  
  -- Metrics comparison (from Pass 1)
  metrics_comparison JSONB,
  
  -- Summary scores
  overall_percentile INTEGER,
  strength_count INTEGER,
  gap_count INTEGER,
  
  -- Top findings
  top_strengths JSONB,
  top_gaps JSONB,
  
  -- Opportunity sizing
  total_annual_opportunity DECIMAL(12,2),
  opportunity_breakdown JSONB,
  
  -- Admin guidance (from Pass 1)
  admin_talking_points JSONB,
  admin_questions_to_ask JSONB,
  admin_next_steps JSONB,
  admin_tasks JSONB,
  admin_risk_flags JSONB,
  
  -- Recommendations
  recommendations JSONB,
  
  -- Generation metadata
  pass1_data JSONB,
  
  llm_model TEXT,
  llm_tokens_used INTEGER,
  llm_cost DECIMAL(8,4),
  generation_time_ms INTEGER,
  prompt_version TEXT DEFAULT 'v1',
  
  benchmark_data_as_of DATE,
  data_sources TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: bm_metric_comparisons
-- Individual metric comparisons (for detailed view)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bm_metric_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES bm_engagements(id) ON DELETE CASCADE,
  
  metric_code TEXT REFERENCES benchmark_metrics(code),
  metric_name TEXT,
  
  -- Client's value
  client_value DECIMAL,
  client_value_source TEXT CHECK (client_value_source IN ('ma_data', 'assessment', 'calculated', 'missing')),
  
  -- Benchmark values
  p10 DECIMAL,
  p25 DECIMAL,
  p50 DECIMAL,
  p75 DECIMAL,
  p90 DECIMAL,
  
  -- Position
  percentile INTEGER,
  assessment TEXT CHECK (assessment IN ('top_10', 'top_quartile', 'above_median', 'below_median', 'bottom_quartile', 'bottom_10')),
  
  -- Gap analysis
  vs_median DECIMAL,
  vs_top_quartile DECIMAL,
  gap_to_target DECIMAL,
  target_percentile INTEGER,
  
  -- Impact
  annual_impact DECIMAL(12,2),
  impact_calculation TEXT,
  
  -- Display
  display_order INTEGER,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_benchmark_data_lookup ON benchmark_data(industry_code, metric_code, revenue_band, employee_band) WHERE is_current = true;
CREATE INDEX idx_benchmark_data_industry ON benchmark_data(industry_code);
CREATE INDEX idx_benchmark_data_metric ON benchmark_data(metric_code);
CREATE INDEX idx_benchmark_refresh_log_source ON benchmark_refresh_log(source_id);
CREATE INDEX idx_industry_requests_status ON industry_requests(status);
CREATE INDEX idx_industry_requests_client ON industry_requests(client_id);

CREATE INDEX idx_bm_engagements_client ON bm_engagements(client_id);
CREATE INDEX idx_bm_engagements_status ON bm_engagements(status);
CREATE INDEX idx_bm_engagements_practice ON bm_engagements(practice_id);
CREATE INDEX idx_bm_metric_comparisons_engagement ON bm_metric_comparisons(engagement_id);
CREATE INDEX idx_bm_metric_comparisons_metric ON bm_metric_comparisons(metric_code);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_refresh_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bm_metric_comparisons ENABLE ROW LEVEL SECURITY;

-- Reference data is publicly readable
CREATE POLICY "Anyone can read industries" ON industries FOR SELECT USING (true);
CREATE POLICY "Anyone can read industry_categories" ON industry_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read benchmark_metrics" ON benchmark_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can read benchmark_data" ON benchmark_data FOR SELECT USING (true);

-- Benchmark sources and refresh logs are practice-scoped (admin only)
CREATE POLICY "Admins can manage benchmark_sources" ON benchmark_sources 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- Industry requests: clients can read their own, admins can manage all
CREATE POLICY "Clients can view own industry requests" ON industry_requests
  FOR SELECT USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Users can create industry requests" ON industry_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update industry requests" ON industry_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- BM Engagements: Client can read their own, practice can read all for their practice
CREATE POLICY "Clients can view own bm_engagements" ON bm_engagements
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Practice can view bm_engagements" ON bm_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Practice can create bm_engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.practice_id = practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Practice can update bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- BM Assessment Responses: Same pattern as engagements
CREATE POLICY "Clients can view own bm_assessment_responses" ON bm_assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND bme.client_id = auth.uid()
    )
  );

CREATE POLICY "Practice can view bm_assessment_responses" ON bm_assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Clients can update own bm_assessment_responses" ON bm_assessment_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND bme.client_id = auth.uid()
    )
  );

CREATE POLICY "Practice can update bm_assessment_responses" ON bm_assessment_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- BM Reports: Same pattern
CREATE POLICY "Clients can view own bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_reports.engagement_id
      AND bme.client_id = auth.uid()
    )
  );

CREATE POLICY "Practice can view bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

CREATE POLICY "Practice can update bm_reports" ON bm_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- BM Metric Comparisons: Same pattern
CREATE POLICY "Clients can view own bm_metric_comparisons" ON bm_metric_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      WHERE bme.id = bm_metric_comparisons.engagement_id
      AND bme.client_id = auth.uid()
    )
  );

CREATE POLICY "Practice can view bm_metric_comparisons" ON bm_metric_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_metric_comparisons.engagement_id
      AND pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bm_engagements_updated_at
  BEFORE UPDATE ON bm_engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_bm_updated_at();

CREATE TRIGGER update_bm_assessment_responses_updated_at
  BEFORE UPDATE ON bm_assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_bm_updated_at();

CREATE TRIGGER update_bm_reports_updated_at
  BEFORE UPDATE ON bm_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bm_updated_at();

CREATE TRIGGER update_benchmark_data_updated_at
  BEFORE UPDATE ON benchmark_data
  FOR EACH ROW
  EXECUTE FUNCTION update_bm_updated_at();

CREATE TRIGGER update_benchmark_sources_updated_at
  BEFORE UPDATE ON benchmark_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_bm_updated_at();

