-- ============================================================================
-- SA Preliminary Analysis — Gaps source/severity + Report status constraint
-- ============================================================================
-- Part 3: Support AI-suggested gaps and two-phase generation flow.
-- ============================================================================

-- Add source and severity to sa_engagement_gaps for AI preliminary analysis
ALTER TABLE sa_engagement_gaps
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ai_preliminary'));

ALTER TABLE sa_engagement_gaps
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'important'
    CHECK (severity IN ('blocking', 'important', 'nice_to_have'));

COMMENT ON COLUMN sa_engagement_gaps.source IS
  'Whether this gap was manually added by the practice team or auto-suggested by AI preliminary analysis';
COMMENT ON COLUMN sa_engagement_gaps.severity IS
  'How critical this gap is for report quality — blocking means report would be materially wrong';

-- Update report status constraint to include pipeline statuses
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
    'phase3_failed',
    'phase4_failed',
    'phase5_failed'
  ));
