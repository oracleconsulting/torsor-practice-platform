-- ============================================================================
-- FIX DISCOVERY TRIGGER
-- ============================================================================
-- The trigger was checking for columns that don't exist.
-- The destination_discovery table stores responses in a JSONB 'responses' column
-- ============================================================================

-- Drop the broken trigger
DROP TRIGGER IF EXISTS trigger_update_discovery_status ON destination_discovery;

-- Fix the function to check JSONB responses column instead of non-existent columns
CREATE OR REPLACE FUNCTION update_discovery_engagement_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if key required fields are filled in the JSONB responses column
    -- The responses are stored as: responses->>'dd_five_year_vision' etc.
    IF NEW.responses IS NOT NULL 
       AND NEW.responses->>'dd_five_year_vision' IS NOT NULL 
       AND NEW.responses->>'dd_change_readiness' IS NOT NULL 
       AND NEW.responses->>'sd_financial_confidence' IS NOT NULL THEN
        
        UPDATE discovery_engagements
        SET status = 'responses_complete',
            assessment_completed_at = NOW(),
            updated_at = NOW()
        WHERE discovery_id = NEW.id
        AND status = 'pending_responses';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_update_discovery_status
    AFTER UPDATE ON destination_discovery
    FOR EACH ROW
    EXECUTE FUNCTION update_discovery_engagement_status();

