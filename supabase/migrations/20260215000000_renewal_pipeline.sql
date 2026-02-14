-- ============================================================================
-- RENEWAL PIPELINE (Phase 4)
-- ============================================================================
-- quarterly_life_checks, renewal_status, generation_queue sprint_number,
-- client_tasks sprint_number, trigger_next_stage renewal chain
-- ============================================================================

-- 1. Quarterly Life Check (one per sprint renewal)
CREATE TABLE IF NOT EXISTS quarterly_life_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  practice_id UUID NOT NULL REFERENCES practices(id),
  sprint_number INTEGER NOT NULL,

  tuesday_test_update TEXT,
  time_reclaim_progress TEXT,
  biggest_win TEXT,
  biggest_frustration TEXT,
  priority_shift TEXT,
  next_sprint_wish TEXT,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, sprint_number)
);

CREATE INDEX IF NOT EXISTS idx_qlc_client_sprint ON quarterly_life_checks(client_id, sprint_number);

ALTER TABLE quarterly_life_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own life checks" ON quarterly_life_checks;
CREATE POLICY "Clients can view own life checks"
  ON quarterly_life_checks FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own life checks" ON quarterly_life_checks;
CREATE POLICY "Clients can insert own life checks"
  ON quarterly_life_checks FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own life checks" ON quarterly_life_checks;
CREATE POLICY "Clients can update own life checks"
  ON quarterly_life_checks FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Practice members can view life checks" ON quarterly_life_checks;
CREATE POLICY "Practice members can view life checks"
  ON quarterly_life_checks FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE id = auth.uid()));

COMMENT ON TABLE quarterly_life_checks IS
  'Lightweight reassessment between sprints. 6 questions that update life design priorities for the next sprint.';

-- 2. Renewal status on client_service_lines
ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS renewal_status TEXT DEFAULT 'not_started';
ALTER TABLE client_service_lines DROP CONSTRAINT IF EXISTS client_service_lines_renewal_status_check;
ALTER TABLE client_service_lines ADD CONSTRAINT client_service_lines_renewal_status_check
  CHECK (renewal_status IN ('not_started', 'life_check_pending', 'life_check_complete', 'generating', 'review_pending', 'published'));

-- 3. generation_queue sprint_number
ALTER TABLE generation_queue ADD COLUMN IF NOT EXISTS sprint_number INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_generation_queue_sprint ON generation_queue(client_id, stage_type, sprint_number);

-- 4. client_tasks sprint_number and unique constraint
ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS sprint_number INTEGER DEFAULT 1;
ALTER TABLE client_tasks DROP CONSTRAINT IF EXISTS client_tasks_client_id_week_number_title_key;
ALTER TABLE client_tasks ADD CONSTRAINT client_tasks_client_id_week_number_title_sprint_key
  UNIQUE (client_id, week_number, title, sprint_number);

CREATE INDEX IF NOT EXISTS idx_client_tasks_sprint ON client_tasks(client_id, sprint_number);

-- 5. Trigger: add renewal chain and sprint_number
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
  v_sprint_number INTEGER;
BEGIN
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    v_sprint_number := COALESCE(NEW.sprint_number, 1);

    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan_part1'
      WHEN 'sprint_plan_part1' THEN 'sprint_plan_part2'
      WHEN 'sprint_plan_part2' THEN 'value_analysis'
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

-- 6. Tier → max_sprints for existing 365_method enrollments (client_service_lines uses service_line_id FK)
UPDATE client_service_lines csl
SET max_sprints = CASE
  WHEN csl.tier_name = 'Lite' THEN 1
  WHEN csl.tier_name = 'Growth' THEN 4
  WHEN csl.tier_name = 'Partner' THEN 4
  ELSE COALESCE(csl.max_sprints, 1)
END
FROM service_lines sl
WHERE csl.service_line_id = sl.id
  AND sl.code = '365_method'
  AND (csl.max_sprints IS NULL OR csl.max_sprints = 0);
