-- ============================================================================
-- SA SUBMISSION FLOW — Review & Submit Before Assessment
-- ============================================================================
-- Migration: 20260226000002_sa_submission_flow.sql
--
-- Adds submission_status to sa_engagements so clients can freely edit
-- all 3 stages until they formally submit for assessment.
-- After submission, answers are locked (enforced in frontend).
--
-- SAFE: All columns use IF NOT EXISTS, defaults maintain current behaviour.
-- Backfill treats existing completed engagements as submitted.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. SUBMISSION STATUS COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'draft';

-- Add check constraint separately (safe if column already exists with different constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sa_engagements_submission_status_check'
  ) THEN
    ALTER TABLE sa_engagements
      ADD CONSTRAINT sa_engagements_submission_status_check
      CHECK (submission_status IN ('draft', 'in_review', 'submitted'));
  END IF;
END $$;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS submission_notes TEXT;

COMMENT ON COLUMN sa_engagements.submission_status IS
  'draft = client still editing stages, in_review = client on review page, submitted = locked for assessment';

COMMENT ON COLUMN sa_engagements.submitted_at IS
  'When the client formally submitted all stages for assessment. After this point, answers are read-only for the client.';

COMMENT ON COLUMN sa_engagements.submission_notes IS
  'Optional notes from client at submission time (e.g. "Still waiting for IT team to confirm system details")';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_sa_engagements_submission_status
  ON sa_engagements (submission_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BACKFILL: Existing engagements that are past Stage 3 → mark as submitted
-- ═══════════════════════════════════════════════════════════════════════════════

-- Any engagement that already has stage_3_completed_at set has been through
-- the old flow where completion was immediate. Treat these as submitted.
UPDATE sa_engagements
SET submission_status = 'submitted',
    submitted_at = COALESCE(stage_3_completed_at, NOW())
WHERE stage_3_completed_at IS NOT NULL
  AND submission_status = 'draft';

-- Any engagement already in analysis or later is definitely submitted
UPDATE sa_engagements
SET submission_status = 'submitted',
    submitted_at = COALESCE(stage_3_completed_at, updated_at, NOW())
WHERE status IN ('stage_3_complete', 'analysis_complete', 'report_delivered', 'implementation', 'completed')
  AND submission_status = 'draft';
