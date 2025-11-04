-- =====================================================
-- GAMIFICATION SYSTEM - DATABASE SCHEMA
-- Part 1: Core Gamification Tables
-- NON-BREAKING: All new tables, no changes to existing
-- =====================================================

BEGIN;

-- =====================================================
-- ACHIEVEMENT SYSTEM
-- =====================================================

-- Achievement Categories (organize badges by type)
CREATE TABLE IF NOT EXISTS achievement_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE, -- NULL = global/default categories
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Trophy', -- Icon name from lucide-react
  color TEXT DEFAULT '#FFD700', -- Hex color code
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement Definitions (admin-configurable)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE, -- NULL = global/default achievements
  category_id UUID REFERENCES achievement_categories(id) ON DELETE SET NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT DEFAULT 'Award', -- Icon name
  badge_color TEXT DEFAULT '#FFD700', -- Badge color
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')) DEFAULT 'bronze',
  
  -- Trigger Conditions
  trigger_type TEXT NOT NULL, -- 'assessment_complete', 'cpd_hours', 'skill_level', 'streak', 'custom'
  trigger_config JSONB NOT NULL DEFAULT '{}', -- {assessment_type: 'vark', count: 1} or {cpd_hours: 10}
  
  -- Rewards
  points_awarded INTEGER DEFAULT 0,
  reward_message TEXT DEFAULT 'Congratulations! You''ve unlocked a new achievement.',
  
  -- Display & Settings
  is_secret BOOLEAN DEFAULT false, -- Hidden until unlocked
  is_repeatable BOOLEAN DEFAULT false, -- Can be earned multiple times
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Achievements (unlocked badges)
CREATE TABLE IF NOT EXISTS member_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Unlock Details
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress_data JSONB DEFAULT '{}', -- Additional context about how it was earned
  
  -- Recognition
  is_showcased BOOLEAN DEFAULT false, -- Display on profile
  is_viewed BOOLEAN DEFAULT false, -- Has member seen the unlock notification
  
  -- Prevent duplicates (unless repeatable)
  CONSTRAINT unique_member_achievement_unlock UNIQUE(member_id, achievement_id, unlocked_at)
);

-- =====================================================
-- MILESTONES SYSTEM
-- =====================================================

-- Milestones (progress-based goals)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE, -- NULL = global/default milestones
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('assessments', 'cpd', 'skills', 'collaboration', 'leadership', 'general')) DEFAULT 'general',
  
  -- Progress Tracking
  goal_type TEXT NOT NULL CHECK (goal_type IN ('count', 'percentage', 'score', 'streak')),
  goal_target DECIMAL(10,2) NOT NULL, -- Target value (e.g., 40 for 40 CPD hours)
  goal_unit TEXT DEFAULT 'units', -- 'hours', 'assessments', 'skills', 'days'
  
  -- Timeframe
  time_period TEXT CHECK (time_period IN ('annual', 'quarterly', 'monthly', 'weekly', 'lifetime')) DEFAULT 'lifetime',
  start_date DATE,
  end_date DATE,
  
  -- Rewards
  completion_points INTEGER DEFAULT 0,
  completion_badge_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  
  -- Display
  icon TEXT DEFAULT 'Target',
  color TEXT DEFAULT '#3B82F6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Milestone Progress
CREATE TABLE IF NOT EXISTS member_milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  
  -- Progress
  current_value DECIMAL(10,2) DEFAULT 0,
  target_value DECIMAL(10,2) NOT NULL, -- Copy of milestone goal_target for historical tracking
  percentage_complete DECIMAL(5,2) GENERATED ALWAYS AS (
    LEAST(100, (current_value / NULLIF(target_value, 0)) * 100)
  ) STORED,
  
  -- Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired')) DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Tracking
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(member_id, milestone_id)
);

-- =====================================================
-- POINTS & LEADERBOARD SYSTEM
-- =====================================================

