-- Mentoring Relationships Table
-- Stores mentor-mentee relationships and tracking data

CREATE TABLE IF NOT EXISTS mentoring_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  matched_skills TEXT[] NOT NULL DEFAULT '{}',
  match_score INTEGER NOT NULL DEFAULT 0,
  vark_compatibility INTEGER DEFAULT 0,
  availability_overlap INTEGER DEFAULT 0,
  rationale TEXT,
  suggested_goals TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  
  -- Prevent self-mentoring
  CONSTRAINT no_self_mentoring CHECK (mentor_id != mentee_id),
  
  -- Prevent duplicate active relationships
  CONSTRAINT unique_active_relationship UNIQUE(mentor_id, mentee_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Mentoring Sessions Table
-- Tracks individual mentoring sessions
CREATE TABLE IF NOT EXISTS mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_type TEXT CHECK (meeting_type IN ('video', 'in_person', 'phone', 'async')),
  meeting_link TEXT,
  notes TEXT,
  topics TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mentoring Goals Table
-- Tracks development goals within a mentoring relationship
CREATE TABLE IF NOT EXISTS mentoring_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES mentoring_relationships(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  goal_description TEXT NOT NULL,
  target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
  current_level INTEGER CHECK (current_level BETWEEN 1 AND 5),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'achieved', 'abandoned')),
  target_date DATE,
  achieved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentoring_relationships_mentor ON mentoring_relationships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_relationships_mentee ON mentoring_relationships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_relationships_status ON mentoring_relationships(status);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_relationship ON mentoring_sessions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_date ON mentoring_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_mentoring_goals_relationship ON mentoring_goals(relationship_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_goals_skill ON mentoring_goals(skill_id);

-- Row Level Security (RLS)
ALTER TABLE mentoring_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentoring_relationships
DROP POLICY IF EXISTS "Users can view their own mentoring relationships" ON mentoring_relationships;
CREATE POLICY "Users can view their own mentoring relationships"
  ON mentoring_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM practice_members
      WHERE practice_members.id IN (mentoring_relationships.mentor_id, mentoring_relationships.mentee_id)
      AND practice_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create mentoring relationships they're part of" ON mentoring_relationships;
CREATE POLICY "Users can create mentoring relationships they're part of"
  ON mentoring_relationships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_members
      WHERE practice_members.id IN (mentor_id, mentee_id)
      AND practice_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own mentoring relationships" ON mentoring_relationships;
CREATE POLICY "Users can update their own mentoring relationships"
  ON mentoring_relationships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM practice_members
      WHERE practice_members.id IN (mentor_id, mentee_id)
      AND practice_members.user_id = auth.uid()
    )
  );

-- RLS Policies for mentoring_sessions
DROP POLICY IF EXISTS "Users can view sessions from their relationships" ON mentoring_sessions;
CREATE POLICY "Users can view sessions from their relationships"
  ON mentoring_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentoring_relationships mr
      JOIN practice_members pm ON pm.id IN (mr.mentor_id, mr.mentee_id)
      WHERE mr.id = mentoring_sessions.relationship_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage sessions from their relationships" ON mentoring_sessions;
CREATE POLICY "Users can manage sessions from their relationships"
  ON mentoring_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mentoring_relationships mr
      JOIN practice_members pm ON pm.id IN (mr.mentor_id, mr.mentee_id)
      WHERE mr.id = mentoring_sessions.relationship_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for mentoring_goals
DROP POLICY IF EXISTS "Users can view goals from their relationships" ON mentoring_goals;
CREATE POLICY "Users can view goals from their relationships"
  ON mentoring_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentoring_relationships mr
      JOIN practice_members pm ON pm.id IN (mr.mentor_id, mr.mentee_id)
      WHERE mr.id = mentoring_goals.relationship_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage goals from their relationships" ON mentoring_goals;
CREATE POLICY "Users can manage goals from their relationships"
  ON mentoring_goals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mentoring_relationships mr
      JOIN practice_members pm ON pm.id IN (mr.mentor_id, mr.mentee_id)
      WHERE mr.id = mentoring_goals.relationship_id
      AND pm.user_id = auth.uid()
    )
  );

-- Add mentoring capacity to practice_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'practice_members' 
                 AND column_name = 'mentor_capacity') THEN
    ALTER TABLE practice_members ADD COLUMN mentor_capacity INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'practice_members' 
                 AND column_name = 'is_mentor') THEN
    ALTER TABLE practice_members ADD COLUMN is_mentor BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (drop existing triggers first to avoid conflicts)
DROP TRIGGER IF EXISTS update_mentoring_relationships_updated_at ON mentoring_relationships;
CREATE TRIGGER update_mentoring_relationships_updated_at
  BEFORE UPDATE ON mentoring_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mentoring_sessions_updated_at ON mentoring_sessions;
CREATE TRIGGER update_mentoring_sessions_updated_at
  BEFORE UPDATE ON mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mentoring_goals_updated_at ON mentoring_goals;
CREATE TRIGGER update_mentoring_goals_updated_at
  BEFORE UPDATE ON mentoring_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE mentoring_relationships IS 'Stores mentor-mentee relationships with matching scores and status tracking';
COMMENT ON TABLE mentoring_sessions IS 'Tracks individual mentoring sessions including scheduling and notes';
COMMENT ON TABLE mentoring_goals IS 'Development goals within mentoring relationships';
COMMENT ON COLUMN practice_members.mentor_capacity IS 'Maximum number of mentees this person can mentor simultaneously';
COMMENT ON COLUMN practice_members.is_mentor IS 'Whether this person is available as a mentor';

