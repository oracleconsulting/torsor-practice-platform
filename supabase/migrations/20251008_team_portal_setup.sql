-- Team Portal Setup Migration
-- Adds all required tables and fields for team member portal
-- Date: October 8, 2025

-- ============================================
-- 1. EXTEND PRACTICE MEMBERS TABLE
-- ============================================

ALTER TABLE practice_members 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "share_profile": false,
  "show_in_team_rankings": true,
  "allow_comparisons": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{
  "email_reminders": true,
  "quarterly_review": true,
  "training_recommendations": true,
  "goal_milestones": true,
  "weekly_digest": false
}'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_practice_id ON practice_members(practice_id);

-- ============================================
-- 2. SURVEY SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS survey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  practice_id UUID REFERENCES practices(id),
  
  -- Survey data
  survey_data JSONB DEFAULT '{}'::jsonb,
  progress_percentage INT DEFAULT 0,
  current_category VARCHAR(100),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop', NULL))
);

CREATE INDEX idx_survey_sessions_email ON survey_sessions(email);
CREATE INDEX idx_survey_sessions_status ON survey_sessions(status);
CREATE INDEX idx_survey_sessions_practice_member ON survey_sessions(practice_member_id);

COMMENT ON TABLE survey_sessions IS 'Stores draft and submitted skill assessment surveys';

-- ============================================
-- 3. DEVELOPMENT GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS development_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Goal details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  category VARCHAR(100),
  
  -- Levels
  current_level INT CHECK (current_level >= 0 AND current_level <= 5),
  target_level INT CHECK (target_level >= 0 AND target_level <= 5),
  
  -- Timeline
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_date DATE,
  
  -- Progress
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planned', 'active', 'on_hold', 'completed', 'cancelled')),
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Resources
  learning_resources JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  manager_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_target_level CHECK (target_level >= current_level)
);

CREATE INDEX idx_development_goals_member ON development_goals(practice_member_id);
CREATE INDEX idx_development_goals_status ON development_goals(status);
CREATE INDEX idx_development_goals_target_date ON development_goals(target_date);

COMMENT ON TABLE development_goals IS 'Individual development goals and learning plans';

-- ============================================
-- 4. GOAL MILESTONES (stored in JSONB but documented here)
-- ============================================

COMMENT ON COLUMN development_goals.milestones IS 'JSON array of milestone objects: [{ "id": "uuid", "title": "string", "description": "string", "target_date": "date", "completed": boolean, "completed_date": "date" }]';

-- ============================================
-- 5. TRAINING RESOURCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resource details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) CHECK (resource_type IN ('course', 'video', 'article', 'book', 'workshop', 'mentoring', 'certification', 'other')),
  url TEXT,
  
  -- Categorization
  skill_ids UUID[] DEFAULT ARRAY[]::UUID[],
  categories VARCHAR(100)[],
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert', NULL)),
  
  -- Details
  duration_hours DECIMAL(5,2),
  cost_gbp DECIMAL(10,2),
  provider VARCHAR(255),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_training_resources_active ON training_resources(is_active);
CREATE INDEX idx_training_resources_type ON training_resources(resource_type);

COMMENT ON TABLE training_resources IS 'Available training and learning resources';

-- ============================================
-- 6. RESOURCE ENROLLMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS resource_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES training_resources(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES development_goals(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Dates
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(practice_member_id, resource_id)
);

CREATE INDEX idx_resource_enrollments_member ON resource_enrollments(practice_member_id);
CREATE INDEX idx_resource_enrollments_resource ON resource_enrollments(resource_id);
CREATE INDEX idx_resource_enrollments_status ON resource_enrollments(status);

COMMENT ON TABLE resource_enrollments IS 'Team member enrollments in training resources';

-- ============================================
-- 7. PORTAL ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  page_path VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portal_activity_member ON portal_activity_log(practice_member_id);
CREATE INDEX idx_portal_activity_type ON portal_activity_log(activity_type);
CREATE INDEX idx_portal_activity_created ON portal_activity_log(created_at DESC);

COMMENT ON TABLE portal_activity_log IS 'Audit log of portal activities';

-- ============================================
-- 8. TEAM INSIGHTS CACHE (for performance)
-- ============================================

CREATE TABLE IF NOT EXISTS team_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Cached data
  insight_type VARCHAR(50) NOT NULL,
  insight_data JSONB NOT NULL,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
  
  UNIQUE(practice_id, insight_type)
);

