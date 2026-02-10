-- ============================================================================
-- DISCOVERY DATA MAP & AUDIT
-- ============================================================================
-- Use the audit functions to see exactly what rows exist for a client/engagement
-- in Supabase SQL Editor. Run: SELECT discovery_data_audit_for_client('YOUR_CLIENT_UUID');
-- Or by engagement: SELECT discovery_data_audit_for_engagement('ENGAGEMENT_UUID');
--
-- DATA MAP (where the Discovery UI gets each piece of data):
--
-- 1. discovery_engagements (client_id = modal clientId, order by created_at DESC limit 1)
--    -> Engagement row; UI uses .id for all child fetches. Columns: status, pinned_services, blocked_services.
--
-- 2. discovery_reports (engagement_id = engagement.id)
--    -> Analysis tab: purple headline, Destination Clarity, Gap Score, comprehensive_analysis.
--    -> Columns: destination_report, destination_clarity, page2_gaps, comprehensive_analysis, page1_destination.
--
-- 3. discovery_opportunities (engagement_id = engagement.id)
--    -> Analysis tab: "Service Opportunities" list (e.g. 12 items with £25K, etc.).
--
-- 4. client_reports (client_id = modal clientId, report_type = 'discovery_analysis', order by created_at DESC limit 1)
--    -> Analysis tab: "Loaded existing report", Export PDF, Share with Client. Columns: report_data, is_shared_with_client.
--
-- 5. client_context (client_id, context_type = 'document')
--    -> Documents tab: uploaded document content (e.g. Polar London text). Column: content.
--
-- 6. client_financial_context (client_id)
--    -> Extracted financials from CSV; used by Pass 1, not directly shown in modal.
--
-- 7. destination_discovery (client_id or email match)
--    -> Responses tab + analysis_notes. Kept by reset.
--
-- 8. client_context_notes (client_id)
--    -> Context Notes tab. Kept by reset.
--
-- 9. discovery_analysis_comments (engagement_id)
--    -> Learning/comments. Cleared by reset.
--
-- If "Clear financials & analysis" leaves data showing: run the audit with the
-- client_id you see in the modal (or with the engagement_id from the console log),
-- then compare audit.client_id to the id you pass to the reset. They must match.
-- ============================================================================

