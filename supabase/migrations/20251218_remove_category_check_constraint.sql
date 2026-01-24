-- ============================================================================
-- REMOVE CATEGORY CHECK CONSTRAINT
-- ============================================================================
-- Migration: 20251218_remove_category_check_constraint.sql
-- Purpose: Remove restrictive CHECK constraint on client_tasks.category
-- ============================================================================

-- Remove the category CHECK constraint if it exists
DO $$ 
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_tasks_category_check'
    AND conrelid = 'client_tasks'::regclass
  ) THEN
    ALTER TABLE client_tasks DROP CONSTRAINT client_tasks_category_check;
    RAISE NOTICE 'Removed client_tasks_category_check constraint';
  END IF;
END $$;

COMMENT ON COLUMN client_tasks.category IS 'Task category - flexible text field, no restrictions';


