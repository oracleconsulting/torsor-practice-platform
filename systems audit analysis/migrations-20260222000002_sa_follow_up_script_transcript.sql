-- ============================================================================
-- SA Follow-Up Call Script + Transcript Processing (Part 3 Addendum)
-- ============================================================================

-- Call script generated from accepted gaps
ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS follow_up_script JSONB;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS follow_up_script_generated_at TIMESTAMPTZ;

-- Raw transcript from the follow-up call
ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS follow_up_transcript TEXT;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS follow_up_transcript_uploaded_at TIMESTAMPTZ;

-- Processed transcript extraction (AI output mapping answers to gaps)
ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS transcript_extraction JSONB;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS transcript_processed_at TIMESTAMPTZ;

COMMENT ON COLUMN sa_engagements.follow_up_script IS
  'AI-generated call script structured by topic. Built from accepted gaps, contradictions, and business snapshot.';

COMMENT ON COLUMN sa_engagements.follow_up_transcript IS
  'Raw transcript or notes from the follow-up call. Pasted by practice team or extracted from recording.';

COMMENT ON COLUMN sa_engagements.transcript_extraction IS
  'AI extraction: maps transcript content to specific gaps with quoted evidence. Used to auto-resolve gaps.';
