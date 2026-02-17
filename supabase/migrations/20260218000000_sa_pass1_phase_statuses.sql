-- Allow phase failure statuses for 3-phase Pass 1 (so admin can see which phase failed and retry)
ALTER TABLE sa_audit_reports
DROP CONSTRAINT IF EXISTS sa_audit_reports_status_check;

ALTER TABLE sa_audit_reports
ADD CONSTRAINT sa_audit_reports_status_check
CHECK (status IN (
    'generating',
    'generated',
    'approved',
    'published',
    'delivered',
    'pass1_complete',
    'pass2_failed',
    'phase1_failed',
    'phase2_failed',
    'phase3_failed'
));

COMMENT ON COLUMN sa_audit_reports.status IS 'Report status: generating, phase1/2/3_failed, pass1_complete, generated, pass2_failed, approved, published, delivered';
