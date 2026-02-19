-- ============================================================================
-- 4A: LIFE DESIGN THREAD
-- ============================================================================
-- Weekly life pulse tracking + calculated life alignment scores
-- Adds ongoing measurement layer to the existing life task system
-- ============================================================================

-- 1. Weekly Life Pulse (client submits once per week during active sprint)
CREATE TABLE IF NOT EXISTS life_pulse_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER NOT NULL,

  -- Pulse data
  alignment_rating INTEGER NOT NULL CHECK (alignment_rating BETWEEN 1 AND 5),
  active_categories TEXT[] DEFAULT '{}',
  protect_next_week TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, sprint_number, week_number)
);

CREATE INDEX IF NOT EXISTS idx_life_pulse_client_sprint
  ON life_pulse_entries(client_id, sprint_number);

ALTER TABLE life_pulse_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own pulse" ON life_pulse_entries;
CREATE POLICY "Clients can view own pulse"
  ON life_pulse_entries FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own pulse" ON life_pulse_entries;
CREATE POLICY "Clients can insert own pulse"
  ON life_pulse_entries FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update own pulse" ON life_pulse_entries;
CREATE POLICY "Clients can update own pulse"
  ON life_pulse_entries FOR UPDATE
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can view pulse entries" ON life_pulse_entries;
CREATE POLICY "Practice can view pulse entries"
  ON life_pulse_entries FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE life_pulse_entries IS
  'Weekly 3-question micro check-in during active sprints. Tracks life alignment rating, active categories, and protection intentions.';


-- 2. Calculated Life Alignment Scores (recalculated on pulse submission + task completion)
CREATE TABLE IF NOT EXISTS life_alignment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER NOT NULL,

  -- Component scores (0-100)
  task_completion_score NUMERIC(5,2) DEFAULT 0,
  pulse_alignment_score NUMERIC(5,2) DEFAULT 0,
  hours_adherence_score NUMERIC(5,2) DEFAULT 0,
  category_diversity_score NUMERIC(5,2) DEFAULT 0,

  -- Composite
  overall_score NUMERIC(5,2) DEFAULT 0,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),

  -- Category breakdown ({"life_time": 80, "life_relationship": 60, ...})
  category_scores JSONB DEFAULT '{}',

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, sprint_number, week_number)
);

CREATE INDEX IF NOT EXISTS idx_life_scores_client_sprint
  ON life_alignment_scores(client_id, sprint_number);

ALTER TABLE life_alignment_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own scores" ON life_alignment_scores;
CREATE POLICY "Clients can view own scores"
  ON life_alignment_scores FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own scores" ON life_alignment_scores;
CREATE POLICY "Clients can insert own scores"
  ON life_alignment_scores FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update own scores" ON life_alignment_scores;
CREATE POLICY "Clients can update own scores"
  ON life_alignment_scores FOR UPDATE
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can view alignment scores" ON life_alignment_scores;
CREATE POLICY "Practice can view alignment scores"
  ON life_alignment_scores FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can manage alignment scores" ON life_alignment_scores;
CREATE POLICY "Practice can manage alignment scores"
  ON life_alignment_scores FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE life_alignment_scores IS
  'Calculated weekly life alignment score. Weighted: task completion 40%, pulse alignment 30%, hours adherence 20%, category diversity 10%. Recalculated on pulse submission and task completion.';
