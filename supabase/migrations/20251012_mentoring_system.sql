-- Automated Mentor-Mentee Matching System
-- Date: 2025-10-12
-- PROMPT 4 Implementation

-- Create mentoring_relationships table
CREATE TABLE IF NOT EXISTS mentoring_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  mentor_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Relationship details
  matched_skills TEXT[] NOT NULL, -- Array of skill names
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  vark_compatibility INTEGER CHECK (vark_compatibility BETWEEN 0 AND 100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'paused', 'completed', 'cancelled'
  )),
  
  -- Agreement
  agreement_signed BOOLEAN DEFAULT false,
  agreement_signed_at TIMESTAMP,
  agreement_template_id UUID,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  expected_duration_months INTEGER DEFAULT 6,
  
  -- Goals
  primary_goals TEXT[],
  success_criteria TEXT[],
  
  -- Notifications
  last_reminder_sent TIMESTAMP,
  reminder_frequency VARCHAR(20) DEFAULT 'weekly',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(mentor_id, mentee_id),
  CHECK (mentor_id != mentee_id)
);

-- Create mentoring_sessions table
CREATE TABLE IF NOT EXISTS mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  
  -- Session details
  session_number INTEGER,
  scheduled_date TIMESTAMP NOT NULL,
  actual_date TIMESTAMP,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Location/format
  location VARCHAR(200),
  format VARCHAR(50) DEFAULT 'in-person' CHECK (format IN (
    'in-person', 'video-call', 'phone', 'async'
  )),
  meeting_link TEXT,
  
  -- Content
  agenda TEXT,
  notes TEXT,
  mentee_notes TEXT, -- Private notes for mentee
  mentor_notes TEXT, -- Private notes for mentor
  
  -- Outcomes
  key_takeaways TEXT[],
  action_items TEXT[],
  next_session_topics TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'completed', 'cancelled', 'no-show'
  )),
  cancellation_reason TEXT,
  
  -- Ratings
  mentee_rating INTEGER CHECK (mentee_rating BETWEEN 1 AND 5),
  mentor_rating INTEGER CHECK (mentor_rating BETWEEN 1 AND 5),
  
  -- CPD tracking
  cpd_hours DECIMAL(3,1),
  cpd_category VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mentoring_goals table
CREATE TABLE IF NOT EXISTS mentoring_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  
  -- Goal details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  skill_name VARCHAR(100),
  skill_id UUID, -- Reference to skills table
  
  -- Target
  current_level INTEGER CHECK (current_level BETWEEN 0 AND 5),
  target_level INTEGER CHECK (target_level BETWEEN 0 AND 5),
  target_date DATE,
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  status VARCHAR(50) DEFAULT 'in-progress' CHECK (status IN (
    'not-started', 'in-progress', 'completed', 'abandoned', 'achieved'
  )),
  
  -- Milestones
  milestones JSONB, -- Array of milestone objects
  completed_milestones INTEGER DEFAULT 0,
  total_milestones INTEGER,
  
  -- Measurement
  success_criteria TEXT[],
  evidence_of_progress TEXT,
  assessment_method VARCHAR(100),
  
  -- Dates
  started_at DATE,
  completed_at DATE,
  last_reviewed_at DATE,
  
  -- Notes
  notes TEXT,
  celebration_message TEXT, -- For goal achievement emails
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mentoring_feedback table
CREATE TABLE IF NOT EXISTS mentoring_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  session_id UUID REFERENCES mentoring_sessions(id) ON DELETE SET NULL,
  
  -- Feedback provider
  provider_role VARCHAR(20) CHECK (provider_role IN ('mentor', 'mentee')),
  provider_id UUID REFERENCES practice_members(id),
  
  -- Ratings
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
  goal_progress_rating INTEGER CHECK (goal_progress_rating BETWEEN 1 AND 5),
  
  -- Qualitative feedback
  what_went_well TEXT,
  areas_for_improvement TEXT,
  suggestions TEXT,
  
  -- Follow-up
  would_recommend BOOLEAN,
  wants_to_continue BOOLEAN,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mentoring_notifications table
CREATE TABLE IF NOT EXISTS mentoring_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'match_created', 'session_reminder', 'goal_achieved', 
    'progress_update', 'feedback_request', 'relationship_ended'
  )),
  
  -- Recipients
  recipient_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255),
  
  -- Related entities
  relationship_id UUID REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  session_id UUID REFERENCES mentoring_sessions(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES mentoring_goals(id) ON DELETE SET NULL,
  
  -- Content
  subject VARCHAR(200),
  message TEXT,
  cta_text VARCHAR(100), -- Call-to-action button text
  cta_link TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'failed', 'bounced'
  )),
  sent_at TIMESTAMP,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agreement_templates table
