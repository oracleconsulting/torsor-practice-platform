-- =====================================================
-- ASSESSMENT INSIGHTS SYSTEM - DATABASE SCHEMA
-- Part 2: Strategic Assessment Analysis
-- NON-BREAKING: All new tables, no changes to existing
-- =====================================================

BEGIN;

-- =====================================================
-- INDIVIDUAL ASSESSMENT INSIGHTS
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE UNIQUE,
  
  -- Role Classification
  assigned_role_type TEXT CHECK (assigned_role_type IN ('advisory', 'technical', 'hybrid', 'leadership', 'unassigned')) DEFAULT 'unassigned',
  
  -- Role-Fit Scores (0-100)
  advisory_suitability_score DECIMAL(5,2) DEFAULT 0,
  technical_suitability_score DECIMAL(5,2) DEFAULT 0,
  hybrid_suitability_score DECIMAL(5,2) DEFAULT 0,
  leadership_readiness_score DECIMAL(5,2) DEFAULT 0,
  overall_role_fit_score DECIMAL(5,2) DEFAULT 0,
  
  -- Assessment Data Snapshot
  belbin_primary TEXT[] DEFAULT '{}',
  belbin_secondary TEXT[] DEFAULT '{}',
  motivational_drivers JSONB DEFAULT '{}', -- {achievement: 80, affiliation: 60, power: 70, ...}
  eq_scores JSONB DEFAULT '{}', -- {self_awareness: 75, social_awareness: 82, ...}
  conflict_style_primary TEXT,
  conflict_style_secondary TEXT,
  communication_preference TEXT,
  working_style_preference TEXT,
  
  -- Red Flags & Alerts
  red_flags JSONB DEFAULT '[]', -- [{type: 'low_eq_social', severity: 'high', message: '...', recommendation: '...'}]
  warning_flags JSONB DEFAULT '[]', -- [{type: 'skill_gap', severity: 'medium', ...}]
  
  -- Development Priorities
  development_priorities JSONB DEFAULT '[]', -- [{area: 'relationship_building', priority: 1, timeline: '3-6 months'}]
  training_level TEXT CHECK (training_level IN ('critical', 'enhancement', 'excellence', 'none')) DEFAULT 'none',
  
  -- Career Pathways
  current_role_match_percentage DECIMAL(5,2) DEFAULT 0,
  recommended_role_type TEXT,
  succession_readiness_score DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEAM COMPOSITION INSIGHTS
-- =====================================================

