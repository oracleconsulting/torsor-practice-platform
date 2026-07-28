-- ============================================================================
-- Rolling sprint week schedule
-- ============================================================================
-- Week start dates re-anchor when a Life Pulse is submitted: closing week N
-- stamps week N+1 as the following Monday (Europe/London), so paused clients
-- are not permanently "behind" a fixed calendar from enrolment.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprint_week_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  starts_on DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'rollover'
    CHECK (source IN ('initial', 'rollover', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, sprint_number, week_number)
);

CREATE INDEX IF NOT EXISTS idx_sprint_week_schedule_client_sprint
  ON sprint_week_schedule(client_id, sprint_number);

ALTER TABLE sprint_week_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own week schedule" ON sprint_week_schedule;
CREATE POLICY "Clients can view own week schedule"
  ON sprint_week_schedule FOR SELECT
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can insert own week schedule" ON sprint_week_schedule;
CREATE POLICY "Clients can insert own week schedule"
  ON sprint_week_schedule FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update own week schedule" ON sprint_week_schedule;
CREATE POLICY "Clients can update own week schedule"
  ON sprint_week_schedule FOR UPDATE
  USING (client_id IN (SELECT id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can view week schedule" ON sprint_week_schedule;
CREATE POLICY "Practice can view week schedule"
  ON sprint_week_schedule FOR SELECT
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Practice can manage week schedule" ON sprint_week_schedule;
CREATE POLICY "Practice can manage week schedule"
  ON sprint_week_schedule FOR ALL
  USING (practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid()));

COMMENT ON TABLE sprint_week_schedule IS
  'Per-client rolling week start dates. Week 1 is initial (enrolment); later weeks are stamped on Life Pulse submit as the following Monday.';

-- Stamp next week's Monday when a pulse is first inserted (SECURITY DEFINER so
-- RLS does not block the schedule write from the client pulse insert).
CREATE OR REPLACE FUNCTION schedule_next_sprint_week()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_week  INTEGER := NEW.week_number + 1;
  next_start DATE := (
    date_trunc('week', (NEW.created_at AT TIME ZONE 'Europe/London'))
  )::date + 7;
BEGIN
  IF next_week > 12 THEN
    RETURN NEW;
  END IF;

  INSERT INTO sprint_week_schedule
    (client_id, practice_id, sprint_number, week_number, starts_on, source)
  VALUES
    (NEW.client_id, NEW.practice_id, NEW.sprint_number, next_week, next_start, 'rollover')
  ON CONFLICT (client_id, sprint_number, week_number)
  DO UPDATE SET
    starts_on = EXCLUDED.starts_on,
    source = 'rollover',
    updated_at = NOW()
  WHERE sprint_week_schedule.source <> 'manual';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_next_week ON life_pulse_entries;
CREATE TRIGGER trg_schedule_next_week
  AFTER INSERT ON life_pulse_entries
  FOR EACH ROW
  EXECUTE FUNCTION schedule_next_sprint_week();

-- Backfill week 1 from enrolment sprint_start_date
INSERT INTO sprint_week_schedule
  (client_id, practice_id, sprint_number, week_number, starts_on, source)
SELECT
  csl.client_id,
  csl.practice_id,
  COALESCE(csl.current_sprint_number, 1),
  1,
  csl.sprint_start_date,
  'initial'
FROM client_service_lines csl
INNER JOIN service_lines sl
  ON sl.id = csl.service_line_id
 AND sl.code = '365_method'
WHERE csl.sprint_start_date IS NOT NULL
ON CONFLICT (client_id, sprint_number, week_number) DO NOTHING;

-- Replay existing pulses through the same rollover rule (ordered so later weeks win)
INSERT INTO sprint_week_schedule
  (client_id, practice_id, sprint_number, week_number, starts_on, source)
SELECT
  p.client_id,
  p.practice_id,
  p.sprint_number,
  p.week_number + 1,
  (date_trunc('week', (p.created_at AT TIME ZONE 'Europe/London')))::date + 7,
  'rollover'
FROM life_pulse_entries p
WHERE p.week_number < 12
ORDER BY p.created_at ASC
ON CONFLICT (client_id, sprint_number, week_number)
DO UPDATE SET
  starts_on = EXCLUDED.starts_on,
  source = 'rollover',
  updated_at = NOW()
WHERE sprint_week_schedule.source <> 'manual';
