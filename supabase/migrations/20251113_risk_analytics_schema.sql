-- =====================================================
-- RISK ANALYTICS & PERFORMANCE TRACKING - DATABASE SCHEMA
-- Enables persistence, trending, and intervention tracking
-- =====================================================

BEGIN;

-- =====================================================
-- RETENTION RISK SCORES (Historical Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS retention_risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Overall risk
  risk_score DECIMAL(5,2) NOT NULL, -- 0-100
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
  confidence DECIMAL(5,2), -- 0-100
  
  -- Individual risk factors (0-100 each)
  role_match_score DECIMAL(5,2),
  motivation_alignment DECIMAL(5,2),
  engagement_indicators DECIMAL(5,2),
  tenure_risk DECIMAL(5,2),
  development_gap_severity DECIMAL(5,2),
  eq_mismatch DECIMAL(5,2),
  
  -- Top risk factors (JSON)
  top_risk_factors JSONB,
  
  -- Recommended actions (JSON)
  recommended_actions JSONB,
  
  -- Metadata
  time_to_action TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For tracking changes over time
  UNIQUE(member_id, DATE(calculated_at))
);

-- =====================================================
-- SINGLE POINTS OF FAILURE (Historical Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS spof_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  
  -- SPOF details
  sole_expert_id UUID REFERENCES practice_members(id) ON DELETE SET NULL,
  sole_expert_level INTEGER, -- 1-5
  criticality_score DECIMAL(5,2), -- 0-100
  risk_level TEXT CHECK (risk_level IN ('Watch', 'Medium', 'High', 'Critical')),
  
  -- Business impact
  estimated_client_impact TEXT CHECK (estimated_client_impact IN ('Low', 'Medium', 'High')),
  would_block_delivery BOOLEAN DEFAULT false,
  
  -- Mitigation status
  mitigation_status TEXT CHECK (mitigation_status IN ('Identified', 'Planning', 'In Progress', 'Resolved')),
  cross_train_candidates JSONB,
  mitigation_plan JSONB,
  
  -- Tracking
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- One detection per skill per day
  UNIQUE(practice_id, skill_id, DATE(detected_at))
);

-- =====================================================
-- ROLE MISALIGNMENT ALERTS (Historical Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS role_misalignment_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Misalignment details
  misalignment_type TEXT CHECK (misalignment_type IN ('role_fit', 'eq_mismatch', 'motivation_mismatch', 'skill_gap', 'multiple')),
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  
  -- Scores
  current_role_match DECIMAL(5,2),
  optimal_role_match DECIMAL(5,2),
  gap DECIMAL(5,2),
  
  -- Issues (JSON array)
  issues JSONB,
  
  -- Recommendations
  suggested_role TEXT,
  suggested_actions JSONB,
  
  -- Retention impact
  retention_risk_increase DECIMAL(5,2),
  time_to_intervene TEXT,
  
  -- Status tracking
  status TEXT CHECK (status IN ('Open', 'Acknowledged', 'In Progress', 'Resolved', 'Dismissed')) DEFAULT 'Open',
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One alert per member per day
  UNIQUE(member_id, DATE(detected_at))
);

-- =====================================================
-- INTERVENTION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS retention_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Source
  triggered_by TEXT CHECK (triggered_by IN ('retention_risk', 'spof_detection', 'role_misalignment', 'manual')),
  source_alert_id UUID, -- References the specific alert
  
  -- Intervention details
  intervention_type TEXT NOT NULL, -- e.g., 'career_development', 'role_change', 'training', 'eq_coaching'
  intervention_description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Immediate', 'Short-term', 'Medium-term', 'Low')),
  
  -- Responsible parties
  assigned_to UUID REFERENCES auth.users(id), -- Manager responsible
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Expected outcomes
  expected_improvement DECIMAL(5,2), -- Expected % improvement in risk score
  expected_completion_date DATE,
  estimated_cost DECIMAL(10,2),
  
  -- Status tracking
  status TEXT CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Planned',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Actual outcomes
  actual_improvement DECIMAL(5,2), -- Measured improvement
  effectiveness_score DECIMAL(5,2), -- 0-100 (how effective was this intervention)
  outcome_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE METRICS (for correlation analysis)
