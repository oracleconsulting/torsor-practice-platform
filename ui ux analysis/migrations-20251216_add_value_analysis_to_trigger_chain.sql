-- ============================================================================
-- ADD VALUE_ANALYSIS TO TRIGGER CHAIN
-- ============================================================================
-- Migration: 20251216_add_value_analysis_to_trigger_chain.sql
-- Purpose: Update trigger_next_stage to queue value_analysis after sprint_plan
-- ============================================================================

-- Update the trigger function to include value_analysis in the chain
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
BEGIN
  -- Only trigger on status change to 'generated'
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    -- Determine next stage
    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan'
      WHEN 'sprint_plan' THEN 'value_analysis'
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

