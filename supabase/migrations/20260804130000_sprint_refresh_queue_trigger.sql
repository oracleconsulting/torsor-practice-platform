-- ============================================================================
-- Sprint refresh: queue trigger, debounce and fallback sweep
-- ============================================================================
-- generate-sprint-refresh is never called inline. Roadmap generation has
-- exceeded the ~150s edge function budget before, so every refresh is queued
-- and picked up by roadmap-orchestrator.
--
-- Two ways a refresh is queued:
--   A. The client submits or edits a checkpoint review (weeks 3, 6, 9).
--   B. Seven days after the checkpoint week's life pulse with no review.
--
-- Parts of this were applied directly to the database before the migration was
-- written. Everything below is idempotent and matches the live definitions, so
-- it is a no-op there and reproduces the same state on a fresh environment.
-- ============================================================================

-- 1. QUEUE COLUMNS -----------------------------------------------------------

ALTER TABLE generation_queue ADD COLUMN IF NOT EXISTS checkpoint_week INTEGER;
ALTER TABLE generation_queue ADD COLUMN IF NOT EXISTS needs_rerun BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN generation_queue.checkpoint_week IS
  'Sprint checkpoint (3, 6 or 9) for sprint_refresh jobs. NULL for every other stage type.';
COMMENT ON COLUMN generation_queue.needs_rerun IS
  'Set when a review is resubmitted while the job is already processing. The orchestrator re-queues once the current run finishes.';

-- One pending refresh per checkpoint, so a resubmission replaces the waiting
-- job instead of queueing a second one. Other stage types keep their own guard.
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_sprint_refresh_pending
  ON generation_queue (client_id, sprint_number, checkpoint_week)
  WHERE status = 'pending' AND stage_type = 'sprint_refresh';

CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_unique_pending
  ON generation_queue (client_id, stage_type)
  WHERE status = 'pending' AND stage_type IS DISTINCT FROM 'sprint_refresh';

-- 2. ENQUEUE WITH DEBOUNCE ---------------------------------------------------
-- Already generating: mark for re-run rather than start a parallel generation.
-- Already pending: refresh the waiting row in place.
-- Otherwise: queue a new job.

