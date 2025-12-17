-- ============================================================================
-- SYNC MA ASSESSMENT DATA FROM service_line_assessments TO ma_assessment_responses
-- ============================================================================
-- This migration syncs existing assessment data to the new v2 table structure
-- ============================================================================

-- Function to sync assessment data for a specific engagement
CREATE OR REPLACE FUNCTION sync_ma_assessment_for_engagement(p_engagement_id UUID)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_assessment_id UUID;
BEGIN
  -- Get client_id from engagement
  SELECT client_id INTO v_client_id
  FROM ma_engagements
  WHERE id = p_engagement_id;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Engagement not found: %', p_engagement_id;
  END IF;
  
  -- Check if assessment already synced
  SELECT id INTO v_assessment_id
  FROM ma_assessment_responses
  WHERE engagement_id = p_engagement_id
  LIMIT 1;
  
  IF v_assessment_id IS NOT NULL THEN
    RETURN v_assessment_id; -- Already synced
  END IF;
  
  -- Sync from service_line_assessments
  INSERT INTO ma_assessment_responses (
    engagement_id,
    client_id,
    tuesday_financial_question,
    magic_away_financial,
    decision_making_story,
    kpi_priorities,
    current_reporting_lag,
    accounting_platform,
    bookkeeping_currency,
    bookkeeping_owner,
    ma_transformation_desires,
    financial_visibility_vision,
    reporting_frequency_preference,
    additional_reporting_needs,
    raw_responses,
    completed_at
  )
  SELECT 
    p_engagement_id as engagement_id,
    sla.client_id,
    sla.responses->>'ma_tuesday_financial_question' as tuesday_financial_question,
    sla.responses->>'ma_magic_away_financial' as magic_away_financial,
    sla.responses->>'ma_decision_making_story' as decision_making_story,
    CASE 
      WHEN sla.responses->'ma_pain_points' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_pain_points'))
      ELSE NULL
    END as kpi_priorities,
    sla.responses->>'ma_reporting_lag' as current_reporting_lag,
    sla.responses->>'ma_accounting_platform' as accounting_platform,
    sla.responses->>'ma_bookkeeping_currency' as bookkeeping_currency,
    sla.responses->>'ma_bookkeeping_owner' as bookkeeping_owner,
    CASE 
      WHEN sla.responses->'ma_transformation_desires' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_transformation_desires'))
      ELSE NULL
    END as ma_transformation_desires,
    sla.responses->>'ma_visibility_vision' as financial_visibility_vision,
    sla.responses->>'ma_reporting_frequency' as reporting_frequency_preference,
    CASE 
      WHEN sla.responses->'ma_additional_reporting' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_additional_reporting'))
      ELSE NULL
    END as additional_reporting_needs,
    sla.responses as raw_responses,
    sla.completed_at
  FROM service_line_assessments sla
  WHERE sla.client_id = v_client_id
    AND sla.service_line_code = 'management_accounts'
    AND sla.completed_at IS NOT NULL
  ORDER BY sla.completed_at DESC
  LIMIT 1
  RETURNING id INTO v_assessment_id;
  
  RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Sync all existing engagements
DO $$
DECLARE
  v_engagement RECORD;
  v_synced_count INTEGER := 0;
BEGIN
  FOR v_engagement IN 
    SELECT e.id, e.client_id
    FROM ma_engagements e
    WHERE NOT EXISTS (
      SELECT 1 FROM ma_assessment_responses mar WHERE mar.engagement_id = e.id
    )
    AND EXISTS (
      SELECT 1 FROM service_line_assessments sla
      WHERE sla.client_id = e.client_id
        AND sla.service_line_code = 'management_accounts'
        AND sla.completed_at IS NOT NULL
    )
  LOOP
    BEGIN
      PERFORM sync_ma_assessment_for_engagement(v_engagement.id);
      v_synced_count := v_synced_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to sync engagement %: %', v_engagement.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Synced % assessment(s) to ma_assessment_responses', v_synced_count;
END $$;

-- Create trigger to auto-sync when engagement is created (if assessment exists)
CREATE OR REPLACE FUNCTION auto_sync_ma_assessment_on_engagement()
RETURNS TRIGGER AS $$
DECLARE
  v_assessment_exists BOOLEAN;
BEGIN
  -- Check if assessment exists for this client
  SELECT EXISTS (
    SELECT 1 FROM service_line_assessments
    WHERE client_id = NEW.client_id
      AND service_line_code = 'management_accounts'
      AND completed_at IS NOT NULL
  ) INTO v_assessment_exists;
  
  -- If assessment exists, sync it
  IF v_assessment_exists THEN
    PERFORM sync_ma_assessment_for_engagement(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_sync_ma_assessment ON ma_engagements;
CREATE TRIGGER trg_auto_sync_ma_assessment
  AFTER INSERT ON ma_engagements
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_ma_assessment_on_engagement();

COMMENT ON FUNCTION sync_ma_assessment_for_engagement IS 
'Syncs assessment data from service_line_assessments to ma_assessment_responses for a given engagement';

COMMENT ON FUNCTION auto_sync_ma_assessment_on_engagement IS 
'Automatically syncs assessment data when a new engagement is created';

