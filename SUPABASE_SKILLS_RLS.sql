-- =====================================================
-- RLS Policies: Skills, Assessments, and Survey Sessions
-- =====================================================
-- Allow team members to read skills and manage their assessments

-- =====================================================
-- SKILLS TABLE - Public read access
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users to read skills" ON skills;

CREATE POLICY "Allow authenticated users to read skills"
ON skills
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SKILL_ASSESSMENTS TABLE - Users manage their own
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can create their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON skill_assessments;

-- Read own assessments
CREATE POLICY "Users can read their own assessments"
ON skill_assessments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Create own assessments
CREATE POLICY "Users can create their own assessments"
ON skill_assessments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Update own assessments
CREATE POLICY "Users can update their own assessments"
ON skill_assessments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = skill_assessments.team_member_id
    AND practice_members.user_id = auth.uid()
  )
);

ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SURVEY_SESSIONS TABLE - Users manage their own
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own survey sessions" ON survey_sessions;
DROP POLICY IF EXISTS "Users can create their own survey sessions" ON survey_sessions;
DROP POLICY IF EXISTS "Users can update their own survey sessions" ON survey_sessions;

-- Read own sessions
CREATE POLICY "Users can read their own survey sessions"
ON survey_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = survey_sessions.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Create own sessions
CREATE POLICY "Users can create their own survey sessions"
ON survey_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = survey_sessions.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Update own sessions
CREATE POLICY "Users can update their own survey sessions"
ON survey_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = survey_sessions.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = survey_sessions.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEVELOPMENT_GOALS TABLE - Users manage their own
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON development_goals;

-- Read own goals
CREATE POLICY "Users can read their own goals"
ON development_goals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = development_goals.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Create own goals
CREATE POLICY "Users can create their own goals"
ON development_goals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = development_goals.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Update own goals
CREATE POLICY "Users can update their own goals"
ON development_goals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = development_goals.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = development_goals.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

-- Delete own goals
CREATE POLICY "Users can delete their own goals"
ON development_goals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM practice_members
    WHERE practice_members.id = development_goals.practice_member_id
    AND practice_members.user_id = auth.uid()
  )
);

ALTER TABLE development_goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Show all policies
-- =====================================================
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('skills', 'skill_assessments', 'survey_sessions', 'development_goals', 'practice_members')
ORDER BY tablename, policyname;

