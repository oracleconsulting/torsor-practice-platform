-- ============================================================================
-- AGENT SYSTEM OBSERVATIONS
-- ============================================================================
-- Lets the advisory agent flag platform-level patterns it spots across
-- conversations: gaps in prompts, recurring tone issues, data-quality
-- problems, sectors the system handles poorly, etc.
--
-- Surfaced in a new admin page (/practice/agent-observations) where the
-- practice owner can acknowledge / action / dismiss each observation.
--
-- The agent emits these as ```system_observation``` blocks that the edge
-- function parses and writes here. They are NEVER applied automatically;
-- they're a backlog of "this needs human judgement" items.
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

  -- What kind of observation
  observation_type TEXT NOT NULL CHECK (observation_type IN (
    'gap',          -- something the platform handles poorly
    'pattern',      -- a recurring theme across multiple conversations
    'tone_drift',   -- generated content keeps drifting from practice voice
    'data_quality', -- input data has consistent issues
    'prompt_idea',  -- agent suggests a system prompt change
    'feature_idea'  -- agent suggests a UI / workflow improvement
  )),

  /** Which service this is about, or 'platform' for cross-cutting issues. */
  service_line TEXT,
  /** Short headline. */
  title TEXT NOT NULL,
  /** Full reasoning from the agent. */
  body TEXT NOT NULL,

  /** Supporting evidence: thread_ids, message_ids, client_ids the agent
   *  cited. Free-form so the agent can include whatever it found. */
  evidence JSONB DEFAULT '{}'::jsonb,

  /** Number of times this observation has been re-raised. The edge
   *  function de-dupes by (practice_id, observation_type, normalised_title)
   *  and increments occurrence_count instead of inserting a new row. */
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  /** Lifecycle: open -> acknowledged | actioned | dismissed. */
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'acknowledged',
    'actioned',
    'dismissed'
  )),
  reviewed_by UUID REFERENCES practice_members(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_notes TEXT,

  /** Source: which assistant message produced this observation. */
  source_message_id UUID REFERENCES client_chat_messages(id) ON DELETE SET NULL,
  source_thread_id UUID REFERENCES client_chat_threads(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (practice_id, observation_type, title)
);

CREATE INDEX IF NOT EXISTS idx_system_observations_practice_status
  ON system_observations(practice_id, status);
CREATE INDEX IF NOT EXISTS idx_system_observations_service
  ON system_observations(service_line);

-- RLS: visible only to staff/owner of the practice.
ALTER TABLE system_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can view observations" ON system_observations;
CREATE POLICY "Practice can view observations"
  ON system_observations FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Practice can insert observations" ON system_observations;
CREATE POLICY "Practice can insert observations"
  ON system_observations FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Practice can update observations" ON system_observations;
CREATE POLICY "Practice can update observations"
  ON system_observations FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

-- Updated_at trigger (reuses the helper from chat threads)
DROP TRIGGER IF EXISTS trg_system_observations_updated_at ON system_observations;
CREATE TRIGGER trg_system_observations_updated_at
  BEFORE UPDATE ON system_observations
  FOR EACH ROW
  EXECUTE FUNCTION trg_chat_threads_updated_at();

-- ----------------------------------------------------------------------------
-- Upsert helper: dedupe by (practice_id, observation_type, title) and bump
-- the occurrence_count + last_observed_at when an observation is re-raised.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_system_observation(
  p_practice_id UUID,
  p_observation_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_service_line TEXT DEFAULT NULL,
  p_evidence JSONB DEFAULT '{}'::jsonb,
  p_source_thread_id UUID DEFAULT NULL,
  p_source_message_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id
  FROM system_observations
  WHERE practice_id = p_practice_id
    AND observation_type = p_observation_type
    AND title = p_title
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE system_observations
    SET
      occurrence_count = occurrence_count + 1,
      last_observed_at = NOW(),
      body = p_body,
      evidence = p_evidence,
      service_line = COALESCE(p_service_line, service_line),
      source_thread_id = COALESCE(p_source_thread_id, source_thread_id),
      source_message_id = COALESCE(p_source_message_id, source_message_id),
      -- Re-open if it was dismissed and we're seeing it again
      status = CASE
        WHEN status IN ('dismissed', 'actioned') THEN 'open'
        ELSE status
      END
    WHERE id = existing_id;
    RETURN existing_id;
  END IF;

  INSERT INTO system_observations (
    practice_id, observation_type, service_line, title, body, evidence,
    source_thread_id, source_message_id
  )
  VALUES (
    p_practice_id, p_observation_type, p_service_line, p_title, p_body, p_evidence,
    p_source_thread_id, p_source_message_id
  )
  RETURNING id INTO existing_id;
  RETURN existing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION record_system_observation(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_system_observation(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID, UUID) TO authenticated;
