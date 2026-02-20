-- ============================================================================
-- Add admin guidance columns to sa_audit_reports for two-view system
-- ============================================================================

ALTER TABLE sa_audit_reports 
ADD COLUMN IF NOT EXISTS admin_talking_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_questions_to_ask JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_next_steps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_tasks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_risk_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS client_executive_brief TEXT,
ADD COLUMN IF NOT EXISTS client_roi_summary JSONB;

COMMENT ON COLUMN sa_audit_reports.admin_talking_points IS 'Key points for team to discuss with client';
COMMENT ON COLUMN sa_audit_reports.admin_questions_to_ask IS 'Probing questions to deepen understanding';
COMMENT ON COLUMN sa_audit_reports.admin_next_steps IS 'Recommended actions for the practice team';
COMMENT ON COLUMN sa_audit_reports.admin_tasks IS 'Specific tasks to assign within the team';
COMMENT ON COLUMN sa_audit_reports.admin_risk_flags IS 'Red flags or concerns to be aware of';
COMMENT ON COLUMN sa_audit_reports.client_executive_brief IS 'One-paragraph executive brief for client';
COMMENT ON COLUMN sa_audit_reports.client_roi_summary IS 'Structured ROI data for client presentation';

