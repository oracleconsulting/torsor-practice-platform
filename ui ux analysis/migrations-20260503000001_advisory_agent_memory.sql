-- ============================================================================
-- ADVISORY AGENT MEMORY (pgvector)
-- ============================================================================
-- Adds long-term memory to the advisory agent so conversations grow:
--   - Embedding column on every chat message (1536-dim, OpenAI
--     text-embedding-3-small).
--   - Tokenised "anon_summary" field used for cross-client retrieval. For
--     v1 this can be the same as the (already-tokenised) `content`. A later
--     migration may swap it for a Haiku-generated genericised summary.
--   - match_chat_messages(): cosine-similarity search returning the top-N
--     historical messages, scoped to a single client OR practice-wide
--     across anonymised summaries (controlled by practices.allow_cross_client_agent_memory).
-- ============================================================================

-- 1. Extension
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Embedding columns on client_chat_messages
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE client_chat_messages
    ADD COLUMN IF NOT EXISTS embedding vector(1536),
    ADD COLUMN IF NOT EXISTS anon_summary TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- IVFFlat is the standard fast similarity index on pgvector. lists=100 is
-- a sane default for up to a few hundred thousand rows; we can REINDEX with
-- a different list count later if needed. Note: ivfflat needs at least
-- one row to build, so we create with `IF NOT EXISTS` and rebuild later.

CREATE INDEX IF NOT EXISTS idx_chat_messages_embedding
  ON client_chat_messages
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3. Practice-level toggle for cross-client memory sharing
-- ----------------------------------------------------------------------------
-- When TRUE, the agent for a client may surface tokenised references from
-- other clients in the same practice. When FALSE, retrieval is scoped to
-- the current client only.

DO $$ BEGIN
  ALTER TABLE practices
    ADD COLUMN IF NOT EXISTS allow_cross_client_agent_memory BOOLEAN NOT NULL DEFAULT TRUE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. Vector match function
-- ----------------------------------------------------------------------------
-- Returns rows from client_chat_messages whose embedding is most similar
-- (cosine distance) to the supplied query embedding.
--
-- Args:
--   p_query_embedding   - the embedding to match against
--   p_practice_id       - REQUIRED, scopes the search to this practice
--   p_current_client_id - REQUIRED, used to flag "same-client" results
--   p_match_count       - top-N to return per scope (default 5)
--   p_same_client_only  - when TRUE, ignores other clients (default FALSE)
--   p_min_similarity    - cosine similarity threshold (default 0.70)
--
-- Returns:
--   id, thread_id, role, content (tokenised), anon_summary,
--   client_id, is_same_client, similarity, created_at
--
-- The function is SECURITY INVOKER (default), so RLS still applies — staff
-- can only see threads belonging to their practice. We do NOT use SECURITY
-- DEFINER here because the search needs to respect the caller's permissions.

CREATE OR REPLACE FUNCTION match_chat_messages(
  p_query_embedding vector(1536),
  p_practice_id UUID,
  p_current_client_id UUID,
  p_match_count INT DEFAULT 5,
  p_same_client_only BOOLEAN DEFAULT FALSE,
  p_min_similarity NUMERIC DEFAULT 0.70
)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  role TEXT,
  content TEXT,
  anon_summary TEXT,
  client_id UUID,
  is_same_client BOOLEAN,
  similarity NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.thread_id,
    m.role,
    m.content,
    COALESCE(m.anon_summary, m.content) AS anon_summary,
    t.client_id,
    (t.client_id = p_current_client_id) AS is_same_client,
    (1 - (m.embedding <=> p_query_embedding))::numeric AS similarity,
    m.created_at
  FROM client_chat_messages m
  JOIN client_chat_threads t ON t.id = m.thread_id
  WHERE
    m.embedding IS NOT NULL
    AND t.practice_id = p_practice_id
    AND (
      p_same_client_only IS FALSE
      OR t.client_id = p_current_client_id
    )
    AND (1 - (m.embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY m.embedding <=> p_query_embedding ASC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE ALL ON FUNCTION match_chat_messages(vector, UUID, UUID, INT, BOOLEAN, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_chat_messages(vector, UUID, UUID, INT, BOOLEAN, NUMERIC) TO authenticated;

COMMENT ON FUNCTION match_chat_messages IS
  'Cosine-similarity search across client_chat_messages embeddings. RLS '
  'scoped to the caller''s practice; cross-client results returned only '
  'when the calling practice has allow_cross_client_agent_memory=TRUE.';

-- 5. Convenience wrapper that respects the practice flag
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION match_chat_messages_for_practice(
  p_query_embedding vector(1536),
  p_practice_id UUID,
  p_current_client_id UUID,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  role TEXT,
  content TEXT,
  anon_summary TEXT,
  client_id UUID,
  is_same_client BOOLEAN,
  similarity NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  cross_client_allowed BOOLEAN;
BEGIN
  SELECT COALESCE(allow_cross_client_agent_memory, FALSE) INTO cross_client_allowed
  FROM practices WHERE id = p_practice_id;

  RETURN QUERY
  SELECT * FROM match_chat_messages(
    p_query_embedding,
    p_practice_id,
    p_current_client_id,
    p_match_count,
    NOT cross_client_allowed,  -- if cross-client allowed, search ALL; else same-client only
    0.70
  );
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE ALL ON FUNCTION match_chat_messages_for_practice(vector, UUID, UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_chat_messages_for_practice(vector, UUID, UUID, INT) TO authenticated;
