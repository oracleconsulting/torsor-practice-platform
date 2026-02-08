-- COPY - Do not edit. Source: supabase/migrations/20260209120000_reset_discovery_pipeline_for_client.sql
-- ============================================================================
-- RESET DISCOVERY PIPELINE FOR A CLIENT (keep responses, wipe generated data)
-- ============================================================================
-- Use this to clear reports/opportunities/comments so you can re-run Phase 1→2→3
-- without losing the questionnaire (destination_discovery) or financial context.
-- Replace v_client_id with the client's UUID (e.g. Alex: c0c37392-d846-4b63-8902-0839b1cc1f35)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_discovery_pipeline_for_client(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id UUID;
  v_deleted_opps INT;
  v_deleted_reports INT;
  v_deleted_notes INT;
  v_deleted_comments INT;
  v_deleted_docs INT;
BEGIN
  SELECT id INTO v_engagement_id
  FROM discovery_engagements
  WHERE client_id = p_client_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_engagement_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No discovery engagement found for client');
  END IF;

  DELETE FROM discovery_opportunities WHERE engagement_id = v_engagement_id;
  GET DIAGNOSTICS v_deleted_opps = ROW_COUNT;

  DELETE FROM discovery_reports WHERE engagement_id = v_engagement_id;
  GET DIAGNOSTICS v_deleted_reports = ROW_COUNT;

  DELETE FROM discovery_context_notes WHERE engagement_id = v_engagement_id;
  GET DIAGNOSTICS v_deleted_notes = ROW_COUNT;

  DELETE FROM discovery_analysis_comments WHERE engagement_id = v_engagement_id;
  GET DIAGNOSTICS v_deleted_comments = ROW_COUNT;

  DELETE FROM discovery_uploaded_documents WHERE engagement_id = v_engagement_id;
  GET DIAGNOSTICS v_deleted_docs = ROW_COUNT;

  UPDATE discovery_engagements
  SET status = 'responses_complete',
      analysis_started_at = NULL,
      analysis_completed_at = NULL,
      opportunities_started_at = NULL,
      opportunities_completed_at = NULL,
      pinned_services = NULL,
      blocked_services = NULL,
      updated_at = NOW()
  WHERE id = v_engagement_id;

  RETURN jsonb_build_object(
    'success', true,
    'engagement_id', v_engagement_id,
    'deleted_opportunities', v_deleted_opps,
    'deleted_reports', v_deleted_reports,
    'deleted_context_notes', v_deleted_notes,
    'deleted_analysis_comments', v_deleted_comments,
    'deleted_uploaded_documents', v_deleted_docs,
    'message', 'Pipeline reset. Run Phase 1 (Analyse) then Phase 2 (Score) then Phase 3 (Report).'
  );
END;
$$;

COMMENT ON FUNCTION reset_discovery_pipeline_for_client(UUID) IS
  'Clears discovery reports, opportunities, context notes, analysis comments, and uploaded docs for the client''s latest engagement. Sets status to responses_complete. Keeps destination_discovery and client_financial_context so you can re-run Phase 1→2→3 without re-doing the form or re-uploading CSV.';

-- ============================================================================
-- RESET FINANCIALS + ANALYSIS ONLY (keep responses + context notes)
-- ============================================================================
-- Use this to test financial extraction and 3-phase run from scratch while
-- keeping questionnaire (destination_discovery) and advisor context notes.
-- Removes: client_financial_context, discovery_reports, discovery_opportunities,
--          discovery_analysis_comments. Keeps: destination_discovery,
--          discovery_context_notes, discovery_uploaded_documents (re-upload CSV
--          if you want to re-run extraction on a new file).
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_discovery_financials_and_analysis_for_client(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_count INT;
  v_deleted_financials INT;
  v_deleted_reports_legacy INT;
  v_deleted_opps INT;
  v_deleted_reports INT;
  v_deleted_comments INT;
  v_deleted_docs INT;
BEGIN
  -- Clear by CLIENT (all engagements), not just latest, so nothing is left behind
  DELETE FROM client_financial_context WHERE client_id = p_client_id;
  GET DIAGNOSTICS v_deleted_financials = ROW_COUNT;

  DELETE FROM client_reports WHERE client_id = p_client_id AND report_type = 'discovery_analysis';
  GET DIAGNOSTICS v_deleted_reports_legacy = ROW_COUNT;

  DELETE FROM client_context WHERE client_id = p_client_id AND context_type = 'document';
  GET DIAGNOSTICS v_deleted_docs = ROW_COUNT;

  DELETE FROM discovery_opportunities
  WHERE engagement_id IN (SELECT id FROM discovery_engagements WHERE client_id = p_client_id);
  GET DIAGNOSTICS v_deleted_opps = ROW_COUNT;

  DELETE FROM discovery_reports
  WHERE engagement_id IN (SELECT id FROM discovery_engagements WHERE client_id = p_client_id);
  GET DIAGNOSTICS v_deleted_reports = ROW_COUNT;

  DELETE FROM discovery_analysis_comments
  WHERE engagement_id IN (SELECT id FROM discovery_engagements WHERE client_id = p_client_id);
  GET DIAGNOSTICS v_deleted_comments = ROW_COUNT;

  UPDATE discovery_engagements
  SET status = 'responses_complete',
      analysis_started_at = NULL,
      analysis_completed_at = NULL,
      opportunities_started_at = NULL,
      opportunities_completed_at = NULL,
      pinned_services = NULL,
      blocked_services = NULL,
      updated_at = NOW()
  WHERE client_id = p_client_id;
  GET DIAGNOSTICS v_engagement_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'engagements_reset', v_engagement_count,
    'deleted_financial_context_rows', v_deleted_financials,
    'deleted_client_reports_legacy', v_deleted_reports_legacy,
    'deleted_client_context_documents', v_deleted_docs,
    'deleted_opportunities', v_deleted_opps,
    'deleted_reports', v_deleted_reports,
    'deleted_analysis_comments', v_deleted_comments,
    'kept', 'destination_discovery (responses), discovery_context_notes (added context)',
    'message', 'All financials and analysis cleared for this client. Re-upload CSV, then run Phase 1 → 2 → 3.'
  );
END;
$$;

COMMENT ON FUNCTION reset_discovery_financials_and_analysis_for_client(UUID) IS
  'Removes client_financial_context, discovery reports/opportunities/analysis comments, and client_context documents. Keeps destination_discovery and discovery_context_notes. Use to test financial extraction and 3-phase run from scratch.';

GRANT EXECUTE ON FUNCTION reset_discovery_financials_and_analysis_for_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_discovery_financials_and_analysis_for_client(UUID) TO service_role;
