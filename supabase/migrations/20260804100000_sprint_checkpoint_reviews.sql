-- ============================================================================
-- Sprint Checkpoint Reviews (weeks 3, 6, 9)
-- ============================================================================
-- Optional mid-sprint reflection. Does NOT gate week progression.
-- Feeds generate-sprint-refresh as client-stated context.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprint_checkpoint_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  checkpoint_week INTEGER NOT NULL CHECK (checkpoint_week IN (3, 6, 9)),
  what_worked TEXT,
  what_didnt TEXT,
  whats_changed TEXT,
  next_three_weeks TEXT,
  capacity_outlook TEXT CHECK (
    capacity_outlook IS NULL
    OR capacity_outlook IN ('lighter', 'similar', 'heavier')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, sprint_number, checkpoint_week)
);

CREATE INDEX IF NOT EXISTS idx_sprint_checkpoint_reviews_client_sprint
  ON sprint_checkpoint_reviews(client_id, sprint_number);

ALTER TABLE sprint_checkpoint_reviews ENABLE ROW LEVEL SECURITY;

-- Mirror life_pulse_entries client policies
DROP POLICY IF EXISTS "Clients can view own checkpoint reviews" ON sprint_checkpoint_reviews;
CREATE POLICY "Clients can view own checkpoint reviews"
  ON sprint_checkpoint_reviews FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own checkpoint reviews" ON sprint_checkpoint_reviews;
CREATE POLICY "Clients can insert own checkpoint reviews"
  ON sprint_checkpoint_reviews FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update own checkpoint reviews" ON sprint_checkpoint_reviews;
CREATE POLICY "Clients can update own checkpoint reviews"
  ON sprint_checkpoint_reviews FOR UPDATE
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

-- Practice members read/write within their practice
DROP POLICY IF EXISTS "Practice can view checkpoint reviews" ON sprint_checkpoint_reviews;
CREATE POLICY "Practice can view checkpoint reviews"
  ON sprint_checkpoint_reviews FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can manage checkpoint reviews" ON sprint_checkpoint_reviews;
CREATE POLICY "Practice can manage checkpoint reviews"
  ON sprint_checkpoint_reviews FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE sprint_checkpoint_reviews IS
  'Optional mid-sprint reviews at weeks 3, 6 and 9. Never gates progression. Feeds sprint refresh generation.';