-- =====================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Metric details
  metric_type TEXT NOT NULL, -- 'billable_hours', 'client_satisfaction', 'quality_score', 'project_success', etc.
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit TEXT, -- 'hours', 'percentage', 'score', 'rating'
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Context
  related_client_id UUID,
  related_project_id UUID,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate metrics for same period
  UNIQUE(member_id, metric_type, period_start, period_end)
);

-- =====================================================
-- ASSESSMENT COMPLETION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_completion_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  assessment_type TEXT NOT NULL, -- 'vark', 'ocean', 'eq', 'belbin', 'motivational', 'conflict', 'working_prefs', 'skills'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completion_duration_seconds INTEGER, -- How long it took
  
  -- Flags
  completed_voluntarily BOOLEAN DEFAULT true, -- vs prompted/required
  completed_on_time BOOLEAN DEFAULT true -- vs overdue
);

-- =====================================================
-- TEAM REDUNDANCY TRACKING (SPOF Summary)
-- =====================================================

CREATE TABLE IF NOT EXISTS team_redundancy_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Snapshot metrics
  total_skills INTEGER,
  critical_spofs INTEGER,
  high_spofs INTEGER,
  vulnerable_skills INTEGER,
  healthy_skills INTEGER,
  
  overall_redundancy_score DECIMAL(5,2), -- 0-100
  business_continuity_risk TEXT CHECK (business_continuity_risk IN ('Low', 'Medium', 'High', 'Critical')),
  
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  UNIQUE(practice_id, snapshot_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Retention Risk Scores
CREATE INDEX IF NOT EXISTS idx_retention_risk_member ON retention_risk_scores(member_id);
CREATE INDEX IF NOT EXISTS idx_retention_risk_level ON retention_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_retention_risk_calculated ON retention_risk_scores(calculated_at DESC);

-- SPOF Detections
CREATE INDEX IF NOT EXISTS idx_spof_practice ON spof_detections(practice_id);
CREATE INDEX IF NOT EXISTS idx_spof_skill ON spof_detections(skill_id);
CREATE INDEX IF NOT EXISTS idx_spof_expert ON spof_detections(sole_expert_id);
CREATE INDEX IF NOT EXISTS idx_spof_status ON spof_detections(mitigation_status);
CREATE INDEX IF NOT EXISTS idx_spof_detected ON spof_detections(detected_at DESC);

-- Role Misalignment Alerts
CREATE INDEX IF NOT EXISTS idx_misalignment_member ON role_misalignment_alerts(member_id);
CREATE INDEX IF NOT EXISTS idx_misalignment_severity ON role_misalignment_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_misalignment_status ON role_misalignment_alerts(status);
CREATE INDEX IF NOT EXISTS idx_misalignment_detected ON role_misalignment_alerts(detected_at DESC);

-- Retention Interventions
CREATE INDEX IF NOT EXISTS idx_interventions_member ON retention_interventions(member_id);
CREATE INDEX IF NOT EXISTS idx_interventions_assigned ON retention_interventions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON retention_interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON retention_interventions(intervention_type);

-- Performance Metrics
CREATE INDEX IF NOT EXISTS idx_performance_member ON performance_metrics(member_id);
CREATE INDEX IF NOT EXISTS idx_performance_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_period ON performance_metrics(period_start, period_end);

-- Assessment Completion Log
CREATE INDEX IF NOT EXISTS idx_assessment_log_member ON assessment_completion_log(member_id);
CREATE INDEX IF NOT EXISTS idx_assessment_log_type ON assessment_completion_log(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_log_completed ON assessment_completion_log(completed_at DESC);

-- Team Redundancy Snapshots
CREATE INDEX IF NOT EXISTS idx_redundancy_practice ON team_redundancy_snapshots(practice_id);
CREATE INDEX IF NOT EXISTS idx_redundancy_date ON team_redundancy_snapshots(snapshot_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE retention_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE spof_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_misalignment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_completion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_redundancy_snapshots ENABLE ROW LEVEL SECURITY;

-- Managers/Partners can see all data for their practice
CREATE POLICY "Practice leadership can view risk scores" ON retention_risk_scores FOR SELECT USING (
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

CREATE POLICY "Practice leadership can view SPOFs" ON spof_detections FOR SELECT USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
  )
);

CREATE POLICY "Practice leadership can view misalignments" ON role_misalignment_alerts FOR SELECT USING (
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

CREATE POLICY "Practice leadership can manage interventions" ON retention_interventions FOR ALL USING (
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

CREATE POLICY "Practice leadership can view performance metrics" ON performance_metrics FOR SELECT USING (
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

CREATE POLICY "Practice leadership can view assessment logs" ON assessment_completion_log FOR SELECT USING (
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

CREATE POLICY "Practice leadership can view redundancy snapshots" ON team_redundancy_snapshots FOR SELECT USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
  )
);

-- System can manage all tables
CREATE POLICY "System can manage risk scores" ON retention_risk_scores FOR ALL WITH CHECK (true);
CREATE POLICY "System can manage SPOFs" ON spof_detections FOR ALL WITH CHECK (true);
CREATE POLICY "System can manage misalignments" ON role_misalignment_alerts FOR ALL WITH CHECK (true);
CREATE POLICY "System can manage performance metrics" ON performance_metrics FOR ALL WITH CHECK (true);
CREATE POLICY "System can manage assessment logs" ON assessment_completion_log FOR ALL WITH CHECK (true);
CREATE POLICY "System can manage redundancy snapshots" ON team_redundancy_snapshots FOR ALL WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_retention_interventions_updated_at BEFORE UPDATE ON retention_interventions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Risk trend view (last 30 days)
CREATE OR REPLACE VIEW retention_risk_trends AS
SELECT 
  m.id as member_id,
  m.name as member_name,
  m.role,
  rr.risk_score,
  rr.risk_level,
  rr.calculated_at,
  LAG(rr.risk_score) OVER (PARTITION BY m.id ORDER BY rr.calculated_at) as previous_risk_score,
  rr.risk_score - LAG(rr.risk_score) OVER (PARTITION BY m.id ORDER BY rr.calculated_at) as risk_change
FROM practice_members m
JOIN retention_risk_scores rr ON m.id = rr.member_id
WHERE rr.calculated_at >= NOW() - INTERVAL '30 days'
ORDER BY m.name, rr.calculated_at DESC;

-- Intervention effectiveness view
CREATE OR REPLACE VIEW intervention_effectiveness AS
SELECT 
  ri.intervention_type,
  COUNT(*) as total_interventions,
  AVG(ri.actual_improvement) as avg_improvement,
  AVG(ri.effectiveness_score) as avg_effectiveness,
  COUNT(*) FILTER (WHERE ri.status = 'Completed') as completed_count,
  AVG(EXTRACT(EPOCH FROM (ri.completed_at - ri.started_at))/86400) as avg_days_to_complete
FROM retention_interventions ri
WHERE ri.status = 'Completed'
GROUP BY ri.intervention_type
ORDER BY avg_effectiveness DESC;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Risk Analytics schema created successfully';
  RAISE NOTICE '📊 Tables:';
  RAISE NOTICE '  - retention_risk_scores (historical tracking)';
  RAISE NOTICE '  - spof_detections (SPOF monitoring)';
  RAISE NOTICE '  - role_misalignment_alerts (misalignment tracking)';
  RAISE NOTICE '  - retention_interventions (action tracking)';
  RAISE NOTICE '  - performance_metrics (for correlations)';
  RAISE NOTICE '  - assessment_completion_log (engagement tracking)';
  RAISE NOTICE '  - team_redundancy_snapshots (team health over time)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Views:';
  RAISE NOTICE '  - retention_risk_trends (30-day risk changes)';
  RAISE NOTICE '  - intervention_effectiveness (what works)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Next: Update TypeScript services to persist data';
END $$;

