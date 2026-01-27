-- ============================================================================
-- MIRROR CLIENT FUNCTION
-- ============================================================================
-- Creates a function to copy discovery data from one client to another
-- for preview purposes. This allows admins to see exactly what a client
-- will see in their portal before sharing.
-- ============================================================================

-- Function to mirror discovery data from source client to target client
CREATE OR REPLACE FUNCTION mirror_discovery_data(
  p_source_client_id UUID,
  p_target_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_engagement discovery_engagements%ROWTYPE;
  v_source_discovery destination_discovery%ROWTYPE;
  v_source_report discovery_reports%ROWTYPE;
  v_new_engagement_id UUID;
  v_new_discovery_id UUID;
  v_new_report_id UUID;
  v_practice_id UUID;
  v_result JSONB := '{}';
BEGIN
  -- Get the practice_id from the target client
  SELECT practice_id INTO v_practice_id 
  FROM practice_members 
  WHERE id = p_target_client_id;
  
  IF v_practice_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target client not found');
  END IF;

  -- Delete existing discovery data for target client
  DELETE FROM discovery_reports 
  WHERE engagement_id IN (
    SELECT id FROM discovery_engagements WHERE client_id = p_target_client_id
  );
  
  DELETE FROM discovery_context_notes 
  WHERE engagement_id IN (
    SELECT id FROM discovery_engagements WHERE client_id = p_target_client_id
  );
  
  DELETE FROM discovery_engagements WHERE client_id = p_target_client_id;
  DELETE FROM destination_discovery WHERE client_id = p_target_client_id;
  DELETE FROM client_financial_context WHERE client_id = p_target_client_id;
  
  -- Copy destination_discovery (assessment responses)
  SELECT * INTO v_source_discovery 
  FROM destination_discovery 
  WHERE client_id = p_source_client_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_source_discovery.id IS NOT NULL THEN
    v_new_discovery_id := gen_random_uuid();
    
    INSERT INTO destination_discovery (
      id, client_id, practice_id, responses, completed_at, 
      assessment_version, started_at, created_at, updated_at
    )
    VALUES (
      v_new_discovery_id,
      p_target_client_id,
      v_practice_id,
      v_source_discovery.responses,
      v_source_discovery.completed_at,
      v_source_discovery.assessment_version,
      v_source_discovery.started_at,
      NOW(),
      NOW()
    );
    
    v_result := v_result || jsonb_build_object('discovery_copied', true, 'new_discovery_id', v_new_discovery_id);
  END IF;
  
  -- Copy discovery_engagements
  SELECT * INTO v_source_engagement
  FROM discovery_engagements
  WHERE client_id = p_source_client_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_source_engagement.id IS NOT NULL THEN
    v_new_engagement_id := gen_random_uuid();
    
    INSERT INTO discovery_engagements (
      id, practice_id, client_id, discovery_id, status,
      assessment_started_at, assessment_completed_at,
      pass1_started_at, pass1_completed_at,
      pass2_started_at, pass2_completed_at,
      approved_at, published_at, delivered_at,
      approved_by, published_by,
      created_at, updated_at
    )
    VALUES (
      v_new_engagement_id,
      v_practice_id,
      p_target_client_id,
      v_new_discovery_id,
      v_source_engagement.status,
      v_source_engagement.assessment_started_at,
      v_source_engagement.assessment_completed_at,
      v_source_engagement.pass1_started_at,
      v_source_engagement.pass1_completed_at,
      v_source_engagement.pass2_started_at,
      v_source_engagement.pass2_completed_at,
      v_source_engagement.approved_at,
      v_source_engagement.published_at,
      v_source_engagement.delivered_at,
      v_source_engagement.approved_by,
      v_source_engagement.published_by,
      NOW(),
      NOW()
    );
    
    v_result := v_result || jsonb_build_object('engagement_copied', true, 'new_engagement_id', v_new_engagement_id);
  END IF;
  
  -- Copy discovery_reports
  SELECT * INTO v_source_report
  FROM discovery_reports
  WHERE engagement_id = v_source_engagement.id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_source_report.id IS NOT NULL THEN
    v_new_report_id := gen_random_uuid();
    
    INSERT INTO discovery_reports (
      id, engagement_id, status,
      service_scores, detection_patterns, emotional_anchors,
      urgency_multiplier, change_readiness,
      primary_recommendations, secondary_recommendations,
      headline, executive_summary, vision_narrative,
      reality_check_narrative, blind_spots_narrative, transformation_path,
      service_narratives, what_we_heard, what_it_means, what_changes,
      next_steps, conversation_starters,
      llm_model, llm_tokens_used, llm_cost, generation_time_ms, prompt_version,
      pass1_completed_at, pass2_completed_at, generated_at,
      destination_report, page1_destination, page2_gaps,
      page3_journey, page4_numbers, page5_next_steps,
      quotes_used, personal_anchors, urgency_level,
      data_completeness_score, data_completeness_status,
      missing_critical_data, missing_important_data,
      admin_actions_needed, ready_for_client,
      published_to_client_at, published_by,
      comprehensive_analysis, destination_clarity, detected_industry,
      created_at, updated_at
    )
    SELECT 
      v_new_report_id, v_new_engagement_id, status,
      service_scores, detection_patterns, emotional_anchors,
      urgency_multiplier, change_readiness,
      primary_recommendations, secondary_recommendations,
      headline, executive_summary, vision_narrative,
      reality_check_narrative, blind_spots_narrative, transformation_path,
      service_narratives, what_we_heard, what_it_means, what_changes,
      next_steps, conversation_starters,
      llm_model, llm_tokens_used, llm_cost, generation_time_ms, prompt_version,
      pass1_completed_at, pass2_completed_at, generated_at,
      destination_report, page1_destination, page2_gaps,
      page3_journey, page4_numbers, page5_next_steps,
      quotes_used, personal_anchors, urgency_level,
      data_completeness_score, data_completeness_status,
      missing_critical_data, missing_important_data,
      admin_actions_needed, ready_for_client,
      NOW(), NULL, -- Mark as published to show in client portal
      comprehensive_analysis, destination_clarity, detected_industry,
      NOW(), NOW()
    FROM discovery_reports
    WHERE id = v_source_report.id;
    
    v_result := v_result || jsonb_build_object('report_copied', true, 'new_report_id', v_new_report_id);
  END IF;
  
  -- Copy client_financial_context
  INSERT INTO client_financial_context (
    id, client_id, practice_id, 
    period_end_date, document_id, data_source,
    turnover, turnover_prior_year, revenue_growth_pct,
    gross_profit, gross_profit_margin_pct,
    operating_profit, operating_profit_margin_pct,
    staff_cost, staff_cost_pct,
    staff_count, revenue_per_employee,
    net_assets, current_assets, current_liabilities,
    cash_position, debtor_days, creditor_days, stock_days,
    extracted_insights, raw_data,
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid(), p_target_client_id, v_practice_id,
    period_end_date, document_id, data_source,
    turnover, turnover_prior_year, revenue_growth_pct,
    gross_profit, gross_profit_margin_pct,
    operating_profit, operating_profit_margin_pct,
    staff_cost, staff_cost_pct,
    staff_count, revenue_per_employee,
    net_assets, current_assets, current_liabilities,
    cash_position, debtor_days, creditor_days, stock_days,
    extracted_insights, raw_data,
    NOW(), NOW()
  FROM client_financial_context
  WHERE client_id = p_source_client_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    v_result := v_result || jsonb_build_object('financials_copied', true);
  END IF;
  
  -- Copy discovery_context_notes
  INSERT INTO discovery_context_notes (
    id, engagement_id, note_type, title, content,
    related_question_id, related_service_code, source,
    created_by, is_for_ai_analysis, created_at
  )
  SELECT 
    gen_random_uuid(), v_new_engagement_id, note_type, title, content,
    related_question_id, related_service_code, source,
    created_by, is_for_ai_analysis, NOW()
  FROM discovery_context_notes
  WHERE engagement_id = v_source_engagement.id;
  
  v_result := v_result || jsonb_build_object('success', true);
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mirror_discovery_data(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mirror_discovery_data(UUID, UUID) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION mirror_discovery_data IS 'Copies all discovery data from source client to target client for preview purposes';