CREATE OR REPLACE FUNCTION enqueue_sprint_refresh(
  p_client_id UUID,
  p_practice_id UUID,
  p_sprint_number INTEGER,
  p_checkpoint_week INTEGER
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processing_id UUID;
  v_pending_id UUID;
  v_new_id UUID;
BEGIN
  IF p_checkpoint_week NOT IN (3, 6, 9) THEN
    RAISE EXCEPTION 'checkpoint_week must be 3, 6 or 9';
  END IF;

  SELECT id INTO v_processing_id
  FROM generation_queue
  WHERE client_id = p_client_id
    AND stage_type = 'sprint_refresh'
    AND COALESCE(sprint_number, 1) = COALESCE(p_sprint_number, 1)
    AND checkpoint_week = p_checkpoint_week
    AND status = 'processing'
  ORDER BY started_at DESC NULLS LAST
  LIMIT 1;

  IF v_processing_id IS NOT NULL THEN
    UPDATE generation_queue
    SET needs_rerun = TRUE,
        queued_at = NOW()
    WHERE id = v_processing_id;
    RETURN v_processing_id;
  END IF;

  SELECT id INTO v_pending_id
  FROM generation_queue
  WHERE client_id = p_client_id
    AND stage_type = 'sprint_refresh'
    AND COALESCE(sprint_number, 1) = COALESCE(p_sprint_number, 1)
    AND checkpoint_week = p_checkpoint_week
    AND status = 'pending'
  LIMIT 1;

  IF v_pending_id IS NOT NULL THEN
    UPDATE generation_queue
    SET practice_id = p_practice_id,
        queued_at = NOW(),
        last_error = NULL,
        needs_rerun = FALSE,
        priority = GREATEST(COALESCE(priority, 0), 5)
    WHERE id = v_pending_id;
    RETURN v_pending_id;
  END IF;

  INSERT INTO generation_queue (
    practice_id, client_id, stage_type, sprint_number, checkpoint_week, status, priority, needs_rerun
  ) VALUES (
    p_practice_id, p_client_id, 'sprint_refresh', COALESCE(p_sprint_number, 1), p_checkpoint_week, 'pending', 5, FALSE
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER A: REVIEW SUBMITTED OR EDITED -----------------------------------
-- The review is optional and must never gate the client, so a queueing failure
-- warns and lets the write through. The fallback sweep picks it up later.

CREATE OR REPLACE FUNCTION trg_enqueue_sprint_refresh_on_review()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.checkpoint_week IN (3, 6, 9) THEN
    BEGIN
      PERFORM enqueue_sprint_refresh(
        NEW.client_id, NEW.practice_id, COALESCE(NEW.sprint_number, 1), NEW.checkpoint_week
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not queue sprint refresh for client %: %', NEW.client_id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sprint_checkpoint_review_enqueue ON sprint_checkpoint_reviews;
CREATE TRIGGER trg_sprint_checkpoint_review_enqueue
  AFTER INSERT OR UPDATE ON sprint_checkpoint_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trg_enqueue_sprint_refresh_on_review();

-- 4. TRIGGER B: FALLBACK SWEEP -----------------------------------------------
-- Seven days after a checkpoint week's pulse with no review submitted, queue
-- the refresh anyway. Guarded on "no queue row for this checkpoint in any
-- status" so a client who never reviews is swept exactly once per checkpoint.

CREATE OR REPLACE FUNCTION enqueue_due_sprint_refreshes()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT DISTINCT ON (p.client_id, COALESCE(p.sprint_number, 1), p.week_number)
      p.client_id,
      COALESCE(p.sprint_number, 1) AS sprint_number,
      p.week_number AS checkpoint_week,
      COALESCE(p.practice_id, pm.practice_id) AS practice_id
    FROM life_pulse_entries p
    JOIN practice_members pm ON pm.id = p.client_id
    WHERE p.week_number IN (3, 6, 9)
      AND p.created_at <= NOW() - INTERVAL '7 days'
      AND COALESCE(p.practice_id, pm.practice_id) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM sprint_checkpoint_reviews r
        WHERE r.client_id = p.client_id
          AND COALESCE(r.sprint_number, 1) = COALESCE(p.sprint_number, 1)
          AND r.checkpoint_week = p.week_number
      )
      AND NOT EXISTS (
        SELECT 1 FROM generation_queue q
        WHERE q.client_id = p.client_id
          AND q.stage_type = 'sprint_refresh'
          AND COALESCE(q.sprint_number, 1) = COALESCE(p.sprint_number, 1)
          AND q.checkpoint_week = p.week_number
      )
    ORDER BY p.client_id, COALESCE(p.sprint_number, 1), p.week_number, p.created_at ASC
  LOOP
    BEGIN
      PERFORM enqueue_sprint_refresh(
        v_row.client_id, v_row.practice_id, v_row.sprint_number, v_row.checkpoint_week
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Sweep could not queue client % week %: %',
        v_row.client_id, v_row.checkpoint_week, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule the sweep where pg_cron is available. Where it is not,
-- roadmap-orchestrator calls enqueue_due_sprint_refreshes on every run.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sprint-refresh-fallback-sweep') THEN
      PERFORM cron.unschedule('sprint-refresh-fallback-sweep');
    END IF;
    PERFORM cron.schedule(
      'sprint-refresh-fallback-sweep',
      '0 6 * * *',
      'SELECT public.enqueue_due_sprint_refreshes()'
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed. Sweep runs from roadmap-orchestrator instead.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule sprint refresh sweep: %. Orchestrator fallback still applies.', SQLERRM;
END $$;

-- 5. DO NOT CHAIN THE PIPELINE OFF A REFRESH VERSION -------------------------
-- A refresh inserts a new roadmap_stages row with status 'generated'. The
-- existing AFTER INSERT trigger reads that as "the next pipeline stage is due"
-- and re-queues value_analysis and everything downstream. Body is otherwise
-- unchanged from 20260328000001_advisory_brief_trigger_chain.sql.

CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
  v_sprint_number INTEGER;
BEGIN
  IF NEW.metadata ->> 'refreshKind' = 'sprint_checkpoint' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status != 'generated') THEN
    v_sprint_number := COALESCE(NEW.sprint_number, 1);

    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan_part1'
      WHEN 'sprint_plan_part1' THEN 'sprint_plan_part2'
      WHEN 'sprint_plan_part2' THEN 'value_analysis'
      WHEN 'value_analysis' THEN 'advisory_brief'
      WHEN 'sprint_plan' THEN 'value_analysis'
      WHEN 'life_design_refresh' THEN 'vision_update'
      WHEN 'vision_update' THEN 'shift_update'
      WHEN 'shift_update' THEN 'sprint_plan_part1'
      ELSE NULL
    END;

    IF next_stage IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM generation_queue
        WHERE client_id = NEW.client_id
          AND stage_type = next_stage
          AND COALESCE(sprint_number, 1) = v_sprint_number
          AND status IN ('pending', 'processing')
      ) THEN
        INSERT INTO generation_queue (practice_id, client_id, stage_type, depends_on_stage, status, sprint_number)
        VALUES (NEW.practice_id, NEW.client_id, next_stage, NEW.stage_type, 'pending', v_sprint_number);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. GRANTS ------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION enqueue_sprint_refresh(UUID, UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION enqueue_due_sprint_refreshes() TO service_role;
