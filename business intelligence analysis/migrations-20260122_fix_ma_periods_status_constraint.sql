-- ============================================================================
-- FIX: MA Periods Status CHECK Constraint
-- ============================================================================
-- The status CHECK constraint was missing 'delivered' as an allowed value.
-- This migration fixes the constraint to allow all expected status values.
-- ============================================================================

-- Drop the old constraint (it may have different names in different envs)
ALTER TABLE ma_periods DROP CONSTRAINT IF EXISTS ma_periods_status_check;
ALTER TABLE ma_periods DROP CONSTRAINT IF EXISTS ma_periods_status_check1;

-- Add new constraint with all status values including 'delivered'
ALTER TABLE ma_periods ADD CONSTRAINT ma_periods_status_check 
CHECK (status IS NULL OR status IN (
  'pending',           -- Awaiting data
  'data_received',     -- Xero data pulled/uploaded
  'in_progress',       -- Being prepared
  'review',            -- Ready for review
  'approved',          -- Reviewed and approved
  'delivered',         -- Sent to client
  'client_reviewed',   -- Client has viewed
  -- Additional statuses that may be used
  'documents_uploaded',
  'data_extracted',
  'insights_generated',
  'team_review',
  'ready_for_call',
  'call_complete'
));

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'MA Periods status constraint updated to include delivered';
END $$;


