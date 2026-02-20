-- ============================================================================
-- ADD responses JSONB COLUMN TO bm_assessment_responses
-- ============================================================================
-- The code saves responses as a JSON object, but the table only has individual
-- columns. Adding a responses JSONB column to store the raw responses.
-- ============================================================================

ALTER TABLE bm_assessment_responses 
ADD COLUMN IF NOT EXISTS responses JSONB;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bm_assessment_responses_responses ON bm_assessment_responses USING GIN (responses);

