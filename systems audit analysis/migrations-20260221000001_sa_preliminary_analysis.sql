-- ============================================================================
-- SA Preliminary Analysis — Two-Phase Report Generation
-- ============================================================================
-- Stores output of the fast "analyze-sa-preliminary" AI call used to assess
-- data quality and suggest gaps before full report generation.
-- ============================================================================

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS preliminary_analysis JSONB;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS preliminary_analysis_at TIMESTAMPTZ;

COMMENT ON COLUMN sa_engagements.preliminary_analysis IS
  'Structured output from analyze-sa-preliminary: businessSnapshot, confidenceScores, suggestedGaps, contradictions, topInsights, stats.';

COMMENT ON COLUMN sa_engagements.preliminary_analysis_at IS
  'When the preliminary analysis was last run (idempotent — re-run overwrites).';
