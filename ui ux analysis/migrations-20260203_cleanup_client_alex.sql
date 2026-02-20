-- ============================================================================
-- CLEANUP SCRIPT FOR CLIENT: Alex (Polar Advertising LTD)
-- Client ID: c0c37392-d846-4b63-8902-0839b1cc1f35
-- ============================================================================
-- Run this to clear all data and allow fresh 5-year upload
-- ============================================================================

DO $$
DECLARE
  v_client_id UUID := 'c0c37392-d846-4b63-8902-0839b1cc1f35';
  v_engagement_id UUID;
BEGIN
  -- Find the discovery engagement for this client
  SELECT id INTO v_engagement_id 
  FROM discovery_engagements 
  WHERE client_id = v_client_id 
  ORDER BY created_at DESC 
  LIMIT 1;

  RAISE NOTICE 'Cleaning data for client: %', v_client_id;
  RAISE NOTICE 'Found engagement: %', v_engagement_id;

  -- 1. Delete discovery opportunities
  IF v_engagement_id IS NOT NULL THEN
    DELETE FROM discovery_opportunities WHERE engagement_id = v_engagement_id;
    RAISE NOTICE 'Deleted discovery_opportunities';
  END IF;

  -- 2. Delete discovery reports
  IF v_engagement_id IS NOT NULL THEN
    DELETE FROM discovery_reports WHERE engagement_id = v_engagement_id;
    RAISE NOTICE 'Deleted discovery_reports';
  END IF;

  -- 3. Delete discovery context notes
  IF v_engagement_id IS NOT NULL THEN
    DELETE FROM discovery_context_notes WHERE engagement_id = v_engagement_id;
    RAISE NOTICE 'Deleted discovery_context_notes';
  END IF;

  -- 4. Delete client context notes
  DELETE FROM client_context_notes WHERE client_id = v_client_id;
  RAISE NOTICE 'Deleted client_context_notes';

  -- 5. Delete destination discovery responses (reset to blank)
  DELETE FROM destination_discovery WHERE client_id = v_client_id;
  RAISE NOTICE 'Deleted destination_discovery';

  -- 6. Delete uploaded documents for this client
  DELETE FROM uploaded_documents WHERE client_id = v_client_id;
  RAISE NOTICE 'Deleted uploaded_documents';

  -- 7. Delete benchmarking data if exists
  DELETE FROM benchmarking_financial_data WHERE client_id = v_client_id;
  RAISE NOTICE 'Deleted benchmarking_financial_data';

  -- 8. Delete benchmarking reports if exists  
  DELETE FROM benchmarking_reports WHERE client_id = v_client_id;
  RAISE NOTICE 'Deleted benchmarking_reports';

  -- 9. Reset the discovery engagement status (keep the engagement, just reset it)
  IF v_engagement_id IS NOT NULL THEN
    UPDATE discovery_engagements 
    SET status = 'pending_responses',
        updated_at = NOW()
    WHERE id = v_engagement_id;
    RAISE NOTICE 'Reset engagement status to pending_responses';
  END IF;

  RAISE NOTICE '✅ Cleanup complete for client: %', v_client_id;
END;
$$;