CREATE TABLE IF NOT EXISTS mentoring_agreement_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id),
  
  -- Template details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL, -- Markdown or HTML
  
  -- Variables that can be replaced
  variables JSONB, -- {mentor_name, mentee_name, skills, etc.}
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_mentoring_relationships_mentor ON mentoring_relationships(mentor_id);
CREATE INDEX idx_mentoring_relationships_mentee ON mentoring_relationships(mentee_id);
CREATE INDEX idx_mentoring_relationships_status ON mentoring_relationships(status);
CREATE INDEX idx_mentoring_relationships_dates ON mentoring_relationships(start_date, end_date);

CREATE INDEX idx_mentoring_sessions_relationship ON mentoring_sessions(relationship_id);
CREATE INDEX idx_mentoring_sessions_date ON mentoring_sessions(scheduled_date);
CREATE INDEX idx_mentoring_sessions_status ON mentoring_sessions(status);

CREATE INDEX idx_mentoring_goals_relationship ON mentoring_goals(relationship_id);
CREATE INDEX idx_mentoring_goals_status ON mentoring_goals(status);
CREATE INDEX idx_mentoring_goals_skill ON mentoring_goals(skill_name);

CREATE INDEX idx_mentoring_feedback_relationship ON mentoring_feedback(relationship_id);
CREATE INDEX idx_mentoring_feedback_session ON mentoring_feedback(session_id);

CREATE INDEX idx_mentoring_notifications_recipient ON mentoring_notifications(recipient_id);
CREATE INDEX idx_mentoring_notifications_status ON mentoring_notifications(status);
CREATE INDEX idx_mentoring_notifications_type ON mentoring_notifications(type);

-- Create triggers for updated_at
CREATE TRIGGER update_mentoring_relationships_updated_at
  BEFORE UPDATE ON mentoring_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentoring_sessions_updated_at
  BEFORE UPDATE ON mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentoring_goals_updated_at
  BEFORE UPDATE ON mentoring_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check mentor capacity
CREATE OR REPLACE FUNCTION check_mentor_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_capacity INTEGER := 3;
BEGIN
  -- Count current active mentees for this mentor
  SELECT COUNT(*)
  INTO current_count
  FROM mentoring_relationships
  WHERE mentor_id = NEW.mentor_id
    AND status IN ('pending', 'active');
  
  IF current_count >= max_capacity THEN
    RAISE EXCEPTION 'Mentor has reached maximum capacity of % mentees', max_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_mentor_capacity
  BEFORE INSERT ON mentoring_relationships
  FOR EACH ROW
  EXECUTE FUNCTION check_mentor_capacity();

