-- ============================================================================
-- Adaptive Assessment Metadata
-- ============================================================================
-- Add metadata column to client_assessments for adaptive assessment tracking.
-- Tracks which sections were skipped, why, and what enrichment data was available.
-- ============================================================================

ALTER TABLE client_assessments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN client_assessments.metadata IS
  'Adaptive assessment metadata: tracks which sections were skipped, why they were skipped, and what enrichment data was available.';