CREATE OR REPLACE FUNCTION discovery_data_audit_for_client(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagements JSONB;
  v_dr_ids UUID[];
  v_dr_count INT;
  v_opp_count INT;
  v_cr_ids UUID[];
  v_cr_count INT;
  v_cc_doc_count INT;
  v_fin_count INT;
  v_dd_count INT;
  v_cc_notes_count INT;
  v_comments_count INT;
  v_engagement_ids UUID[];
BEGIN
  -- Engagements for this client (UI picks latest by created_at)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'client_id', client_id,
      'status', status,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ), '[]'::jsonb)
  INTO v_engagements
  FROM discovery_engagements
  WHERE client_id = p_client_id;

  SELECT array_agg(id ORDER BY created_at DESC)
  INTO v_engagement_ids
  FROM discovery_engagements
  WHERE client_id = p_client_id;

  -- discovery_reports (feeds Analysis purple box + scores)
  SELECT array_agg(dr.id), COUNT(*) INTO v_dr_ids, v_dr_count
  FROM discovery_reports dr
  WHERE dr.engagement_id = ANY(COALESCE(v_engagement_ids, ARRAY[]::UUID[]));

  -- discovery_opportunities (feeds Service Opportunities list)
  SELECT COUNT(*) INTO v_opp_count
  FROM discovery_opportunities
  WHERE engagement_id = ANY(COALESCE(v_engagement_ids, ARRAY[]::UUID[]));

  -- client_reports discovery_analysis (feeds Export PDF / Share)
  SELECT array_agg(id), COUNT(*) INTO v_cr_ids, v_cr_count
  FROM client_reports
  WHERE client_id = p_client_id AND report_type = 'discovery_analysis';

  -- client_context documents (feeds Documents tab)
  SELECT COUNT(*) INTO v_cc_doc_count
  FROM client_context
  WHERE client_id = p_client_id AND context_type = 'document';

  -- client_financial_context
  SELECT COUNT(*) INTO v_fin_count
  FROM client_financial_context
  WHERE client_id = p_client_id;

  -- destination_discovery (responses; kept by reset)
  SELECT COUNT(*) INTO v_dd_count
  FROM destination_discovery
  WHERE client_id = p_client_id;

  -- client_context_notes (Context Notes tab; kept by reset)
  SELECT COUNT(*) INTO v_cc_notes_count
  FROM client_context_notes
  WHERE client_id = p_client_id;

  -- discovery_analysis_comments
  SELECT COUNT(*) INTO v_comments_count
  FROM discovery_analysis_comments
  WHERE engagement_id = ANY(COALESCE(v_engagement_ids, ARRAY[]::UUID[]));

  RETURN jsonb_build_object(
    'client_id', p_client_id,
    'discovery_engagements', v_engagements,
    'discovery_reports', jsonb_build_object('count', COALESCE(v_dr_count, 0), 'ids', COALESCE(v_dr_ids, ARRAY[]::UUID[])::text),
    'discovery_opportunities', jsonb_build_object('count', COALESCE(v_opp_count, 0)),
    'client_reports_discovery_analysis', jsonb_build_object('count', COALESCE(v_cr_count, 0), 'ids', COALESCE(v_cr_ids, ARRAY[]::UUID[])::text),
    'client_context_documents', jsonb_build_object('count', COALESCE(v_cc_doc_count, 0)),
    'client_financial_context', jsonb_build_object('count', COALESCE(v_fin_count, 0)),
    'destination_discovery', jsonb_build_object('count', COALESCE(v_dd_count, 0)),
    'client_context_notes', jsonb_build_object('count', COALESCE(v_cc_notes_count, 0)),
    'discovery_analysis_comments', jsonb_build_object('count', COALESCE(v_comments_count, 0)),
    'ui_note', 'Modal uses client_id = this client_id and engagement = first item in discovery_engagements. Reset must use same client_id.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION discovery_data_audit_for_engagement(p_engagement_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_engagement JSONB;
  v_dr_ids UUID[];
  v_dr_count INT;
  v_opp_count INT;
  v_cr_count INT;
  v_comments_count INT;
BEGIN
  SELECT client_id INTO v_client_id
  FROM discovery_engagements
  WHERE id = p_engagement_id;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Engagement not found', 'engagement_id', p_engagement_id);
  END IF;

  SELECT jsonb_build_object(
    'id', id,
    'client_id', client_id,
    'status', status,
    'created_at', created_at
  ) INTO v_engagement
  FROM discovery_engagements
  WHERE id = p_engagement_id;

  SELECT array_agg(id), COUNT(*) INTO v_dr_ids, v_dr_count
  FROM discovery_reports
  WHERE engagement_id = p_engagement_id;

  SELECT COUNT(*) INTO v_opp_count
  FROM discovery_opportunities
  WHERE engagement_id = p_engagement_id;

  SELECT COUNT(*) INTO v_cr_count
  FROM client_reports
  WHERE client_id = v_client_id AND report_type = 'discovery_analysis';

  SELECT COUNT(*) INTO v_comments_count
  FROM discovery_analysis_comments
  WHERE engagement_id = p_engagement_id;

  RETURN jsonb_build_object(
    'engagement_id', p_engagement_id,
    'client_id', v_client_id,
    'engagement', v_engagement,
    'discovery_reports', jsonb_build_object('count', COALESCE(v_dr_count, 0), 'ids', COALESCE(v_dr_ids, ARRAY[]::UUID[])::text),
    'discovery_opportunities', jsonb_build_object('count', COALESCE(v_opp_count, 0)),
    'client_reports_discovery_analysis', jsonb_build_object('count', COALESCE(v_cr_count, 0)),
    'discovery_analysis_comments', jsonb_build_object('count', COALESCE(v_comments_count, 0)),
    'ui_note', 'Use this client_id when calling reset_discovery_financials_and_analysis_for_client to clear this engagement.'
  );
END;
$$;

COMMENT ON FUNCTION discovery_data_audit_for_client(UUID) IS
  'Returns counts and ids of all discovery-related rows for a client. Use to verify what the UI will load and what the reset will clear.';
COMMENT ON FUNCTION discovery_data_audit_for_engagement(UUID) IS
  'Returns discovery data for one engagement and its client_id. Use with engagement_id from console log to get the client_id to pass to reset.';

GRANT EXECUTE ON FUNCTION discovery_data_audit_for_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION discovery_data_audit_for_client(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION discovery_data_audit_for_engagement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION discovery_data_audit_for_engagement(UUID) TO service_role;