-- Function to automatically create notification on match
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify mentor
  INSERT INTO mentoring_notifications (
    type, recipient_id, relationship_id, subject, message, cta_text, cta_link
  ) VALUES (
    'match_created',
    (SELECT user_id FROM practice_members WHERE id = NEW.mentor_id),
    NEW.id,
    'New Mentee Match!',
    'You have been matched with a new mentee. Review the match details and accept to begin mentoring.',
    'View Match',
    '/accountancy/team/mentoring/' || NEW.id
  );
  
  -- Notify mentee
  INSERT INTO mentoring_notifications (
    type, recipient_id, relationship_id, subject, message, cta_text, cta_link
  ) VALUES (
    'match_created',
    (SELECT user_id FROM practice_members WHERE id = NEW.mentee_id),
    NEW.id,
    'Mentor Match Found!',
    'Great news! We found a mentor for you. Review the match and get started on your learning journey.',
    'View Match',
    '/accountancy/team/mentoring/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_match_notification
  AFTER INSERT ON mentoring_relationships
  FOR EACH ROW
  EXECUTE FUNCTION create_match_notification();

-- Function to update CPD hours when session is completed
CREATE OR REPLACE FUNCTION update_cpd_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.cpd_hours IS NOT NULL THEN
    -- This would integrate with CPD tracking system
    -- For now, just log it
    RAISE NOTICE 'Session % completed with % CPD hours', NEW.id, NEW.cpd_hours;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_cpd_hours
  AFTER UPDATE ON mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cpd_on_session_complete();

-- Function to send goal achievement notification
CREATE OR REPLACE FUNCTION notify_goal_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'achieved' AND OLD.status != 'achieved' THEN
    INSERT INTO mentoring_notifications (
      type, recipient_id, goal_id, relationship_id, subject, message
    )
    SELECT
      'goal_achieved',
      mr.mentee_id,
      NEW.id,
      NEW.relationship_id,
      'Congratulations! Goal Achieved! 🎉',
      COALESCE(NEW.celebration_message, 
        'You have successfully achieved your goal: ' || NEW.title || '. Great work!')
    FROM mentoring_relationships mr
    WHERE mr.id = NEW.relationship_id;
    
    -- Also notify mentor
    INSERT INTO mentoring_notifications (
      type, recipient_id, goal_id, relationship_id, subject, message
    )
    SELECT
      'goal_achieved',
      mr.mentor_id,
      NEW.id,
      NEW.relationship_id,
      'Your mentee achieved a goal! 🎉',
      'Your mentee has achieved the goal: ' || NEW.title
    FROM mentoring_relationships mr
    WHERE mr.id = NEW.relationship_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER celebrate_goal_achievement
  AFTER UPDATE ON mentoring_goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_achievement();

-- Create views for common queries
CREATE OR REPLACE VIEW active_mentoring_relationships AS
SELECT 
  mr.*,
  pm_mentor.user_id as mentor_user_id,
  pm_mentee.user_id as mentee_user_id,
  COUNT(DISTINCT ms.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN ms.status = 'completed' THEN ms.id END) as completed_sessions,
  COUNT(DISTINCT mg.id) as total_goals,
  COUNT(DISTINCT CASE WHEN mg.status = 'achieved' THEN mg.id END) as achieved_goals,
  AVG(mf.overall_rating) as average_rating
FROM mentoring_relationships mr
LEFT JOIN practice_members pm_mentor ON mr.mentor_id = pm_mentor.id
LEFT JOIN practice_members pm_mentee ON mr.mentee_id = pm_mentee.id
LEFT JOIN mentoring_sessions ms ON mr.id = ms.relationship_id
LEFT JOIN mentoring_goals mg ON mr.id = mg.relationship_id
LEFT JOIN mentoring_feedback mf ON mr.id = mf.relationship_id
WHERE mr.status IN ('pending', 'active')
GROUP BY mr.id, pm_mentor.user_id, pm_mentee.user_id;

-- View for mentor statistics
CREATE OR REPLACE VIEW mentor_statistics AS
SELECT 
  pm.id as mentor_id,
  pm.user_id,
  COUNT(DISTINCT mr.id) as total_mentees,
  COUNT(DISTINCT CASE WHEN mr.status = 'active' THEN mr.id END) as active_mentees,
  COUNT(DISTINCT CASE WHEN mr.status = 'completed' THEN mr.id END) as completed_relationships,
  COUNT(DISTINCT ms.id) as total_sessions,
  SUM(ms.cpd_hours) as total_cpd_hours,
  AVG(mf.overall_rating) as average_rating,
  COUNT(DISTINCT mg.id) FILTER (WHERE mg.status = 'achieved') as goals_helped_achieve
FROM practice_members pm
LEFT JOIN mentoring_relationships mr ON pm.id = mr.mentor_id
LEFT JOIN mentoring_sessions ms ON mr.id = ms.relationship_id AND ms.status = 'completed'
LEFT JOIN mentoring_feedback mf ON mr.id = mf.relationship_id AND mf.provider_role = 'mentee'
LEFT JOIN mentoring_goals mg ON mr.id = mg.relationship_id
GROUP BY pm.id, pm.user_id;

-- Comments for documentation
COMMENT ON TABLE mentoring_relationships IS 'Tracks mentor-mentee relationships with match details and status';
COMMENT ON TABLE mentoring_sessions IS 'Individual mentoring sessions with notes, outcomes, and CPD tracking';
COMMENT ON TABLE mentoring_goals IS 'Goals set within mentoring relationships with progress tracking';
COMMENT ON TABLE mentoring_feedback IS 'Feedback after sessions from both mentors and mentees';
COMMENT ON TABLE mentoring_notifications IS 'Email notifications for matches, reminders, and achievements';
COMMENT ON TABLE mentoring_agreement_templates IS 'Templates for mentoring agreements';

-- Insert default agreement template
INSERT INTO mentoring_agreement_templates (name, description, template_content, is_default, variables)
VALUES (
  'Standard Mentoring Agreement',
  'Default mentoring agreement template',
  '# Mentoring Agreement

**Mentor:** {{mentor_name}}
**Mentee:** {{mentee_name}}
**Skills Focus:** {{skills}}
**Start Date:** {{start_date}}
**Expected Duration:** {{duration}} months

## Commitment

Both parties agree to:
- Meet regularly (recommended: bi-weekly or monthly)
- Come prepared with topics/questions
- Respect confidentiality
- Provide honest, constructive feedback
- Support each other''s growth

## Goals

{{goals}}

## Success Criteria

{{success_criteria}}

## Signatures

By accepting this agreement, both parties commit to the terms outlined above.

**Mentor Signature:** ___________________ Date: ___________
**Mentee Signature:** ___________________ Date: ___________
',
  true,
  '{"mentor_name": "", "mentee_name": "", "skills": "", "start_date": "", "duration": "", "goals": "", "success_criteria": ""}'::jsonb
);

-- Grant permissions (adjust as needed for your RLS policies)
-- GRANT ALL ON mentoring_relationships TO authenticated;
-- GRANT ALL ON mentoring_sessions TO authenticated;
-- GRANT ALL ON mentoring_goals TO authenticated;
-- GRANT ALL ON mentoring_feedback TO authenticated;
-- GRANT SELECT ON mentoring_notifications TO authenticated;
-- GRANT SELECT ON mentoring_agreement_templates TO authenticated;

