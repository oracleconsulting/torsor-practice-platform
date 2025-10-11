-- AI Training Recommendations System
-- Creates tables for caching AI-generated training recommendations
-- Date: 2025-10-12

-- Create training_recommendations_cache table
CREATE TABLE IF NOT EXISTS training_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Cache metadata
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  
  -- Profile snapshot (for change detection)
  profile_snapshot JSONB NOT NULL,
  
  -- Recommendations data
  top_recommendations JSONB NOT NULL,
  quick_wins JSONB,
  strategic_investments JSONB,
  
  -- Summary metrics
  total_estimated_hours INTEGER DEFAULT 0,
  total_estimated_cost DECIMAL(10,2) DEFAULT 0,
  average_success_probability INTEGER DEFAULT 0,
  
  -- Learning path
  learning_path JSONB,
  
  -- Cache status
  is_valid BOOLEAN DEFAULT true,
  invalidation_reason TEXT,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one active cache per member
  UNIQUE(team_member_id)
);

-- Create group_training_opportunities table
CREATE TABLE IF NOT EXISTS group_training_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  
  skill_name VARCHAR(200) NOT NULL,
  skill_id UUID,
  
  -- Participant information
  member_ids UUID[] NOT NULL,
  member_count INTEGER NOT NULL,
  average_gap DECIMAL(3,2),
  
  -- Recommendation details
  recommendation JSONB NOT NULL,
  
  -- Cost analysis
  individual_cost DECIMAL(10,2),
  group_cost DECIMAL(10,2),
  cost_savings DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'planned', 'scheduled', 'completed', 'cancelled')),
  scheduled_date DATE,
  completed_date DATE,
  
  -- Metadata
  identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create learning_paths table for tracking
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Path details
  duration_months INTEGER DEFAULT 6,
  total_hours INTEGER,
  total_cost DECIMAL(10,2),
  success_probability INTEGER,
  
  -- Path data
  recommendations JSONB NOT NULL,
  milestones JSONB NOT NULL,
  
  -- Progress tracking
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'abandoned')),
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Completed items
  completed_recommendations UUID[],
  completed_milestones INTEGER[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Create recommendation_feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  recommendation_id VARCHAR(200) NOT NULL,
  
  -- Feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  was_helpful BOOLEAN,
  was_completed BOOLEAN,
  completion_date DATE,
  
  -- Comments
  feedback_text TEXT,
  actual_hours INTEGER,
  actual_cost DECIMAL(10,2),
  
  -- Results
  skill_improvement INTEGER, -- Levels improved
  would_recommend BOOLEAN,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_training_recs_cache_member ON training_recommendations_cache(team_member_id);
CREATE INDEX idx_training_recs_cache_expires ON training_recommendations_cache(expires_at);
CREATE INDEX idx_training_recs_cache_valid ON training_recommendations_cache(is_valid);

CREATE INDEX idx_group_opportunities_practice ON group_training_opportunities(practice_id);
CREATE INDEX idx_group_opportunities_status ON group_training_opportunities(status);
CREATE INDEX idx_group_opportunities_skill ON group_training_opportunities(skill_name);

CREATE INDEX idx_learning_paths_member ON learning_paths(team_member_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);
CREATE INDEX idx_learning_paths_dates ON learning_paths(start_date, target_completion_date);

CREATE INDEX idx_recommendation_feedback_member ON recommendation_feedback(team_member_id);
CREATE INDEX idx_recommendation_feedback_recommendation ON recommendation_feedback(recommendation_id);

-- Create triggers for updated_at
CREATE TRIGGER update_training_recs_cache_updated_at 
  BEFORE UPDATE ON training_recommendations_cache 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_opportunities_updated_at 
  BEFORE UPDATE ON group_training_opportunities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at 
  BEFORE UPDATE ON learning_paths 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to invalidate cache when skills change
CREATE OR REPLACE FUNCTION invalidate_recommendations_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE training_recommendations_cache
  SET is_valid = false,
      invalidation_reason = 'Skills updated',
      updated_at = CURRENT_TIMESTAMP
  WHERE team_member_id = NEW.team_member_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-invalidate cache when skills are assessed
CREATE TRIGGER auto_invalidate_cache_on_skill_update
  AFTER INSERT OR UPDATE ON skill_assessments
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_recommendations_cache();

-- Function to clean expired caches
CREATE OR REPLACE FUNCTION clean_expired_recommendation_caches()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM training_recommendations_cache
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for active recommendations
CREATE OR REPLACE VIEW active_training_recommendations AS
SELECT 
  trc.id,
  trc.team_member_id,
  pm.user_id,
  trc.generated_at,
  trc.expires_at,
  trc.top_recommendations,
  trc.quick_wins,
  trc.strategic_investments,
  trc.total_estimated_hours,
  trc.total_estimated_cost,
  trc.average_success_probability,
  trc.learning_path,
  EXTRACT(EPOCH FROM (trc.expires_at - CURRENT_TIMESTAMP))/86400 as days_until_expiry
FROM training_recommendations_cache trc
JOIN practice_members pm ON trc.team_member_id = pm.id
WHERE trc.is_valid = true 
  AND trc.expires_at > CURRENT_TIMESTAMP
  AND pm.is_active = true;

-- View for group opportunities with team details
CREATE OR REPLACE VIEW group_opportunities_with_details AS
SELECT 
  gto.id,
  gto.practice_id,
  gto.skill_name,
  gto.member_count,
  gto.average_gap,
  gto.recommendation,
  gto.cost_savings,
  gto.status,
  gto.scheduled_date,
  array_agg(DISTINCT pm.user_id) as member_user_ids,
  gto.identified_at
FROM group_training_opportunities gto
CROSS JOIN UNNEST(gto.member_ids) as member_id
JOIN practice_members pm ON pm.id = member_id
WHERE pm.is_active = true
GROUP BY gto.id;

-- Comments for documentation
COMMENT ON TABLE training_recommendations_cache IS 'Caches AI-generated training recommendations for 7 days';
COMMENT ON TABLE group_training_opportunities IS 'Identified opportunities for group training to save costs';
COMMENT ON TABLE learning_paths IS 'Generated 6-month learning paths for team members';
COMMENT ON TABLE recommendation_feedback IS 'User feedback on recommendations to improve AI';

COMMENT ON COLUMN training_recommendations_cache.profile_snapshot IS 'Snapshot of member profile when recommendations generated';
COMMENT ON COLUMN training_recommendations_cache.expires_at IS 'Cache expires after 7 days';
COMMENT ON FUNCTION clean_expired_recommendation_caches IS 'Cleanup function to remove expired caches';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON training_recommendations_cache TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON group_training_opportunities TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON learning_paths TO authenticated;
-- GRANT SELECT, INSERT ON recommendation_feedback TO authenticated;

