-- ============================================================================
-- ADVISORY AGENT INFRASTRUCTURE
-- ============================================================================
-- Adds the in-platform AI advisory agent: per-client chat threads, message
-- history, and a server-side function for applying agent-proposed changes
-- to roadmap_stages content. The agent itself is a Supabase edge function
-- (supabase/functions/advisory-agent) called from the admin UI.
--
-- Tokenisation runs in the browser before any API call; this DB layer never
-- sees or stores the tokenisation map.
-- ============================================================================

-- 1. CHAT THREADS
-- ----------------------------------------------------------------------------
-- One active thread per client/practice (and thread_type). Stores enough
-- context to resume a conversation across sessions. Idempotent so it's safe
-- to re-run if a manual prod copy already exists.

CREATE TABLE IF NOT EXISTS client_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  title TEXT,
  thread_type TEXT NOT NULL DEFAULT 'advisory_agent',
  status TEXT NOT NULL DEFAULT 'active', -- active | archived
  context_snapshot JSONB,                 -- optional snapshot of context at thread creation
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_chat_threads_client
  ON client_chat_threads(client_id, thread_type, status);
CREATE INDEX IF NOT EXISTS idx_client_chat_threads_practice
  ON client_chat_threads(practice_id, status);

-- 2. CHAT MESSAGES
-- ----------------------------------------------------------------------------
-- `content` always holds the tokenised version (what the LLM saw). The
-- de-tokenised display copy lives in metadata.displayContent so the UI
-- can render the real text without re-running the tokeniser. Cost/tokens
-- are tracked per-message for usage analytics.

CREATE TABLE IF NOT EXISTS client_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES client_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,                  -- tokenised
  sent_by UUID REFERENCES practice_members(id),
  llm_model TEXT,
  tokens_used INTEGER,
  generation_cost_cents INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,     -- { displayContent, wasTokenised, proposedChanges, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_chat_messages_thread
  ON client_chat_messages(thread_id, created_at);

-- 3. RLS
-- ----------------------------------------------------------------------------
-- Practice members can read/write threads + messages for clients in their
-- practice. Clients themselves cannot see advisory-agent threads (the chat
-- is an internal advisor tool).

ALTER TABLE client_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can view own threads" ON client_chat_threads;
CREATE POLICY "Practice can view own threads"
  ON client_chat_threads FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Practice can insert own threads" ON client_chat_threads;
CREATE POLICY "Practice can insert own threads"
  ON client_chat_threads FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Practice can update own threads" ON client_chat_threads;
CREATE POLICY "Practice can update own threads"
  ON client_chat_threads FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS "Practice can view own messages" ON client_chat_messages;
CREATE POLICY "Practice can view own messages"
  ON client_chat_messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM client_chat_threads
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
      )
    )
  );

DROP POLICY IF EXISTS "Practice can insert own messages" ON client_chat_messages;
CREATE POLICY "Practice can insert own messages"
  ON client_chat_messages FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM client_chat_threads
      WHERE practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
      )
    )
  );

-- 4. ROADMAP_STAGES AUDIT COLUMNS
-- ----------------------------------------------------------------------------
-- Track when an advisory-agent edit (or any manual edit) was applied so the
-- UI can flag "edited since generation" and the generation_feedback loop can
-- learn from advisor changes.

DO $$ BEGIN
  ALTER TABLE roadmap_stages ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE roadmap_stages ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;
  ALTER TABLE roadmap_stages ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES practice_members(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 5. APPLY ROADMAP CHANGE
-- ----------------------------------------------------------------------------
-- Server-side write that applies an advisor-approved change. Targets the
-- LATEST version of the requested stage_type for the client, preferring
-- approved_content if present (so edits stack on the published copy), then
-- generated_content. Records the audit columns.
--
-- p_json_path uses Postgres array notation, e.g. '{openingReflection}' or
-- '{weeks,0,tasks,1,description}'. p_new_value is treated as a string and
-- coerced into JSONB via to_jsonb so embedded quotes survive.
--
-- SECURITY DEFINER lets the function bypass RLS for the precise UPDATE
-- that the owning advisor has just authorised through the agent panel.
-- The caller's identity (auth.uid()) is recorded as last_edited_by so we
-- maintain an audit trail.

CREATE OR REPLACE FUNCTION apply_roadmap_change(
  p_client_id UUID,
  p_stage_type TEXT,
  p_json_path TEXT,
  p_new_value TEXT
) RETURNS JSONB AS $$
DECLARE
  target_id UUID;
  target_status TEXT;
  use_approved BOOLEAN;
  current_member UUID;
  path_array TEXT[];
BEGIN
  -- Resolve the calling practice member (for audit). Returns NULL when the
  -- function is called outside an authenticated context (e.g. via service-role).
  SELECT id INTO current_member
  FROM practice_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Parse the JSON path. Accepts both array literal notation
  -- ('{a,b,c}') and a comma-separated bare string ('a,b,c').
  IF p_json_path LIKE '{%}' THEN
    path_array := string_to_array(trim(both '{}' from p_json_path), ',');
  ELSE
    path_array := string_to_array(p_json_path, ',');
  END IF;

  -- Pick the target row: latest version for this client + stage_type, with
  -- a published copy preferred over a generated-only one.
  SELECT id, status::text,
         (approved_content IS NOT NULL) AS approved
    INTO target_id, target_status, use_approved
  FROM roadmap_stages
  WHERE client_id = p_client_id
    AND stage_type = p_stage_type
    AND status IN ('published', 'approved', 'generated')
  ORDER BY
    CASE status::text WHEN 'published' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
    version DESC,
    updated_at DESC
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', format('No roadmap_stages row found for client %s, stage %s', p_client_id, p_stage_type)
    );
  END IF;

  -- Apply jsonb_set against approved_content if present, otherwise against
  -- generated_content. We update both with COALESCE so that future
  -- regenerations don't blow away the edit.
  UPDATE roadmap_stages
  SET
    approved_content = jsonb_set(
      COALESCE(approved_content, generated_content),
      path_array,
      to_jsonb(p_new_value),
      TRUE
    ),
    manually_edited = TRUE,
    last_edited_at = NOW(),
    last_edited_by = COALESCE(current_member, last_edited_by),
    updated_at = NOW()
  WHERE id = target_id;

  RETURN jsonb_build_object(
    'ok', true,
    'stage_id', target_id,
    'stage_status', target_status,
    'used_approved_content', use_approved,
    'last_edited_by', current_member
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION apply_roadmap_change(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_roadmap_change(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION apply_roadmap_change IS
  'Apply an advisory-agent-proposed change to a client''s roadmap_stages '
  'JSONB content. Targets the latest version, preferring approved_content '
  'over generated_content. Records audit metadata. Caller must be an '
  'authenticated practice member; RLS is bypassed only for this surgical '
  'UPDATE on the row matching the supplied client_id + stage_type.';

-- 6. UPDATED_AT TRIGGER FOR client_chat_threads
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_chat_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_chat_threads_updated_at ON client_chat_threads;
CREATE TRIGGER trg_client_chat_threads_updated_at
  BEFORE UPDATE ON client_chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION trg_chat_threads_updated_at();
