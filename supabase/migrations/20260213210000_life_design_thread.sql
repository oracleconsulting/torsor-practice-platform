-- ============================================================================
-- LIFE DESIGN THREAD — Weekly check-ins, category comment
-- ============================================================================
-- Migration: 20260213210000_life_design_thread.sql
-- Purpose: Support Life Design Thread (life-first Goal Alignment)
-- - weekly_checkins: Life Pulse + Sprint Review per week
-- - client_tasks.category: document life_* categories
-- ============================================================================

-- 1. Weekly check-ins table
CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  sprint_id UUID REFERENCES roadmap_stages(id) ON DELETE SET NULL,

  -- Life Pulse
  life_satisfaction INTEGER CHECK (life_satisfaction BETWEEN 1 AND 5),
  time_protected TEXT CHECK (time_protected IN ('yes', 'mostly', 'no')),
  personal_win TEXT,

  -- Sprint Review
  business_progress INTEGER CHECK (business_progress BETWEEN 1 AND 5),
  blockers TEXT,

  -- Computed (set by app or trigger)
  life_alignment_score NUMERIC(4,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, sprint_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_client ON weekly_checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_sprint ON weekly_checkins(sprint_id, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_practice ON weekly_checkins(practice_id);

-- RLS for weekly_checkins (match client_tasks / practice_members pattern)
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Clients can read/write their own check-ins (client_id = their practice_members.id)
CREATE POLICY "Clients can manage own checkins"
  ON weekly_checkins FOR ALL
  USING (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Practice members (staff) can read their clients' check-ins
CREATE POLICY "Practice can read client checkins"
  ON weekly_checkins FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Practice members can insert/update for their practice (e.g. backfill)
CREATE POLICY "Practice can insert client checkins"
  ON weekly_checkins FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Practice can update client checkins"
  ON weekly_checkins FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- 2. Document client_tasks.category for life + business categories
COMMENT ON COLUMN client_tasks.category IS
  'Task category. Business: financial, operations, team, marketing, product, systems, strategy. '
  'Life: life_time, life_relationship, life_health, life_experience, life_identity.';

-- 3. roadmap_stages.stage_type is TEXT with no CHECK — life_design_profile is valid as-is.
-- No schema change needed for life_design_profile stage.

-- updated_at trigger for weekly_checkins
CREATE OR REPLACE FUNCTION update_weekly_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_weekly_checkins_updated_at ON weekly_checkins;
CREATE TRIGGER trg_weekly_checkins_updated_at
  BEFORE UPDATE ON weekly_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_checkins_updated_at();
