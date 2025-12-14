-- ============================================================================
-- SPLIT SPRINT PLAN INTO TWO PARTS
-- ============================================================================
-- Migration: 20251214_split_sprint_plan_trigger.sql
-- Purpose: Update trigger_next_stage to handle sprint_plan_part1 and sprint_plan_part2
-- 
-- New chain:
--   fit_assessment → five_year_vision → six_month_shift → 
--   sprint_plan_part1 → sprint_plan_part2 → value_analysis
-- ============================================================================

-- Update the trigger function to include the split sprint stages
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
BEGIN
  -- Only trigger on status change to 'generated'
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    -- Determine next stage (updated for split sprint plan)
    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan_part1'
      WHEN 'sprint_plan_part1' THEN 'sprint_plan_part2'
      WHEN 'sprint_plan_part2' THEN 'value_analysis'
      ELSE NULL
    END;
    
    -- Queue next stage if exists
    IF next_stage IS NOT NULL THEN
      INSERT INTO generation_queue (practice_id, client_id, stage_type, depends_on_stage)
      VALUES (NEW.practice_id, NEW.client_id, next_stage, NEW.stage_type)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the get_client_roadmap_status function to include the new stages
CREATE OR REPLACE FUNCTION get_client_roadmap_status(p_client_id UUID)
RETURNS TABLE (
  stage_type TEXT,
  status generation_status,
  version INTEGER,
  has_edits BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.stage_type,
    rs.status,
    rs.version,
    rs.approved_content IS DISTINCT FROM rs.generated_content AS has_edits,
    rs.updated_at
  FROM roadmap_stages rs
  WHERE rs.client_id = p_client_id
  AND rs.version = (
    SELECT MAX(version) 
    FROM roadmap_stages 
    WHERE client_id = p_client_id 
    AND stage_type = rs.stage_type
  )
  ORDER BY 
    CASE rs.stage_type
      WHEN 'fit_assessment' THEN 1
      WHEN 'five_year_vision' THEN 2
      WHEN 'six_month_shift' THEN 3
      WHEN 'sprint_plan_part1' THEN 4
      WHEN 'sprint_plan_part2' THEN 5
      WHEN 'sprint_plan' THEN 5  -- Legacy support
      WHEN 'value_analysis' THEN 6
    END;
END;
$$ LANGUAGE plpgsql;

