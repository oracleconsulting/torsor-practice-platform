-- Extend report status to support failure at any Pass 1 phase + keep regenerating
ALTER TABLE sa_audit_reports
DROP CONSTRAINT IF EXISTS sa_audit_reports_status_check;

ALTER TABLE sa_audit_reports
ADD CONSTRAINT sa_audit_reports_status_check
CHECK (status IN (
    'generating',
    'regenerating',
    'generated',
    'approved',
    'published',
    'delivered',
    'pass1_complete',
    'pass2_failed',
    'phase1_failed',
    'phase2_failed',
    'phase3_failed',
    'phase4_failed',
    'phase5_failed',
    'phase6_failed',
    'phase7_failed',
    'phase8_failed'
));
