-- Allow in_progress and pending status for bm_engagements (client autosave / in-progress state)
ALTER TABLE bm_engagements DROP CONSTRAINT IF EXISTS bm_engagements_status_check;
ALTER TABLE bm_engagements ADD CONSTRAINT bm_engagements_status_check
  CHECK (status IN (
    'draft',
    'pending',
    'in_progress',
    'assessment_complete',
    'pass1_complete',
    'generated',
    'approved',
    'published',
    'delivered',
    'cancelled'
  ));

COMMENT ON COLUMN bm_engagements.status IS 'draft/pending = not started, in_progress = client filling assessment, assessment_complete+ = pipeline states';
