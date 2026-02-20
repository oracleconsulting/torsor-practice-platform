-- ============================================================================
-- 4C: CLIENT VALUE TRACKER
-- ============================================================================
-- Progress snapshots + client wins for visible ROI tracking
-- ============================================================================

-- 1. Progress snapshots (calculated on task completion + periodically)
CREATE TABLE IF NOT EXISTS client_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER NOT NULL,

  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  skipped_tasks INTEGER DEFAULT 0,
  life_tasks_total INTEGER DEFAULT 0,
  life_tasks_completed INTEGER DEFAULT 0,
  business_tasks_total INTEGER DEFAULT 0,
  business_tasks_completed INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,

  baseline_weekly_hours NUMERIC(5,1),
  target_weekly_hours NUMERIC(5,1),
  estimated_weekly_hours NUMERIC(5,1),
  hours_reclaimed NUMERIC(5,1),
  life_alignment_score NUMERIC(5,2),
  milestones JSONB DEFAULT '[]',
  financial_snapshot JSONB DEFAULT '{}',

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, sprint_number, week_number)
);

CREATE INDEX IF NOT EXISTS idx_progress_client_sprint
  ON client_progress_snapshots(client_id, sprint_number);

ALTER TABLE client_progress_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own progress" ON client_progress_snapshots;
CREATE POLICY "Clients can view own progress"
  ON client_progress_snapshots FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own progress" ON client_progress_snapshots;
CREATE POLICY "Clients can insert own progress"
  ON client_progress_snapshots FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update own progress" ON client_progress_snapshots;
CREATE POLICY "Clients can update own progress"
  ON client_progress_snapshots FOR UPDATE
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can manage progress" ON client_progress_snapshots;
CREATE POLICY "Practice can manage progress"
  ON client_progress_snapshots FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE client_progress_snapshots IS
  'Weekly progress snapshot for client value tracking. Calculated on task completion events.';


-- 2. Client wins / milestones
CREATE TABLE IF NOT EXISTS client_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('team', 'financial', 'systems', 'life', 'personal', 'general')),
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'advisor', 'client')),
  is_highlighted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wins_client_sprint
  ON client_wins(client_id, sprint_number);

ALTER TABLE client_wins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own wins" ON client_wins;
CREATE POLICY "Clients can view own wins"
  ON client_wins FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own wins" ON client_wins;
CREATE POLICY "Clients can insert own wins"
  ON client_wins FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can manage wins" ON client_wins;
CREATE POLICY "Practice can manage wins"
  ON client_wins FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE client_wins IS
  'Client achievements and milestones. Source: auto, advisor, client. Highlighted wins appear on the Win Wall.';
