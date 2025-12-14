-- ============================================================================
-- FIX GENERATION_QUEUE RLS POLICIES
-- ============================================================================
-- Migration: 20251216_fix_generation_queue_rls.sql
-- Purpose: Add missing INSERT and UPDATE policies for generation_queue table
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Practice members can insert into their practice's queue" ON generation_queue;
DROP POLICY IF EXISTS "Practice members can update their practice's queue" ON generation_queue;

-- Add INSERT policy for generation_queue
CREATE POLICY "Practice members can insert into their practice's queue"
  ON generation_queue FOR INSERT
  WITH CHECK (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Add UPDATE policy for generation_queue
CREATE POLICY "Practice members can update their practice's queue"
  ON generation_queue FOR UPDATE
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE id = auth.uid()
    )
  );

-- Also update the trigger function to use SECURITY DEFINER so it can insert
-- even when called from contexts where RLS might block it
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

