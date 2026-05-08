-- ============================================================================
-- CLIENT LLM COST TRACKER
-- ============================================================================
-- Single, append-only ledger of every LLM call we make on behalf of a
-- client: chat messages, embeddings, sprint plan generation, vision,
-- shift, value analysis, advisory brief — anything that hits a paid model
-- via OpenRouter or any other provider writes one row here.
--
-- Existing per-message columns on client_chat_messages
-- (tokens_used, generation_cost_cents) stay as-is. This new table adds:
--   - granular per-call attribution (which edge function, which operation)
--   - input_tokens / output_tokens split for accurate cost calc
--   - cumulative aggregation across ALL operations (not just chat)
--
-- Surfaced in:
--   - admin /practice/llm-costs (summary dashboard)
--   - admin GA Client Live View (per-client month + lifetime widget)
--   - the advisory agent panel header (cumulative for this client)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_llm_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,

  /** Service line code: '365_method' | 'benchmarking' | 'systems_audit' |
   *  'management_accounts' | 'discovery' | 'platform' (for cross-cutting
   *  ops like the advisory agent) */
  service_line_code TEXT,

  /** Operation type: 'advisory_chat' | 'advisory_embedding' |
   *  'sprint_plan_generation' | 'fit_profile_generation' |
   *  'vision_generation' | 'shift_generation' | 'value_analysis_generation' |
   *  'advisory_brief' | 'insight_report' | etc. */
  operation_type TEXT NOT NULL,

  /** Source: the edge function name that did the work. */
  source_function TEXT NOT NULL,

  /** Provider model: 'anthropic/claude-sonnet-4.5', 'openai/text-embedding-3-small'... */
  model TEXT NOT NULL,

  /** Token split. Total = input + output (or whatever the provider returns). */
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  /** Estimated cost in pence. Calculated client-side using known per-model
   *  pricing; we record the estimate here so we have a stable historical
   *  view even if pricing later changes. */
  cost_cents INTEGER NOT NULL DEFAULT 0,

  /** Optional FK to a chat message — populated when this cost row was
   *  triggered by a specific advisory chat exchange. */
  source_message_id UUID REFERENCES client_chat_messages(id) ON DELETE SET NULL,

  /** Free-form supporting data (mode, reason, prompt-size, etc). */
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_llm_costs_practice_created
  ON client_llm_costs(practice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_llm_costs_client_created
  ON client_llm_costs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_llm_costs_operation
  ON client_llm_costs(operation_type);

ALTER TABLE client_llm_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practice can view costs" ON client_llm_costs;
CREATE POLICY "Practice can view costs"
  ON client_llm_costs FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members
      WHERE user_id = auth.uid() AND member_type IN ('owner', 'staff')
    )
  );

-- record_llm_cost: the single function every edge fn calls to log a usage row.
-- SECURITY DEFINER so it can write even when RLS would otherwise hide the
-- row from the calling user (we don't want PROVIDER attributable rows to
-- leak across practices, but the practice's own staff should always see
-- their own costs — that's what the SELECT policy above enforces).

CREATE OR REPLACE FUNCTION record_llm_cost(
  p_practice_id UUID,
  p_operation_type TEXT,
  p_source_function TEXT,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_cost_cents INTEGER,
  p_client_id UUID DEFAULT NULL,
  p_service_line_code TEXT DEFAULT NULL,
  p_source_message_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO client_llm_costs (
    practice_id, client_id, service_line_code, operation_type,
    source_function, model, input_tokens, output_tokens, total_tokens,
    cost_cents, source_message_id, metadata
  )
  VALUES (
    p_practice_id, p_client_id, p_service_line_code, p_operation_type,
    p_source_function, p_model,
    GREATEST(0, COALESCE(p_input_tokens, 0)),
    GREATEST(0, COALESCE(p_output_tokens, 0)),
    GREATEST(0, COALESCE(p_input_tokens, 0)) + GREATEST(0, COALESCE(p_output_tokens, 0)),
    GREATEST(0, COALESCE(p_cost_cents, 0)),
    p_source_message_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO inserted_id;
  RETURN inserted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION record_llm_cost(
  UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER,
  UUID, TEXT, UUID, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_llm_cost(
  UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER,
  UUID, TEXT, UUID, JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION record_llm_cost(
  UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER,
  UUID, TEXT, UUID, JSONB
) TO service_role;

-- ----------------------------------------------------------------------------
-- Aggregation views — pre-rolled so the admin dashboard doesn't have to
-- compute joins on every page load.
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS client_llm_cost_summary;
CREATE VIEW client_llm_cost_summary AS
SELECT
  c.client_id,
  c.practice_id,
  pm.name AS client_name,
  pm.client_company AS company,
  COUNT(*) AS event_count,
  SUM(c.input_tokens) AS total_input_tokens,
  SUM(c.output_tokens) AS total_output_tokens,
  SUM(c.total_tokens) AS total_tokens,
  SUM(c.cost_cents) AS total_cost_cents,
  SUM(CASE WHEN c.created_at >= date_trunc('month', NOW()) THEN c.cost_cents ELSE 0 END) AS month_cost_cents,
  SUM(CASE WHEN c.created_at >= NOW() - interval '7 days' THEN c.cost_cents ELSE 0 END) AS last_7d_cost_cents,
  SUM(CASE WHEN c.created_at >= NOW() - interval '30 days' THEN c.cost_cents ELSE 0 END) AS last_30d_cost_cents,
  MAX(c.created_at) AS last_event_at
FROM client_llm_costs c
LEFT JOIN practice_members pm ON pm.id = c.client_id
WHERE c.client_id IS NOT NULL
GROUP BY c.client_id, c.practice_id, pm.name, pm.client_company;

DROP VIEW IF EXISTS practice_llm_cost_summary;
CREATE VIEW practice_llm_cost_summary AS
SELECT
  practice_id,
  COUNT(*) AS event_count,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_cents) AS total_cost_cents,
  SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN cost_cents ELSE 0 END) AS month_cost_cents,
  SUM(CASE WHEN created_at >= NOW() - interval '30 days' THEN cost_cents ELSE 0 END) AS last_30d_cost_cents,
  COUNT(DISTINCT client_id) AS active_clients
FROM client_llm_costs
GROUP BY practice_id;

DROP VIEW IF EXISTS llm_cost_by_operation;
CREATE VIEW llm_cost_by_operation AS
SELECT
  practice_id,
  operation_type,
  source_function,
  COUNT(*) AS event_count,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens,
  SUM(cost_cents) AS cost_cents,
  SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN cost_cents ELSE 0 END) AS month_cost_cents
FROM client_llm_costs
GROUP BY practice_id, operation_type, source_function;

GRANT SELECT ON client_llm_cost_summary TO authenticated;
GRANT SELECT ON practice_llm_cost_summary TO authenticated;
GRANT SELECT ON llm_cost_by_operation TO authenticated;

COMMENT ON TABLE client_llm_costs IS
  'Append-only ledger of LLM calls. Every paid model call by an edge '
  'function should write one row via record_llm_cost(). Used by the admin '
  'cost dashboard and per-client cost widgets.';
