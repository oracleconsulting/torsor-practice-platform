-- ============================================================================
-- ADD CALL CONTEXT TO MA ASSESSMENT REPORTS
-- ============================================================================
-- Persists call capture data (notes, transcript, gaps filled, objections, etc.)
-- so it survives page refreshes
-- ============================================================================

-- Add call_context JSONB column to store captured context from calls
ALTER TABLE ma_assessment_reports 
ADD COLUMN IF NOT EXISTS call_context JSONB DEFAULT '{}';

-- Add a comment explaining the structure
COMMENT ON COLUMN ma_assessment_reports.call_context IS 
'Stores captured call context: callNotes, callTranscript, gapsFilled, tierDiscussed, clientObjections, additionalInsights, completedPhases';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'call_context column added to ma_assessment_reports';
END $$;



