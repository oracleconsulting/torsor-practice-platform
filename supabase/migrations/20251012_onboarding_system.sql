-- Onboarding Checklist System
-- Date: 2025-10-12
-- PROMPT 6 Implementation

-- Table: onboarding_progress
-- Tracks each member's progress through onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Overall progress
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'paused', 'completed', 'skipped'
  )),
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  total_steps INTEGER DEFAULT 7,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion_date DATE,
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- Gamification
  total_points INTEGER DEFAULT 0,
  badges_earned TEXT[], -- Array of badge IDs
  completion_speed VARCHAR(20), -- 'fast', 'average', 'slow'
  
  -- Individual step completion
  step_1_profile_completed BOOLEAN DEFAULT false,
  step_1_completed_at TIMESTAMP,
  step_1_time_minutes INTEGER,
  step_1_points INTEGER DEFAULT 0,
  
  step_2_skills_assessment_completed BOOLEAN DEFAULT false,
  step_2_completed_at TIMESTAMP,
  step_2_time_minutes INTEGER,
  step_2_points INTEGER DEFAULT 0,
  
  step_3_vark_assessment_completed BOOLEAN DEFAULT false,
  step_3_completed_at TIMESTAMP,
  step_3_time_minutes INTEGER,
  step_3_points INTEGER DEFAULT 0,
  
  step_4_cpd_review_completed BOOLEAN DEFAULT false,
  step_4_completed_at TIMESTAMP,
  step_4_time_minutes INTEGER,
  step_4_points INTEGER DEFAULT 0,
  
  step_5_mentor_assignment_completed BOOLEAN DEFAULT false,
  step_5_completed_at TIMESTAMP,
  step_5_time_minutes INTEGER,
  step_5_points INTEGER DEFAULT 0,
  step_5_mentor_id UUID REFERENCES practice_members(id),
  
  step_6_dev_plan_completed BOOLEAN DEFAULT false,
  step_6_completed_at TIMESTAMP,
  step_6_time_minutes INTEGER,
  step_6_points INTEGER DEFAULT 0,
  
  step_7_team_intro_completed BOOLEAN DEFAULT false,
  step_7_completed_at TIMESTAMP,
  step_7_time_minutes INTEGER,
  step_7_points INTEGER DEFAULT 0,
  
  -- Checkpoint data (JSON for resume capability)
  checkpoint_data JSONB DEFAULT '{}'::jsonb,
  
  -- Reminders
  last_reminder_sent TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(member_id, practice_id)
);

-- Table: onboarding_badges
-- Define available badges
CREATE TABLE IF NOT EXISTS onboarding_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Badge details
  badge_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  color VARCHAR(20),
  
  -- Criteria
  criteria_type VARCHAR(50) CHECK (criteria_type IN (
    'completion_time', 'all_steps_complete', 'perfect_score', 
    'early_bird', 'speed_demon', 'thorough_reviewer', 'team_connector'
  )),
  criteria_value JSONB, -- Flexible criteria definition
  
  -- Points
  points_value INTEGER DEFAULT 0,
  
  -- Rarity
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  )),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: onboarding_member_badges
-- Track which badges members have earned
CREATE TABLE IF NOT EXISTS onboarding_member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES onboarding_badges(id) ON DELETE CASCADE,
  onboarding_progress_id UUID REFERENCES onboarding_progress(id) ON DELETE CASCADE,
  
  -- Earn details
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_awarded INTEGER DEFAULT 0,
  
  -- Context
  earned_for_step INTEGER,
  earned_reason TEXT,
  
  UNIQUE(member_id, badge_id)
);

-- Table: onboarding_leaderboard
-- Track top performers
CREATE TABLE IF NOT EXISTS onboarding_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Period
  period_type VARCHAR(20) CHECK (period_type IN ('all_time', 'monthly', 'quarterly')),
  period_start DATE,
  period_end DATE,
  
  -- Rankings (top 10)
  rankings JSONB NOT NULL, -- Array of {member_id, rank, points, completion_time}
  
  -- Stats
  total_participants INTEGER DEFAULT 0,
  average_completion_time_minutes INTEGER,
  fastest_completion_minutes INTEGER,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(practice_id, period_type, period_start)
);

-- Table: onboarding_reminders
-- Automated reminder system
CREATE TABLE IF NOT EXISTS onboarding_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  onboarding_progress_id UUID NOT NULL REFERENCES onboarding_progress(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type VARCHAR(50) CHECK (reminder_type IN (
    'welcome', 'inactive_3_days', 'inactive_7_days', 'stuck_on_step', 'almost_done', 'congratulations'
  )),
  
  -- Timing
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'failed', 'cancelled'
  )),
  
  -- Content
  subject VARCHAR(200),
  message TEXT,
  cta_text VARCHAR(100),
  cta_link TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: onboarding_completion_certificates