CREATE TABLE IF NOT EXISTS team_composition_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  service_line_id TEXT, -- Optional: specific service line (e.g., 'automation', 'advisory-accelerator')
  team_name TEXT, -- Optional: specific team name
  
  -- Team Scope
  member_ids UUID[] DEFAULT '{}', -- Array of practice_member IDs in this team
  team_size INTEGER DEFAULT 0,
  
  -- Belbin Balance (0-100)
  belbin_coverage JSONB DEFAULT '{}', -- {coordinator: 2, implementer: 3, plant: 1, ...}
  belbin_gaps TEXT[] DEFAULT '{}', -- ['specialist', 'monitor_evaluator']
  belbin_overlaps TEXT[] DEFAULT '{}', -- ['shaper'] (too many)
  belbin_balance_score DECIMAL(5,2) DEFAULT 0,
  has_innovation_role BOOLEAN DEFAULT false, -- Has Plant
  has_momentum_role BOOLEAN DEFAULT false, -- Has Shaper
  has_quality_role BOOLEAN DEFAULT false, -- Has Completer Finisher
  
  -- Motivational Distribution
  motivational_distribution JSONB DEFAULT '{}', -- {achievement: 35, affiliation: 25, power: 15, ...}
  motivational_alignment_score DECIMAL(5,2) DEFAULT 0,
  dominant_motivator TEXT,
  
  -- EQ Team Mapping
  team_avg_eq DECIMAL(5,2) DEFAULT 0,
  eq_domain_averages JSONB DEFAULT '{}', -- {self_awareness: 72, social_awareness: 68, ...}
  client_facing_readiness_score DECIMAL(5,2) DEFAULT 0,
  high_eq_member_count INTEGER DEFAULT 0, -- Members with EQ ≥75
  
  -- Conflict Style Diversity
  conflict_style_distribution JSONB DEFAULT '{}', -- {collaborating: 3, competing: 2, ...}
  conflict_resolution_capacity_score DECIMAL(5,2) DEFAULT 0,
  conflict_diversity_healthy BOOLEAN DEFAULT false,
  
  -- Team Health Metrics
  team_health_score DECIMAL(5,2) DEFAULT 0, -- Composite score
  innovation_capacity_score DECIMAL(5,2) DEFAULT 0,
  execution_capacity_score DECIMAL(5,2) DEFAULT 0,
  relationship_capacity_score DECIMAL(5,2) DEFAULT 0,
  
  -- Risk Assessment
  single_points_of_failure JSONB DEFAULT '[]', -- [{skill: 'X', only_member: 'Y'}]
  capability_gaps JSONB DEFAULT '[]', -- [{area: 'X', severity: 'high'}]
  succession_gaps JSONB DEFAULT '[]', -- [{role: 'X', risk: 'high'}]
  
  -- Recommendations
  recruitment_needs JSONB DEFAULT '[]', -- [{role: 'Belbin Plant', priority: 'high'}]
  team_rebalance_suggestions JSONB DEFAULT '[]',
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SERVICE LINE OPTIMIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS service_line_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  service_line_id TEXT NOT NULL,
  service_line_name TEXT NOT NULL,
  
  -- Current Composition
  total_team_size INTEGER DEFAULT 0,
  advisory_percentage DECIMAL(5,2) DEFAULT 0,
  technical_percentage DECIMAL(5,2) DEFAULT 0,
  hybrid_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Optimal vs Actual
  optimal_composition JSONB DEFAULT '{}', -- {advisory: 60, technical: 10, hybrid: 30}
  actual_composition JSONB DEFAULT '{}', -- {advisory: 45, technical: 20, hybrid: 35}
  composition_gap_score DECIMAL(5,2) DEFAULT 0, -- How far from optimal (0-100, 100 = perfect match)
  
  -- Capability Assessment
  client_relationship_strength DECIMAL(5,2) DEFAULT 0,
  technical_depth_score DECIMAL(5,2) DEFAULT 0,
  innovation_capacity DECIMAL(5,2) DEFAULT 0,
  execution_quality_score DECIMAL(5,2) DEFAULT 0,
  
  -- Staffing
  current_staff_ids UUID[] DEFAULT '{}',
  optimal_staff_size INTEGER,
  understaffed_by INTEGER DEFAULT 0,
  overstaffed_by INTEGER DEFAULT 0,
  
  -- Gaps & Needs
  capability_gaps JSONB DEFAULT '[]', -- [{capability: 'strategic_thinking', severity: 'high'}]
  skill_gaps JSONB DEFAULT '[]', -- [{skill: 'X', count_needed: 2}]
  recruitment_needs JSONB DEFAULT '[]', -- [{role: 'Senior Advisory', belbin: 'Coordinator', priority: 'high'}]
  training_priorities JSONB DEFAULT '[]', -- [{area: 'EQ_development', members: 3, urgency: 'medium'}]
  
  -- Risk Indicators
  single_points_of_failure JSONB DEFAULT '[]',
  succession_gaps JSONB DEFAULT '[]',
  client_risk_score DECIMAL(5,2) DEFAULT 0, -- Risk to client delivery
  
  -- Performance Correlation (if available)
  revenue_per_member DECIMAL(10,2),
  client_satisfaction_score DECIMAL(5,2),
  delivery_quality_score DECIMAL(5,2),
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(practice_id, service_line_id)
);

-- =====================================================
-- TRAINING ALLOCATION PRIORITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS training_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Priority Classification
  priority_level TEXT CHECK (priority_level IN ('level_1_critical', 'level_2_enhancement', 'level_3_excellence')) NOT NULL,
  training_area TEXT NOT NULL, -- 'eq_development', 'technical_skills', 'leadership', 'conflict_resolution'
  specific_focus TEXT, -- More detailed area
  
  -- Context
  reason TEXT, -- Why this training is needed
  current_gap_score DECIMAL(5,2), -- How big is the gap (0-100)
  target_improvement_score DECIMAL(5,2), -- Target score after training
  
  -- Impact
  role_critical BOOLEAN DEFAULT false, -- Critical for current role
  blocks_promotion BOOLEAN DEFAULT false, -- Prevents advancement
  affects_team_performance BOOLEAN DEFAULT false,
  client_facing_impact BOOLEAN DEFAULT false,
  
  -- Recommendations
  recommended_programme TEXT,
  estimated_duration_weeks INTEGER,
  estimated_cost DECIMAL(10,2),
  priority_score DECIMAL(5,2), -- Composite priority score
  
  -- Tracking
  status TEXT CHECK (status IN ('recommended', 'planned', 'in_progress', 'completed', 'deferred')) DEFAULT 'recommended',
  planned_start_date DATE,
  actual_start_date DATE,
  completion_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_assessment_insights_member ON assessment_insights(member_id);