-- Member Points (leaderboard & rankings)
CREATE TABLE IF NOT EXISTS member_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE UNIQUE,
  
  -- Points Breakdown
  total_points INTEGER DEFAULT 0,
  assessment_points INTEGER DEFAULT 0,
  cpd_points INTEGER DEFAULT 0,
  skill_points INTEGER DEFAULT 0,
  achievement_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  
  -- Rankings (calculated periodically)
  current_rank INTEGER,
  previous_rank INTEGER,
  
  -- Streaks
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points History (for transparency and audit)
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Transaction
  points_change INTEGER NOT NULL, -- Positive or negative
  points_type TEXT CHECK (points_type IN ('assessment', 'cpd', 'skill', 'achievement', 'bonus', 'admin_adjustment')),
  reason TEXT, -- Description of why points were awarded
  
  -- Reference
  reference_type TEXT, -- 'achievement', 'cpd_activity', 'assessment', 'manual'
  reference_id UUID, -- ID of the related record
  
  -- Metadata
  awarded_by UUID REFERENCES practice_members(id) ON DELETE SET NULL, -- For manual awards
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADMIN CONFIGURATION
-- =====================================================

-- Reward Rules (auto-award configuration)
CREATE TABLE IF NOT EXISTS reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE, -- NULL = global rules
  
  -- Rule Definition
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'assessment_complete', 'cpd_log', 'skill_improve', 'streak', 'login'
  event_config JSONB DEFAULT '{}', -- Specific conditions
  
  -- Rewards
  points_awarded INTEGER DEFAULT 0,
  auto_award_achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_achievement_categories_practice ON achievement_categories(practice_id);
