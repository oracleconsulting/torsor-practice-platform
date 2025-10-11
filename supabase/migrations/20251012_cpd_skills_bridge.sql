-- CPD-Skills Integration Bridge
-- Date: 2025-10-12
-- PROMPT 5 Implementation

-- Table: cpd_skill_mappings
-- Links CPD activities to specific skills they target
CREATE TABLE IF NOT EXISTS cpd_skill_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  cpd_activity_id UUID NOT NULL REFERENCES cpd_activities(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Expected improvement
  skill_level_before INTEGER CHECK (skill_level_before BETWEEN 0 AND 5),
  expected_level_after INTEGER CHECK (expected_level_after BETWEEN 0 AND 5),
  actual_level_after INTEGER CHECK (actual_level_after BETWEEN 0 AND 5),
  
  -- Impact tracking
  improvement_achieved INTEGER GENERATED ALWAYS AS (actual_level_after - skill_level_before) STORED,
  improvement_expected INTEGER GENERATED ALWAYS AS (expected_level_after - skill_level_before) STORED,
  effectiveness_percentage INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN expected_level_after - skill_level_before = 0 THEN 100
      WHEN actual_level_after IS NULL THEN NULL
      ELSE (actual_level_after - skill_level_before) * 100 / (expected_level_after - skill_level_before)
    END
  ) STORED,
  
  -- Assessment tracking
  pre_assessment_completed BOOLEAN DEFAULT false,
  pre_assessment_date TIMESTAMP,
  post_assessment_completed BOOLEAN DEFAULT false,
  post_assessment_date TIMESTAMP,
  reassessment_reminder_sent TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(cpd_activity_id, skill_id, member_id),
  CHECK (expected_level_after >= skill_level_before),
  CHECK (actual_level_after IS NULL OR actual_level_after >= 0)
);

-- Table: skill_improvement_tracking
-- Tracks all skill level changes over time
CREATE TABLE IF NOT EXISTS skill_improvement_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who and what
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Change details
  level_before INTEGER NOT NULL CHECK (level_before BETWEEN 0 AND 5),
  level_after INTEGER NOT NULL CHECK (level_after BETWEEN 0 AND 5),
  change_amount INTEGER GENERATED ALWAYS AS (level_after - level_before) STORED,
  
  -- Attribution
  change_reason VARCHAR(100) NOT NULL CHECK (change_reason IN (
    'cpd_completion', 'formal_training', 'self_study', 
    'mentoring', 'project_work', 'assessment', 'other'
  )),
  cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL,
  mentoring_relationship_id UUID REFERENCES mentoring_relationships(id) ON DELETE SET NULL,
  
  -- Cost tracking
  investment_hours DECIMAL(5,2),
  investment_cost DECIMAL(10,2),
  roi_score DECIMAL(5,2), -- Return on investment score
  
  -- Validation
  assessed_by UUID REFERENCES practice_members(id),
  assessment_method VARCHAR(50),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  
  -- Evidence
  evidence_notes TEXT,
  evidence_urls TEXT[],
  
  -- Timestamps
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cpd_effectiveness_scores
-- Aggregate effectiveness data for CPD providers/types
CREATE TABLE IF NOT EXISTS cpd_effectiveness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What we're scoring
  score_type VARCHAR(50) NOT NULL CHECK (score_type IN (
    'provider', 'cpd_category', 'skill_category', 'training_format'
  )),
  score_value VARCHAR(200) NOT NULL, -- e.g., provider name, category name
  
  -- Aggregate metrics
  total_activities INTEGER DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Effectiveness
  average_skill_improvement DECIMAL(3,2), -- Average levels improved
  effectiveness_percentage DECIMAL(5,2), -- % of expected improvement achieved
  member_satisfaction_score DECIMAL(3,2), -- 1-5 rating
  
  -- ROI
  cost_per_skill_level DECIMAL(10,2),
  hours_per_skill_level DECIMAL(8,2),
  
  -- Metadata
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculation_period_start DATE,
  calculation_period_end DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(score_type, score_value)
);

