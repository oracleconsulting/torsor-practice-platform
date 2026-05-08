-- ============================================================================
-- SPRINT CHANGE LOCK
-- ============================================================================
-- Locks a client's roadmap content for the duration of an active sprint.
-- While locked:
--   - apply_roadmap_change() refuses writes and returns ok=false with the
--     unlock date in the error JSON.
--   - The advisory-agent edge function detects the lock from
--     is_client_change_locked() and instructs the LLM to discuss but not
--     propose changes.
--
-- A sprint is "active" when:
--   sprint_start_date IS NOT NULL AND sprint_completed_at IS NULL
--
-- The sprint completes either:
--   - Manually (admin sets sprint_completed_at on client_service_lines).
--   - Naturally (calendar reaches sprint_start_date + 84 days). Code paths
--     that read the lock honour both: the function returns "unlocked" once
--     calendar has passed 84 days, even if sprint_completed_at hasn't been
--     written yet, so we never get stuck if a manual flip is forgotten.
--
-- Between sprints (after sprint_completed_at, before next sprint_start_date)
-- the roadmap is unlocked — that's the editing window.
-- ============================================================================

-- 1. Add the completion timestamp column to client_service_lines
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE client_service_lines
    ADD COLUMN IF NOT EXISTS sprint_completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2. Helper function: is_client_change_locked
-- ----------------------------------------------------------------------------
-- Returns the lock status as JSONB so callers (RPCs and the edge function)
-- get a single source of truth:
--
--   {
--     "locked": true,
--     "service_line_code": "365_method",
--     "sprint_number": 1,
--     "sprint_start_date": "2026-05-05",
--     "calendar_unlock_date": "2026-07-28",   -- start + 84 days
--     "active_week": 4,                       -- floor((today - start)/7)+1
--     "reason": "Sprint 1 in progress, week 4 of 12"
--   }
--
-- When unlocked, returns { "locked": false }.

CREATE OR REPLACE FUNCTION is_client_change_locked(
  p_client_id UUID,
  p_service_line_code TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  enrollment RECORD;
  unlock_date DATE;
  weeks_in INT;
  active_week INT;
BEGIN
  -- Pick the most recent enrolment with a sprint_start_date set. When a
  -- specific service_line_code is supplied, scope to it.
  SELECT csl.current_sprint_number,
         csl.sprint_start_date,
         csl.sprint_completed_at,
         sl.code AS service_code
  INTO enrollment
  FROM client_service_lines csl
  JOIN service_lines sl ON sl.id = csl.service_line_id
  WHERE csl.client_id = p_client_id
    AND csl.sprint_start_date IS NOT NULL
    AND (p_service_line_code IS NULL OR sl.code = p_service_line_code)
  ORDER BY csl.sprint_start_date DESC
  LIMIT 1;

  IF enrollment IS NULL THEN
    RETURN jsonb_build_object('locked', false, 'reason', 'no active sprint');
  END IF;

  -- Manually marked complete -> unlocked.
  IF enrollment.sprint_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'locked', false,
      'reason', 'sprint marked complete',
      'service_line_code', enrollment.service_code,
      'sprint_number', enrollment.current_sprint_number,
      'sprint_start_date', enrollment.sprint_start_date,
      'sprint_completed_at', enrollment.sprint_completed_at
    );
  END IF;

  unlock_date := enrollment.sprint_start_date + INTERVAL '84 days';
  weeks_in := GREATEST(0, FLOOR((CURRENT_DATE - enrollment.sprint_start_date) / 7));
  active_week := LEAST(12, GREATEST(1, weeks_in + 1));

  -- Calendar already past 84 days -> auto-unlocked even without manual flag.
  IF CURRENT_DATE >= unlock_date THEN
    RETURN jsonb_build_object(
      'locked', false,
      'reason', 'sprint calendar window has elapsed',
      'service_line_code', enrollment.service_code,
      'sprint_number', enrollment.current_sprint_number,
      'sprint_start_date', enrollment.sprint_start_date,
      'calendar_unlock_date', unlock_date
    );
  END IF;

  RETURN jsonb_build_object(
    'locked', true,
    'service_line_code', enrollment.service_code,
    'sprint_number', enrollment.current_sprint_number,
    'sprint_start_date', enrollment.sprint_start_date,
    'calendar_unlock_date', unlock_date,
    'active_week', active_week,
    'reason', format(
      'Sprint %s in progress, week %s of 12. Lock lifts on %s (or sooner if manually marked complete).',
      enrollment.current_sprint_number,
      active_week,
      to_char(unlock_date, 'FMDD Mon YYYY')
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

REVOKE ALL ON FUNCTION is_client_change_locked(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_client_change_locked(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION is_client_change_locked IS
  'Returns lock state for a client. Locked while a sprint is active '
  '(sprint_start_date set, sprint_completed_at null, and calendar < start+84d). '
  'Used by apply_roadmap_change and the advisory agent.';

-- 3. Update apply_roadmap_change to honour the lock
-- ----------------------------------------------------------------------------
-- Reuses the existing function signature so callers don't change. When the
-- lock is active, returns { ok: false, locked: true, ... } so the panel can
-- render an informative message instead of writing.

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
  lock_state JSONB;
BEGIN
  -- Lock check: refuse writes when the client's sprint is in flight.
  lock_state := is_client_change_locked(p_client_id, NULL);
  IF (lock_state->>'locked')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'ok', false,
      'locked', true,
      'lock_state', lock_state,
      'error', format(
        'Roadmap is locked while %s',
        lock_state->>'reason'
      )
    );
  END IF;

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

-- 4. Convenience: mark sprint complete (admin-callable)
-- ----------------------------------------------------------------------------
-- Sets sprint_completed_at on the GA enrolment for a client. Idempotent —
-- writing twice is a no-op. Used by the admin UI when an advisor manually
-- closes out a sprint.

CREATE OR REPLACE FUNCTION mark_sprint_complete(
  p_client_id UUID,
  p_service_line_code TEXT DEFAULT '365_method'
) RETURNS JSONB AS $$
DECLARE
  rows_affected INT;
BEGIN
  UPDATE client_service_lines csl
  SET sprint_completed_at = NOW()
  FROM service_lines sl
  WHERE csl.service_line_id = sl.id
    AND csl.client_id = p_client_id
    AND sl.code = p_service_line_code
    AND csl.sprint_start_date IS NOT NULL
    AND csl.sprint_completed_at IS NULL;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN jsonb_build_object(
    'ok', true,
    'rows_affected', rows_affected,
    'service_line_code', p_service_line_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION mark_sprint_complete(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_sprint_complete(UUID, TEXT) TO authenticated;
