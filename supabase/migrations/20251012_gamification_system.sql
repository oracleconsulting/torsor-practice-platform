-- Gamification & Engagement System
-- Date: 2025-10-12
-- PROMPT 9 Implementation

-- Table: achievements
-- Define all available achievement badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Achievement details
  achievement_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'assessment', 'learning', 'mentoring', 'cpd', 'mastery', 'collaboration'
  )),
  
  -- Visual
  icon VARCHAR(50), -- emoji or icon name
  color VARCHAR(20),
  
  -- Requirements
  criteria_type VARCHAR(50) NOT NULL,
  criteria_value JSONB,
  
  -- Rewards
  points_value INTEGER DEFAULT 0,
  
  -- Rarity
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  )),
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_achievements
-- Track which achievements users have earned
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Earned details
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_awarded INTEGER DEFAULT 0,
  
  -- Context
  earned_for_action TEXT, -- What triggered it
  earned_context JSONB, -- Additional data
  
  -- Sharing
  shared_publicly BOOLEAN DEFAULT false,
  shared_at TIMESTAMP,
  
  UNIQUE(member_id, achievement_id)
);

-- Table: points_ledger
-- Track all points earned/spent
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(50) CHECK (transaction_type IN (
    'earned', 'spent', 'bonus', 'adjustment'
  )),
  points_amount INTEGER NOT NULL,
  
  -- Source
  source_type VARCHAR(50) CHECK (source_type IN (
    'assessment', 'skill_improvement', 'cpd_completion', 'mentoring',
    'achievement', 'streak_bonus', 'manual'
  )),
  source_id UUID, -- Reference to the source record
  
  -- Description
  description TEXT,
  
  -- Multipliers
  base_points INTEGER,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Running balance
  balance_after INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: member_stats
-- Aggregate statistics per member
CREATE TABLE IF NOT EXISTS member_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID UNIQUE NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Points
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0, -- After spending
  lifetime_points INTEGER DEFAULT 0,
  
  -- Achievements
  total_achievements INTEGER DEFAULT 0,
  rare_achievements INTEGER DEFAULT 0,
  epic_achievements INTEGER DEFAULT 0,
  legendary_achievements INTEGER DEFAULT 0,
  
  -- Streaks
  current_assessment_streak INTEGER DEFAULT 0,
  longest_assessment_streak INTEGER DEFAULT 0,
  current_cpd_streak INTEGER DEFAULT 0,
  longest_cpd_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Activity counts
  assessments_completed INTEGER DEFAULT 0,
  skills_improved INTEGER DEFAULT 0,
  cpd_activities_completed INTEGER DEFAULT 0,
  mentoring_sessions_completed INTEGER DEFAULT 0,
  colleagues_helped INTEGER DEFAULT 0,
  
  -- Rankings
  rank_in_practice INTEGER,
  rank_in_department INTEGER,
  
  -- Last updates
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: leaderboards
-- Calculated leaderboard data
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Period
  leaderboard_type VARCHAR(50) CHECK (leaderboard_type IN (
    'monthly_improvement', 'department_competition', 'mentor_of_month', 
    'most_improved', 'top_points', 'streak_leaders'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Rankings (top 10)
  rankings JSONB NOT NULL,
  
  -- Stats
  total_participants INTEGER DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(practice_id, leaderboard_type, period_start)
);

-- Table: streak_history
-- Track daily activity for streaks
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Date
  activity_date DATE NOT NULL,
  
  -- Activity flags
  had_assessment BOOLEAN DEFAULT false,
  had_cpd_activity BOOLEAN DEFAULT false,
  had_mentoring_session BOOLEAN DEFAULT false,
  had_skill_improvement BOOLEAN DEFAULT false,
  
  -- Points earned that day
  points_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(member_id, activity_date)
);

-- Table: achievement_notifications
-- Queue for sending notifications
CREATE TABLE IF NOT EXISTS achievement_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(50) CHECK (notification_type IN (
    'email', 'slack', 'in_app', 'push'
  )),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'failed'
  )),
  
  -- Timing
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Content
  subject VARCHAR(200),
  message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_member ON user_achievements(member_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at);