-- Table: cpd_recommendations
-- Smart CPD suggestions based on skill gaps
CREATE TABLE IF NOT EXISTS cpd_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who and what
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Current state
  current_skill_level INTEGER CHECK (current_skill_level BETWEEN 0 AND 5),
  target_skill_level INTEGER CHECK (target_skill_level BETWEEN 0 AND 5),
  skill_gap INTEGER GENERATED ALWAYS AS (target_skill_level - current_skill_level) STORED,
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  
  -- Recommendation
  recommended_cpd_type VARCHAR(100), -- e.g., 'Online Course', 'Workshop', 'Mentoring'
  recommended_provider VARCHAR(200),
  estimated_hours DECIMAL(5,2),
  estimated_cost DECIMAL(10,2),
  expected_improvement INTEGER, -- How many levels expected to gain
  
  -- Prioritization
  priority_score DECIMAL(5,2), -- Algorithm-generated priority
  business_impact VARCHAR(20) CHECK (business_impact IN ('critical', 'high', 'medium', 'low')),
  urgency VARCHAR(20) CHECK (urgency IN ('immediate', 'short_term', 'medium_term', 'long_term')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'suggested' CHECK (status IN (
    'suggested', 'viewed', 'accepted', 'in_progress', 'completed', 'dismissed'
  )),
  
  -- Engagement
  viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  dismissal_reason TEXT,
  
  -- Results
  cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE SET NULL, -- If acted upon
  actual_improvement INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days')
);