CREATE INDEX IF NOT EXISTS idx_assessment_insights_role_type ON assessment_insights(assigned_role_type);
CREATE INDEX IF NOT EXISTS idx_assessment_insights_training_level ON assessment_insights(training_level);
CREATE INDEX IF NOT EXISTS idx_team_composition_insights_practice ON team_composition_insights(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_composition_insights_service_line ON team_composition_insights(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_line_insights_practice ON service_line_insights(practice_id);
CREATE INDEX IF NOT EXISTS idx_service_line_insights_service_line ON service_line_insights(service_line_id);
CREATE INDEX IF NOT EXISTS idx_training_priorities_member ON training_priorities(member_id);
CREATE INDEX IF NOT EXISTS idx_training_priorities_level ON training_priorities(priority_level);
CREATE INDEX IF NOT EXISTS idx_training_priorities_status ON training_priorities(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE assessment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_composition_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_line_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_priorities ENABLE ROW LEVEL SECURITY;

-- Assessment Insights: Members can see their own, admins can see all
DROP POLICY IF EXISTS "Members can view their own insights" ON assessment_insights;
CREATE POLICY "Members can view their own insights" ON assessment_insights FOR SELECT USING (
  member_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  OR
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

DROP POLICY IF EXISTS "System can manage assessment insights" ON assessment_insights;
CREATE POLICY "System can manage assessment insights" ON assessment_insights FOR ALL WITH CHECK (true);

-- Team Composition Insights: Admins and managers can see
DROP POLICY IF EXISTS "Managers can view team insights" ON team_composition_insights;
CREATE POLICY "Managers can view team insights" ON team_composition_insights FOR SELECT USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
  )
);

DROP POLICY IF EXISTS "System can manage team insights" ON team_composition_insights;
CREATE POLICY "System can manage team insights" ON team_composition_insights FOR ALL WITH CHECK (true);

-- Service Line Insights: Admins can see
DROP POLICY IF EXISTS "Admins can view service line insights" ON service_line_insights;
CREATE POLICY "Admins can view service line insights" ON service_line_insights FOR SELECT USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

DROP POLICY IF EXISTS "System can manage service line insights" ON service_line_insights;
CREATE POLICY "System can manage service line insights" ON service_line_insights FOR ALL WITH CHECK (true);

-- Training Priorities: Members can see their own, admins can see all
DROP POLICY IF EXISTS "Members can view their training priorities" ON training_priorities;
CREATE POLICY "Members can view their training priorities" ON training_priorities FOR SELECT USING (
  member_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  OR
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director', 'Manager')
    )
  )
);

DROP POLICY IF EXISTS "System can manage training priorities" ON training_priorities;
CREATE POLICY "System can manage training priorities" ON training_priorities FOR ALL WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_assessment_insights_updated_at ON assessment_insights;
CREATE TRIGGER update_assessment_insights_updated_at BEFORE UPDATE ON assessment_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_composition_insights_updated_at ON team_composition_insights;
CREATE TRIGGER update_team_composition_insights_updated_at BEFORE UPDATE ON team_composition_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_line_insights_updated_at ON service_line_insights;
CREATE TRIGGER update_service_line_insights_updated_at BEFORE UPDATE ON service_line_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_priorities_updated_at ON training_priorities;
CREATE TRIGGER update_training_priorities_updated_at BEFORE UPDATE ON training_priorities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE assessment_insights IS 'Individual role-fit analysis and development recommendations';
COMMENT ON TABLE team_composition_insights IS 'Team-level Belbin, EQ, and motivational analysis';
COMMENT ON TABLE service_line_insights IS 'Service line capability assessment and optimization recommendations';
COMMENT ON TABLE training_priorities IS 'Prioritized training recommendations with impact assessment';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Assessment Insights tables created successfully';
  RAISE NOTICE '👤 Table: assessment_insights (individual role-fit)';
  RAISE NOTICE '👥 Table: team_composition_insights (team analysis)';
  RAISE NOTICE '🎯 Table: service_line_insights (service line optimization)';
  RAISE NOTICE '📚 Table: training_priorities (training allocation)';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Next: Implement calculation algorithms in TypeScript';
END $$;

