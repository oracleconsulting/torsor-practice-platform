-- ============================================================================
-- Update sa_audit_reports status check constraint to include two-pass statuses
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE sa_audit_reports 
DROP CONSTRAINT IF EXISTS sa_audit_reports_status_check;

-- Add the new constraint with all statuses including two-pass statuses
ALTER TABLE sa_audit_reports 
ADD CONSTRAINT sa_audit_reports_status_check 
CHECK (status IN (
    'generating',        -- Original statuses
    'generated',
    'approved',
    'published',
    'delivered',
    'pass1_complete',    -- Two-pass generation statuses
    'pass2_failed'       -- Two-pass generation statuses
));

COMMENT ON COLUMN sa_audit_reports.status IS 'Report generation status: generating, pass1_complete, generated, pass2_failed, approved, published, delivered';