-- Table: skill_assessment_reminders
-- Automated reminders for post-CPD re-assessment
CREATE TABLE IF NOT EXISTS skill_assessment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- What triggered it
  trigger_type VARCHAR(50) CHECK (trigger_type IN (
    'cpd_completion', 'time_based', 'mentoring_goal', 'manual'
  )),
  cpd_activity_id UUID REFERENCES cpd_activities(id) ON DELETE CASCADE,
  cpd_skill_mapping_id UUID REFERENCES cpd_skill_mappings(id) ON DELETE CASCADE,
  
  -- Skills to assess
  skills_to_assess UUID[], -- Array of skill IDs
  
  -- Timing
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'completed', 'dismissed', 'expired'
  )),
  
  -- Notification details
  notification_method VARCHAR(50) DEFAULT 'email',
  notification_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpd_skill_mappings_cpd ON cpd_skill_mappings(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_cpd_skill_mappings_skill ON cpd_skill_mappings(skill_id);
CREATE INDEX IF NOT EXISTS idx_cpd_skill_mappings_member ON cpd_skill_mappings(member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_skill_mappings_effectiveness ON cpd_skill_mappings(effectiveness_percentage);

CREATE INDEX IF NOT EXISTS idx_skill_tracking_member ON skill_improvement_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_skill_tracking_skill ON skill_improvement_tracking(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_tracking_date ON skill_improvement_tracking(changed_at);
CREATE INDEX IF NOT EXISTS idx_skill_tracking_cpd ON skill_improvement_tracking(cpd_activity_id);

CREATE INDEX IF NOT EXISTS idx_cpd_recommendations_member ON cpd_recommendations(member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_recommendations_skill ON cpd_recommendations(skill_id);
CREATE INDEX IF NOT EXISTS idx_cpd_recommendations_status ON cpd_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_assessment_reminders_member ON skill_assessment_reminders(member_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reminders_scheduled ON skill_assessment_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_assessment_reminders_status ON skill_assessment_reminders(status);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cpd_skill_mappings_updated_at
  BEFORE UPDATE ON cpd_skill_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cpd_effectiveness_scores_updated_at
  BEFORE UPDATE ON cpd_effectiveness_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cpd_recommendations_updated_at
  BEFORE UPDATE ON cpd_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View: cpd_roi_dashboard
-- Comprehensive view of CPD return on investment
CREATE OR REPLACE VIEW cpd_roi_dashboard AS
SELECT 
  pm.id as member_id,
  pm.name as member_name,
  pm.role,
  
  -- CPD Summary
  COUNT(DISTINCT ca.id) as total_cpd_activities,
  SUM(ca.hours) as total_cpd_hours,
  SUM(ca.cost) as total_cpd_cost,
  
  -- Skill Improvements
  COUNT(DISTINCT csm.skill_id) as skills_targeted,
  AVG(csm.improvement_achieved) as avg_improvement_achieved,
  AVG(csm.effectiveness_percentage) as avg_effectiveness_percentage,
  
  -- ROI Metrics
  CASE 
    WHEN SUM(csm.improvement_achieved) > 0 
    THEN SUM(ca.hours) / SUM(csm.improvement_achieved)
    ELSE NULL 
  END as hours_per_skill_level,
  
  CASE 
    WHEN SUM(csm.improvement_achieved) > 0 
    THEN SUM(ca.cost) / SUM(csm.improvement_achieved)
    ELSE NULL 
  END as cost_per_skill_level,
  
  -- Team capability score (average skill level)
  (SELECT AVG(current_level) 
   FROM team_member_skills tms 
   WHERE tms.member_id = pm.id) as current_avg_skill_level
  
FROM practice_members pm
LEFT JOIN cpd_activities ca ON pm.id = ca.member_id
LEFT JOIN cpd_skill_mappings csm ON ca.id = csm.cpd_activity_id
WHERE ca.status = 'completed'
GROUP BY pm.id, pm.name, pm.role;

-- View: skill_improvement_timeline
-- Shows skill changes over time
CREATE OR REPLACE VIEW skill_improvement_timeline AS
SELECT 
  sit.id,
  sit.member_id,
  pm.name as member_name,
  sit.skill_id,
  s.name as skill_name,
  s.category as skill_category,
  sit.level_before,
  sit.level_after,
  sit.change_amount,
  sit.change_reason,
  sit.changed_at,
  ca.title as cpd_activity_title,
  ca.hours as cpd_hours,
  ca.cost as cpd_cost,
  sit.roi_score
FROM skill_improvement_tracking sit
JOIN practice_members pm ON sit.member_id = pm.id
JOIN skills s ON sit.skill_id = s.id
LEFT JOIN cpd_activities ca ON sit.cpd_activity_id = ca.id
ORDER BY sit.changed_at DESC;

-- View: smart_cpd_suggestions
-- Prioritized CPD recommendations
CREATE OR REPLACE VIEW smart_cpd_suggestions AS
SELECT 
  cr.id,
  cr.member_id,
  pm.name as member_name,
  cr.skill_id,
  s.name as skill_name,
  s.category as skill_category,
  cr.current_skill_level,
  cr.target_skill_level,
  cr.skill_gap,
  cr.interest_level,
  cr.recommended_cpd_type,
  cr.recommended_provider,
  cr.estimated_hours,
  cr.estimated_cost,
  cr.expected_improvement,
  cr.priority_score,
  cr.business_impact,
  cr.urgency,
  cr.status,
  
  -- Effectiveness data from similar past activities
  (SELECT AVG(effectiveness_percentage) 
   FROM cpd_effectiveness_scores ces
   WHERE ces.score_type = 'cpd_category' 
   AND ces.score_value = cr.recommended_cpd_type) as historical_effectiveness
   
FROM cpd_recommendations cr
JOIN practice_members pm ON cr.member_id = pm.id
JOIN skills s ON cr.skill_id = s.id
WHERE cr.status IN ('suggested', 'viewed', 'accepted')
AND cr.expires_at > CURRENT_TIMESTAMP
ORDER BY cr.priority_score DESC, cr.skill_gap DESC;

-- Function: create_post_cpd_assessment_reminder
-- Automatically creates reminder when CPD is completed
CREATE OR REPLACE FUNCTION create_post_cpd_assessment_reminder()
RETURNS TRIGGER AS $$
DECLARE
  target_skills UUID[];
BEGIN
  -- Only trigger on completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get skills targeted by this CPD
    SELECT ARRAY_AGG(DISTINCT skill_id) INTO target_skills
    FROM cpd_skill_mappings
    WHERE cpd_activity_id = NEW.id;
    
    -- Create reminder for 7 days after completion
    IF target_skills IS NOT NULL AND array_length(target_skills, 1) > 0 THEN
      INSERT INTO skill_assessment_reminders (
        member_id,
        trigger_type,
        cpd_activity_id,
        skills_to_assess,
        scheduled_for,
        notification_message
      ) VALUES (
        NEW.member_id,
        'cpd_completion',
        NEW.id,
        target_skills,
        NEW.completion_date + INTERVAL '7 days',
        'Time to assess your skill improvements from: ' || NEW.title
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_assessment_reminder
  AFTER UPDATE ON cpd_activities
  FOR EACH ROW
  EXECUTE FUNCTION create_post_cpd_assessment_reminder();

-- Function: calculate_cpd_effectiveness_scores
-- Aggregate effectiveness metrics
CREATE OR REPLACE FUNCTION calculate_cpd_effectiveness_scores()
RETURNS void AS $$
BEGIN
  -- Calculate by CPD category
  INSERT INTO cpd_effectiveness_scores (
    score_type, score_value, total_activities, total_hours, total_cost,
    average_skill_improvement, effectiveness_percentage,
    cost_per_skill_level, hours_per_skill_level,
    calculation_period_start, calculation_period_end
  )
  SELECT 
    'cpd_category',
    ca.category,
    COUNT(DISTINCT ca.id),
    SUM(ca.hours),
    SUM(ca.cost),
    AVG(csm.improvement_achieved),
    AVG(csm.effectiveness_percentage),
    CASE WHEN SUM(csm.improvement_achieved) > 0 
      THEN SUM(ca.cost) / SUM(csm.improvement_achieved) 
      ELSE NULL END,
    CASE WHEN SUM(csm.improvement_achieved) > 0 
      THEN SUM(ca.hours) / SUM(csm.improvement_achieved) 
      ELSE NULL END,
    DATE_TRUNC('month', MIN(ca.completion_date)),
    DATE_TRUNC('month', MAX(ca.completion_date))
  FROM cpd_activities ca
  JOIN cpd_skill_mappings csm ON ca.id = csm.cpd_activity_id
  WHERE ca.status = 'completed'
  AND csm.actual_level_after IS NOT NULL
  GROUP BY ca.category
  ON CONFLICT (score_type, score_value) 
  DO UPDATE SET
    total_activities = EXCLUDED.total_activities,
    total_hours = EXCLUDED.total_hours,
    total_cost = EXCLUDED.total_cost,
    average_skill_improvement = EXCLUDED.average_skill_improvement,
    effectiveness_percentage = EXCLUDED.effectiveness_percentage,
    cost_per_skill_level = EXCLUDED.cost_per_skill_level,
    hours_per_skill_level = EXCLUDED.hours_per_skill_level,
    last_calculated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE cpd_skill_mappings IS 'Links CPD activities to skills they target, tracking expected vs actual improvements';
COMMENT ON TABLE skill_improvement_tracking IS 'Complete history of all skill level changes with attribution and ROI data';
COMMENT ON TABLE cpd_effectiveness_scores IS 'Aggregate effectiveness metrics for different CPD types and providers';
COMMENT ON TABLE cpd_recommendations IS 'AI-generated smart CPD suggestions based on skill gaps and priorities';
COMMENT ON TABLE skill_assessment_reminders IS 'Automated reminders for post-CPD skill re-assessment';

COMMENT ON VIEW cpd_roi_dashboard IS 'Comprehensive CPD return on investment metrics per team member';
COMMENT ON VIEW skill_improvement_timeline IS 'Timeline of skill improvements with associated CPD activities';
COMMENT ON VIEW smart_cpd_suggestions IS 'Prioritized CPD recommendations with historical effectiveness data';

