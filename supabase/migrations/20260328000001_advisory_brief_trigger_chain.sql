-- Add advisory_brief to the generation trigger chain (after value_analysis)
-- Also ensure the trigger function exists and handles all current stage types

CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
  v_sprint_number INTEGER;
BEGIN
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

-- Ensure the trigger is attached
DROP TRIGGER IF EXISTS trg_roadmap_stages_next ON roadmap_stages;
CREATE TRIGGER trg_roadmap_stages_next
  AFTER UPDATE ON roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_next_stage();