CREATE INDEX IF NOT EXISTS idx_achievements_practice ON achievements(practice_id);
CREATE INDEX IF NOT EXISTS idx_achievements_trigger_type ON achievements(trigger_type);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_member_achievements_member ON member_achievements(member_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_achievement ON member_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_viewed ON member_achievements(is_viewed);
CREATE INDEX IF NOT EXISTS idx_milestones_practice ON milestones(practice_id);
CREATE INDEX IF NOT EXISTS idx_milestones_active ON milestones(is_active);
CREATE INDEX IF NOT EXISTS idx_member_milestone_progress_member ON member_milestone_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_member_milestone_progress_status ON member_milestone_progress(status);
CREATE INDEX IF NOT EXISTS idx_member_points_member ON member_points(member_id);
CREATE INDEX IF NOT EXISTS idx_member_points_rank ON member_points(current_rank);
CREATE INDEX IF NOT EXISTS idx_points_history_member ON points_history(member_id);
CREATE INDEX IF NOT EXISTS idx_points_history_awarded_at ON points_history(awarded_at);
CREATE INDEX IF NOT EXISTS idx_reward_rules_practice ON reward_rules(practice_id);
CREATE INDEX IF NOT EXISTS idx_reward_rules_active ON reward_rules(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE achievement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, only admins can write

-- Achievement Categories
DROP POLICY IF EXISTS "Allow read access to achievement_categories" ON achievement_categories;
CREATE POLICY "Allow read access to achievement_categories" ON achievement_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert achievement_categories" ON achievement_categories;
CREATE POLICY "Allow insert achievement_categories" ON achievement_categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin write access to achievement_categories" ON achievement_categories;
CREATE POLICY "Allow admin write access to achievement_categories" ON achievement_categories 
FOR UPDATE USING (
  practice_id IS NULL OR  -- Allow global categories
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

DROP POLICY IF EXISTS "Allow admin delete access to achievement_categories" ON achievement_categories;
CREATE POLICY "Allow admin delete access to achievement_categories" ON achievement_categories 
FOR DELETE USING (
  practice_id IS NULL OR
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

-- Achievements
DROP POLICY IF EXISTS "Allow read access to achievements" ON achievements;
CREATE POLICY "Allow read access to achievements" ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert achievements" ON achievements;
CREATE POLICY "Allow insert achievements" ON achievements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin write access to achievements" ON achievements;
CREATE POLICY "Allow admin write access to achievements" ON achievements 
FOR UPDATE USING (
  practice_id IS NULL OR  -- Allow global achievements
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

DROP POLICY IF EXISTS "Allow admin delete access to achievements" ON achievements;
CREATE POLICY "Allow admin delete access to achievements" ON achievements 
FOR DELETE USING (
  practice_id IS NULL OR
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

-- Member Achievements
DROP POLICY IF EXISTS "Allow members to view their achievements" ON member_achievements;
CREATE POLICY "Allow members to view their achievements" ON member_achievements FOR SELECT USING (
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

DROP POLICY IF EXISTS "Allow system to insert achievements" ON member_achievements;
CREATE POLICY "Allow system to insert achievements" ON member_achievements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to update their achievements" ON member_achievements;
CREATE POLICY "Allow members to update their achievements" ON member_achievements FOR UPDATE USING (
  member_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
);

-- Milestones
DROP POLICY IF EXISTS "Allow read access to milestones" ON milestones;
CREATE POLICY "Allow read access to milestones" ON milestones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert milestones" ON milestones;
CREATE POLICY "Allow insert milestones" ON milestones FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin write access to milestones" ON milestones;
CREATE POLICY "Allow admin write access to milestones" ON milestones 
FOR UPDATE USING (
  practice_id IS NULL OR  -- Allow global milestones
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

DROP POLICY IF EXISTS "Allow admin delete access to milestones" ON milestones;
CREATE POLICY "Allow admin delete access to milestones" ON milestones 
FOR DELETE USING (
  practice_id IS NULL OR
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

-- Member Milestone Progress
DROP POLICY IF EXISTS "Allow members to view their milestone progress" ON member_milestone_progress;
CREATE POLICY "Allow members to view their milestone progress" ON member_milestone_progress FOR SELECT USING (
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

DROP POLICY IF EXISTS "Allow system to manage milestone progress" ON member_milestone_progress;
CREATE POLICY "Allow system to manage milestone progress" ON member_milestone_progress FOR ALL WITH CHECK (true);

-- Member Points
DROP POLICY IF EXISTS "Allow members to view points" ON member_points;
CREATE POLICY "Allow members to view points" ON member_points FOR SELECT USING (true); -- Leaderboard visible to all

DROP POLICY IF EXISTS "Allow system to manage points" ON member_points;
CREATE POLICY "Allow system to manage points" ON member_points FOR ALL WITH CHECK (true);

-- Points History
DROP POLICY IF EXISTS "Allow members to view their points history" ON points_history;
CREATE POLICY "Allow members to view their points history" ON points_history FOR SELECT USING (
  member_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  OR
  member_id IN (
    SELECT pm.id FROM practice_members pm
    WHERE pm.practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
    )
  )
);

DROP POLICY IF EXISTS "Allow system to insert points history" ON points_history;
CREATE POLICY "Allow system to insert points history" ON points_history FOR INSERT WITH CHECK (true);

-- Reward Rules
DROP POLICY IF EXISTS "Allow read access to reward_rules" ON reward_rules;
CREATE POLICY "Allow read access to reward_rules" ON reward_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert reward_rules" ON reward_rules;
CREATE POLICY "Allow insert reward_rules" ON reward_rules FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin write access to reward_rules" ON reward_rules;
CREATE POLICY "Allow admin write access to reward_rules" ON reward_rules 
FOR UPDATE USING (
  practice_id IS NULL OR  -- Allow global rules
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

DROP POLICY IF EXISTS "Allow admin delete access to reward_rules" ON reward_rules;
CREATE POLICY "Allow admin delete access to reward_rules" ON reward_rules 
FOR DELETE USING (
  practice_id IS NULL OR
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('Partner', 'Director')
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_achievement_categories_updated_at ON achievement_categories;
CREATE TRIGGER update_achievement_categories_updated_at BEFORE UPDATE ON achievement_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_points_updated_at ON member_points;
CREATE TRIGGER update_member_points_updated_at BEFORE UPDATE ON member_points
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reward_rules_updated_at ON reward_rules;
CREATE TRIGGER update_reward_rules_updated_at BEFORE UPDATE ON reward_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE achievement_categories IS 'Categories for organizing achievements (e.g., Assessments, CPD, Skills)';
COMMENT ON TABLE achievements IS 'Admin-configurable achievement definitions with trigger conditions';
COMMENT ON TABLE member_achievements IS 'Tracks which achievements each member has unlocked';
COMMENT ON TABLE milestones IS 'Progress-based goals (e.g., Complete 40 CPD hours this year)';
COMMENT ON TABLE member_milestone_progress IS 'Individual progress tracking for each milestone';
COMMENT ON TABLE member_points IS 'Leaderboard and points tracking per member';
COMMENT ON TABLE points_history IS 'Audit trail of all points awarded and deducted';
COMMENT ON TABLE reward_rules IS 'Automated rules for awarding points and achievements';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Gamification tables created successfully';
  RAISE NOTICE '📊 Tables: achievement_categories, achievements, member_achievements';
  RAISE NOTICE '🎯 Tables: milestones, member_milestone_progress';
  RAISE NOTICE '🏆 Tables: member_points, points_history, reward_rules';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Next: Run seed script to populate default achievements';
END $$;

