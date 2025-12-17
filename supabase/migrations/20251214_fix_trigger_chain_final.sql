-- ============================================================================
-- FIX TRIGGER CHAIN - FINAL CONSOLIDATED VERSION
-- ============================================================================
-- Migration: 20251214_fix_trigger_chain_final.sql
-- Purpose: Ensure correct 6-stage chain with split sprint plans
-- 
-- Correct chain:
--   fit_assessment → five_year_vision → six_month_shift → 
--   sprint_plan_part1 → sprint_plan_part2 → value_analysis
--
-- This fixes the bug where 20251216_add_value_analysis_to_trigger_chain.sql
-- accidentally overwrote the split sprint chain with the old single sprint_plan
-- ============================================================================

-- Drop and recreate the trigger function with correct chain
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
BEGIN
  -- Only trigger on status change to 'generated'
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    -- Determine next stage in the 6-stage chain
    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan_part1'
      WHEN 'sprint_plan_part1' THEN 'sprint_plan_part2'
      WHEN 'sprint_plan_part2' THEN 'value_analysis'
      -- Legacy support: if old sprint_plan completes, go to value_analysis
      WHEN 'sprint_plan' THEN 'value_analysis'
      ELSE NULL
    END;
    
    -- Queue next stage if exists
    IF next_stage IS NOT NULL THEN
      -- Log for debugging
      RAISE NOTICE 'trigger_next_stage: % completed, queuing %', NEW.stage_type, next_stage;
      
      -- Check if already queued/processing to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM generation_queue 
        WHERE client_id = NEW.client_id 
        AND stage_type = next_stage 
        AND status IN ('pending', 'processing')
      ) THEN
        INSERT INTO generation_queue (practice_id, client_id, stage_type, depends_on_stage, status)
        VALUES (NEW.practice_id, NEW.client_id, next_stage, NEW.stage_type, 'pending');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_roadmap_stage_generated ON roadmap_stages;
CREATE TRIGGER on_roadmap_stage_generated
  AFTER UPDATE ON roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_next_stage();

-- Also add trigger for INSERT (when stage is created with status='generated')
DROP TRIGGER IF EXISTS on_roadmap_stage_generated_insert ON roadmap_stages;
CREATE TRIGGER on_roadmap_stage_generated_insert
  AFTER INSERT ON roadmap_stages
  FOR EACH ROW
  WHEN (NEW.status = 'generated')
  EXECUTE FUNCTION trigger_next_stage();

-- Log that migration was applied
DO $$
BEGIN
  RAISE NOTICE 'trigger_next_stage function updated with correct 6-stage chain';
END $$;