CREATE INDEX IF NOT EXISTS idx_points_ledger_member ON points_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_practice ON points_ledger(practice_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created ON points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_source ON points_ledger(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_member_stats_member ON member_stats(member_id);
CREATE INDEX IF NOT EXISTS idx_member_stats_practice ON member_stats(practice_id);
CREATE INDEX IF NOT EXISTS idx_member_stats_points ON member_stats(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_practice ON leaderboards(practice_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_streak_history_member ON streak_history(member_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_date ON streak_history(activity_date);

-- Triggers
CREATE TRIGGER update_member_stats_updated_at
  BEFORE UPDATE ON member_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Update member stats when points are added
CREATE OR REPLACE FUNCTION update_member_stats_on_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create member stats
  INSERT INTO member_stats (
    member_id,
    practice_id,
    total_points,
    available_points,
    lifetime_points,
    balance_after
  )
  VALUES (
    NEW.member_id,
    NEW.practice_id,
    NEW.points_amount,
    NEW.points_amount,
    NEW.points_amount,
    NEW.points_amount
  )
  ON CONFLICT (member_id) DO UPDATE SET
    total_points = member_stats.total_points + NEW.points_amount,
    available_points = CASE 
      WHEN NEW.transaction_type = 'spent' THEN member_stats.available_points - NEW.points_amount
      ELSE member_stats.available_points + NEW.points_amount
    END,
    lifetime_points = member_stats.lifetime_points + CASE 
      WHEN NEW.transaction_type IN ('earned', 'bonus') THEN NEW.points_amount
      ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP;
  
  -- Update the new balance_after
  NEW.balance_after := (
    SELECT available_points 
    FROM member_stats 
    WHERE member_id = NEW.member_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_member_stats
  BEFORE INSERT ON points_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_member_stats_on_points();

-- Function: Check for achievement eligibility
CREATE OR REPLACE FUNCTION check_achievement_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  achievement_rec RECORD;
  stats_rec RECORD;
BEGIN
  -- Get member stats
  SELECT * INTO stats_rec FROM member_stats WHERE member_id = NEW.member_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Check each achievement type
  FOR achievement_rec IN 
    SELECT * FROM achievements WHERE is_active = true
  LOOP
    -- Skip if already earned
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE member_id = NEW.member_id AND achievement_id = achievement_rec.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria
    CASE achievement_rec.achievement_code
      WHEN 'first_assessment' THEN
        IF stats_rec.assessments_completed >= 1 THEN
          INSERT INTO user_achievements (member_id, achievement_id, points_awarded, earned_for_action)
          VALUES (NEW.member_id, achievement_rec.id, achievement_rec.points_value, 'Completed first assessment')
          ON CONFLICT (member_id, achievement_id) DO NOTHING;
        END IF;
      
      WHEN 'quick_learner' THEN
        IF stats_rec.skills_improved >= 5 THEN
          INSERT INTO user_achievements (member_id, achievement_id, points_awarded, earned_for_action)
          VALUES (NEW.member_id, achievement_rec.id, achievement_rec.points_value, 'Improved 5 skills in a month')
          ON CONFLICT (member_id, achievement_id) DO NOTHING;
        END IF;
      
      WHEN 'mentor_champion' THEN
        IF stats_rec.mentoring_sessions_completed >= 10 THEN
          INSERT INTO user_achievements (member_id, achievement_id, points_awarded, earned_for_action)
          VALUES (NEW.member_id, achievement_rec.id, achievement_rec.points_value, 'Completed 10 mentoring sessions')
          ON CONFLICT (member_id, achievement_id) DO NOTHING;
        END IF;
      
      WHEN 'cpd_star' THEN
        IF stats_rec.current_cpd_streak >= 3 THEN
          INSERT INTO user_achievements (member_id, achievement_id, points_awarded, earned_for_action)
          VALUES (NEW.member_id, achievement_rec.id, achievement_rec.points_value, 'Hit CPD target 3 months in a row')
          ON CONFLICT (member_id, achievement_id) DO NOTHING;
        END IF;
      
      WHEN 'team_player' THEN
        IF stats_rec.colleagues_helped >= 3 THEN
          INSERT INTO user_achievements (member_id, achievement_id, points_awarded, earned_for_action)
          VALUES (NEW.member_id, achievement_rec.id, achievement_rec.points_value, 'Helped 3 colleagues improve skills')
          ON CONFLICT (member_id, achievement_id) DO NOTHING;
        END IF;
      
      ELSE
        -- Skip unknown achievement types
        CONTINUE;
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_check_achievements
  AFTER INSERT OR UPDATE ON member_stats
  FOR EACH ROW
  EXECUTE FUNCTION check_achievement_eligibility();

-- Insert default achievements
INSERT INTO achievements (achievement_code, name, description, category, icon, color, criteria_type, points_value, rarity, display_order) VALUES
('first_assessment', 'First Assessment', 'Complete your initial skills assessment', 'assessment', '🎯', 'blue', 'count', 50, 'common', 1),
('quick_learner', 'Quick Learner', 'Improve 5 skills within a month', 'learning', '⚡', 'yellow', 'count', 100, 'uncommon', 2),
('mentor_champion', 'Mentor Champion', 'Complete 10 mentoring sessions', 'mentoring', '🏆', 'purple', 'count', 200, 'rare', 3),
('cpd_star', 'CPD Star', 'Hit CPD target 3 months in a row', 'cpd', '⭐', 'orange', 'streak', 150, 'rare', 4),
('skills_master', 'Skills Master', 'Achieve Level 5 in any skill', 'mastery', '👑', 'gold', 'level', 300, 'epic', 5),
('team_player', 'Team Player', 'Help 3 colleagues improve their skills', 'collaboration', '🤝', 'green', 'count', 100, 'uncommon', 6),
('streak_warrior', '7 Day Streak', 'Complete activities 7 days in a row', 'learning', '🔥', 'red', 'streak', 75, 'uncommon', 7),
('improvement_hero', 'Improvement Hero', 'Increase average skill level by 1.0', 'learning', '📈', 'blue', 'improvement', 125, 'rare', 8),
('perfect_attendance', 'Perfect Attendance', 'Complete all assessments on time', 'assessment', '✅', 'green', 'completion', 100, 'uncommon', 9),
('knowledge_seeker', 'Knowledge Seeker', 'Complete 50 CPD hours', 'cpd', '📚', 'blue', 'count', 200, 'rare', 10)
ON CONFLICT (achievement_code) DO NOTHING;

-- View: Leaderboard summary
CREATE OR REPLACE VIEW leaderboard_summary AS
SELECT 
  ms.member_id,
  pm.name as member_name,
  pm.email,
  ms.practice_id,
  ms.total_points,
  ms.total_achievements,
  ms.current_assessment_streak,
  ms.rank_in_practice,
  ms.skills_improved,
  ms.cpd_activities_completed,
  COUNT(ua.id) as achievements_count,
  COALESCE(SUM(a.points_value), 0) as achievement_points
FROM member_stats ms
JOIN practice_members pm ON ms.member_id = pm.id
LEFT JOIN user_achievements ua ON ms.member_id = ua.member_id
LEFT JOIN achievements a ON ua.achievement_id = a.id
GROUP BY 
  ms.member_id, pm.name, pm.email, ms.practice_id, 
  ms.total_points, ms.total_achievements, ms.current_assessment_streak,
  ms.rank_in_practice, ms.skills_improved, ms.cpd_activities_completed;

-- Comments
COMMENT ON TABLE achievements IS 'Defines all available achievement badges';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has earned';
COMMENT ON TABLE points_ledger IS 'Complete history of all points earned and spent';
COMMENT ON TABLE member_stats IS 'Aggregated statistics per member for quick access';
COMMENT ON TABLE leaderboards IS 'Pre-calculated leaderboard rankings';
COMMENT ON TABLE streak_history IS 'Daily activity tracking for streak calculations';

