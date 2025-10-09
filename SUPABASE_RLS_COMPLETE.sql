-- =====================================================
-- COMPLETE RLS POLICIES FOR TEAM PORTAL
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PRACTICE_MEMBERS - Users manage their own records
-- =====================================================

DROP POLICY IF EXISTS "Users can create their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Users can read their own practice member record" ON practice_members;
DROP POLICY IF EXISTS "Users can update their own practice member record" ON practice_members;

CREATE POLICY "Users can create their own practice member record"
ON practice_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can read their own practice member record"
ON practice_members
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can update their own practice member record"
ON practice_members
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. SKILLS - Public read for authenticated users
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
-- 3. SKILL_ASSESSMENTS - Users manage their own
-- Note: skill_assessments uses 'team_member_id' column
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can create their own assessments" ON skill_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON skill_assessments;

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
-- 4. SURVEY_SESSIONS - Users manage their own
-- Note: survey_sessions uses 'practice_member_id' column
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own survey sessions" ON survey_sessions;
DROP POLICY IF EXISTS "Users can create their own survey sessions" ON survey_sessions;
DROP POLICY IF EXISTS "Users can update their own survey sessions" ON survey_sessions;

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
-- 5. DEVELOPMENT_GOALS - Users manage their own
-- Note: development_goals uses 'practice_member_id' column
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON development_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON development_goals;

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
-- 6. Show all policies for verification
-- =====================================================

SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename IN ('skills', 'skill_assessments', 'survey_sessions', 'development_goals', 'practice_members', 'invitations')
ORDER BY tablename, policyname;