CREATE INDEX idx_team_insights_practice ON team_insights_cache(practice_id);
CREATE INDEX idx_team_insights_expires ON team_insights_cache(expires_at);

COMMENT ON TABLE team_insights_cache IS 'Cached team-level analytics for performance';

-- ============================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

-- Survey Sessions: Users can see their own
CREATE POLICY "Users can view own survey sessions"
ON survey_sessions FOR SELECT
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own survey sessions"
ON survey_sessions FOR UPDATE
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Development Goals: Users can see and manage their own
CREATE POLICY "Users can view own development goals"
ON development_goals FOR SELECT
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own development goals"
ON development_goals FOR ALL
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Training Resources: Everyone can view active resources
CREATE POLICY "Users can view active training resources"
ON training_resources FOR SELECT
USING (is_active = true);

-- Resource Enrollments: Users can view and manage their own
CREATE POLICY "Users can view own enrollments"
ON resource_enrollments FOR SELECT
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own enrollments"
ON resource_enrollments FOR ALL
USING (
  practice_member_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 10. FUNCTIONS FOR ANONYMIZED INSIGHTS
-- ============================================

-- Function to get anonymized team averages
CREATE OR REPLACE FUNCTION get_team_skill_averages(p_practice_id UUID, p_category VARCHAR DEFAULT NULL)
RETURNS TABLE (
  category VARCHAR,
  skill_name VARCHAR,
  avg_current_level DECIMAL,
  avg_interest_level DECIMAL,
  assessment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.category,
    s.name as skill_name,
    ROUND(AVG(sa.current_level), 2) as avg_current_level,
    ROUND(AVG(sa.interest_level), 2) as avg_interest_level,
    COUNT(*) as assessment_count
  FROM skill_assessments sa
  JOIN skills s ON sa.skill_id = s.id
  JOIN practice_members pm ON sa.team_member_id = pm.id
  WHERE pm.practice_id = p_practice_id
    AND (p_category IS NULL OR s.category = p_category)
  GROUP BY s.category, s.name
  ORDER BY s.category, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's percentile ranking (anonymized)
CREATE OR REPLACE FUNCTION get_skill_percentile(
  p_practice_member_id UUID,
  p_skill_id UUID
) RETURNS INT AS $$
DECLARE
  user_level INT;
  total_count INT;
  better_count INT;
BEGIN
  -- Get user's skill level
  SELECT current_level INTO user_level
  FROM skill_assessments
  WHERE team_member_id = p_practice_member_id AND skill_id = p_skill_id;
  
  IF user_level IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Count total assessments for this skill
  SELECT COUNT(*) INTO total_count
  FROM skill_assessments sa
  JOIN practice_members pm ON sa.team_member_id = pm.id
  WHERE sa.skill_id = p_skill_id
    AND pm.practice_id = (SELECT practice_id FROM practice_members WHERE id = p_practice_member_id);
  
  -- Count how many are better
  SELECT COUNT(*) INTO better_count
  FROM skill_assessments sa
  JOIN practice_members pm ON sa.team_member_id = pm.id
  WHERE sa.skill_id = p_skill_id
    AND sa.current_level > user_level
    AND pm.practice_id = (SELECT practice_id FROM practice_members WHERE id = p_practice_member_id);
  
  -- Return percentile (higher is better)
  RETURN 100 - ROUND((better_count::DECIMAL / total_count) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_survey_sessions_updated_at
  BEFORE UPDATE ON survey_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_development_goals_updated_at
  BEFORE UPDATE ON development_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_resources_updated_at
  BEFORE UPDATE ON training_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_enrollments_updated_at
  BEFORE UPDATE ON resource_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Team Portal Setup Complete';
  RAISE NOTICE 'Tables created: survey_sessions, development_goals, training_resources, resource_enrollments, portal_activity_log, team_insights_cache';
  RAISE NOTICE 'RLS policies: Enabled and configured';
  RAISE NOTICE 'Functions: get_team_skill_averages, get_skill_percentile';
  RAISE NOTICE 'Ready for portal launch!';
END $$;