-- Generated completion certificates
CREATE TABLE IF NOT EXISTS onboarding_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  onboarding_progress_id UUID NOT NULL REFERENCES onboarding_progress(id) ON DELETE CASCADE,
  
  -- Certificate details
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Content
  member_name VARCHAR(200) NOT NULL,
  practice_name VARCHAR(200) NOT NULL,
  completion_date DATE NOT NULL,
  total_points INTEGER NOT NULL,
  badges_earned TEXT[],
  completion_time_hours DECIMAL(5,2),
  
  -- File
  certificate_url TEXT,
  certificate_pdf_path TEXT,
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(member_id, onboarding_progress_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_member ON onboarding_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_practice ON onboarding_progress(practice_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON onboarding_progress(current_step);

CREATE INDEX IF NOT EXISTS idx_onboarding_member_badges_member ON onboarding_member_badges(member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_member_badges_badge ON onboarding_member_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminders_member ON onboarding_reminders(member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminders_scheduled ON onboarding_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_onboarding_reminders_status ON onboarding_reminders(status);

-- Triggers
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_onboarding_completion()
RETURNS TRIGGER AS $$
DECLARE
  completed_steps INTEGER := 0;
  total_pts INTEGER := 0;
BEGIN
  -- Count completed steps
  IF NEW.step_1_profile_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_2_skills_assessment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_3_vark_assessment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_4_cpd_review_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_5_mentor_assignment_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_6_dev_plan_completed THEN completed_steps := completed_steps + 1; END IF;
  IF NEW.step_7_team_intro_completed THEN completed_steps := completed_steps + 1; END IF;
  
  -- Calculate percentage
  NEW.completion_percentage := (completed_steps * 100) / NEW.total_steps;
  
  -- Sum points
  total_pts := COALESCE(NEW.step_1_points, 0) + 
               COALESCE(NEW.step_2_points, 0) + 
               COALESCE(NEW.step_3_points, 0) + 
               COALESCE(NEW.step_4_points, 0) + 
               COALESCE(NEW.step_5_points, 0) + 
               COALESCE(NEW.step_6_points, 0) + 
               COALESCE(NEW.step_7_points, 0);
  NEW.total_points := total_pts;
  
  -- Update status
  IF completed_steps = 0 AND NEW.status = 'not_started' THEN
    NEW.status := 'not_started';
  ELSIF completed_steps > 0 AND completed_steps < NEW.total_steps THEN
    NEW.status := 'in_progress';
    IF NEW.started_at IS NULL THEN
      NEW.started_at := CURRENT_TIMESTAMP;
    END IF;
  ELSIF completed_steps = NEW.total_steps THEN
    NEW.status := 'completed';
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_completion
  BEFORE INSERT OR UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION calculate_onboarding_completion();

-- Function: Check for badge eligibility
CREATE OR REPLACE FUNCTION check_badge_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  badge_rec RECORD;
  completion_time_hours DECIMAL;
BEGIN
  -- Only check when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Calculate completion time
    completion_time_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 3600;
    
    -- Speed Demon badge (< 2 hours)
    IF completion_time_hours < 2 THEN
      INSERT INTO onboarding_member_badges (member_id, badge_id, onboarding_progress_id, points_awarded, earned_reason)
      SELECT NEW.member_id, id, NEW.id, points_value, 'Completed in under 2 hours'
      FROM onboarding_badges
      WHERE badge_code = 'speed_demon' AND is_active = true
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;
    
    -- Early Bird badge (< 24 hours from start)
    IF completion_time_hours < 24 THEN
      INSERT INTO onboarding_member_badges (member_id, badge_id, onboarding_progress_id, points_awarded, earned_reason)
      SELECT NEW.member_id, id, NEW.id, points_value, 'Completed within 24 hours'
      FROM onboarding_badges
      WHERE badge_code = 'early_bird' AND is_active = true
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;
    
    -- All Steps Complete badge
    INSERT INTO onboarding_member_badges (member_id, badge_id, onboarding_progress_id, points_awarded, earned_reason)
    SELECT NEW.member_id, id, NEW.id, points_value, 'Completed all onboarding steps'
    FROM onboarding_badges
    WHERE badge_code = 'all_steps_complete' AND is_active = true
    ON CONFLICT (member_id, badge_id) DO NOTHING;
    
    -- Perfect Score badge (if all step points are max)
    IF NEW.total_points >= 700 THEN -- Assuming 100 points per step
      INSERT INTO onboarding_member_badges (member_id, badge_id, onboarding_progress_id, points_awarded, earned_reason)
      SELECT NEW.member_id, id, NEW.id, points_value, 'Perfect score achieved'
      FROM onboarding_badges
      WHERE badge_code = 'perfect_score' AND is_active = true
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_award_badges
  AFTER UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION check_badge_eligibility();

-- View: onboarding_admin_dashboard
CREATE OR REPLACE VIEW onboarding_admin_dashboard AS
SELECT 
  p.id as practice_id,
  p.name as practice_name,
  
  -- Overall stats
  COUNT(DISTINCT op.member_id) as total_members,
  COUNT(DISTINCT CASE WHEN op.status = 'completed' THEN op.member_id END) as completed_count,
  COUNT(DISTINCT CASE WHEN op.status = 'in_progress' THEN op.member_id END) as in_progress_count,
  COUNT(DISTINCT CASE WHEN op.status = 'not_started' THEN op.member_id END) as not_started_count,
  
  -- Completion rate
  CASE 
    WHEN COUNT(DISTINCT op.member_id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN op.status = 'completed' THEN op.member_id END) * 100.0 / COUNT(DISTINCT op.member_id))
    ELSE 0 
  END as completion_rate,
  
  -- Average metrics
  AVG(op.completion_percentage) as avg_completion_percentage,
  AVG(op.time_spent_minutes) as avg_time_minutes,
  AVG(op.total_points) as avg_points,
  
  -- Step completion rates
  (COUNT(CASE WHEN op.step_1_profile_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_1_completion_rate,
  (COUNT(CASE WHEN op.step_2_skills_assessment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_2_completion_rate,
  (COUNT(CASE WHEN op.step_3_vark_assessment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_3_completion_rate,
  (COUNT(CASE WHEN op.step_4_cpd_review_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_4_completion_rate,
  (COUNT(CASE WHEN op.step_5_mentor_assignment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_5_completion_rate,
  (COUNT(CASE WHEN op.step_6_dev_plan_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_6_completion_rate,
  (COUNT(CASE WHEN op.step_7_team_intro_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as step_7_completion_rate,
  
  -- Stuck points (lowest completion rate)
  CASE 
    WHEN (COUNT(CASE WHEN op.step_1_profile_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) < 
         ALL(ARRAY[
           (COUNT(CASE WHEN op.step_2_skills_assessment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
           (COUNT(CASE WHEN op.step_3_vark_assessment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
           (COUNT(CASE WHEN op.step_4_cpd_review_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
           (COUNT(CASE WHEN op.step_5_mentor_assignment_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
           (COUNT(CASE WHEN op.step_6_dev_plan_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)),
           (COUNT(CASE WHEN op.step_7_team_intro_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))
         ]) 
    THEN 'Step 1: Profile'
    ELSE 'Other steps'
  END as most_stuck_step

FROM practices p
LEFT JOIN onboarding_progress op ON p.id = op.practice_id
GROUP BY p.id, p.name;

-- Insert default badges
INSERT INTO onboarding_badges (badge_code, name, description, icon, color, criteria_type, points_value, rarity) VALUES
('speed_demon', 'Speed Demon', 'Completed onboarding in under 2 hours', '⚡', 'purple', 'completion_time', 100, 'epic'),
('early_bird', 'Early Bird', 'Completed within 24 hours of starting', '🌅', 'orange', 'early_bird', 50, 'uncommon'),
('all_steps_complete', 'Onboarding Champion', 'Completed all onboarding steps', '🏆', 'gold', 'all_steps_complete', 100, 'rare'),
('perfect_score', 'Perfect Score', 'Achieved maximum points', '⭐', 'yellow', 'perfect_score', 150, 'legendary'),
('thorough_reviewer', 'Thorough Reviewer', 'Spent quality time on each step', '📚', 'blue', 'thorough_reviewer', 75, 'rare'),
('team_connector', 'Team Connector', 'Engaged with all team members', '🤝', 'green', 'team_connector', 50, 'common')
ON CONFLICT (badge_code) DO NOTHING;

-- Comments
COMMENT ON TABLE onboarding_progress IS 'Tracks each member''s progress through the 7-step onboarding process';
COMMENT ON TABLE onboarding_badges IS 'Defines available badges that can be earned during onboarding';
COMMENT ON TABLE onboarding_member_badges IS 'Records which badges members have earned';
COMMENT ON TABLE onboarding_leaderboard IS 'Leaderboard rankings for gamification';
COMMENT ON TABLE onboarding_reminders IS 'Automated reminder system for inactive users';
COMMENT ON TABLE onboarding_completion_certificates IS 'Generated certificates upon completion';

