-- ============================================================================
-- ADD EXTRACTED METRICS COLUMN
-- ============================================================================
-- Stores financial metrics extracted locally from documents
-- These are NEVER sent to LLM providers - stored locally for valuation
-- ============================================================================

-- Add column if it doesn't exist
ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS extracted_metrics JSONB DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN client_context.extracted_metrics IS 
'Locally extracted financial metrics from documents. NEVER sent to LLM. Used for valuation calculations.';

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_client_context_extracted_metrics 
ON client_context USING gin (extracted_metrics);

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'client_context'
ORDER BY ordinal_position;

