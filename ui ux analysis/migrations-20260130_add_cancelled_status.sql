-- Add 'cancelled' to the allowed status values for bm_reports
-- This allows users to cancel stuck report generations

-- Drop the existing constraint
ALTER TABLE bm_reports DROP CONSTRAINT IF EXISTS bm_reports_status_check;

-- Add the new constraint with 'cancelled' included
ALTER TABLE bm_reports ADD CONSTRAINT bm_reports_status_check 
  CHECK (status IN ('pending', 'generating', 'pass1_complete', 'pass2_running', 'generated', 'approved', 'published', 'failed', 'cancelled'));

