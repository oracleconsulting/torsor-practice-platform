-- ============================================================================
-- VIEW MANAGEMENT ACCOUNTS ASSESSMENT QUESTIONS & ANSWERS
-- ============================================================================
-- Shows all assessment questions with the client's answers
-- ============================================================================

DO $$
DECLARE
    v_client_id UUID := '1522309d-3516-4694-8a0a-69f24ab22d28'; -- Test client
    v_assessment RECORD;
    v_responses JSONB;
    v_question_id TEXT;
    v_answer TEXT;
BEGIN
    -- Get the assessment
    SELECT * INTO v_assessment
    FROM service_line_assessments
    WHERE client_id = v_client_id
      AND service_line_code = 'management_accounts'
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No assessment found for client %', v_client_id;
        RETURN;
    END IF;
    
    v_responses := v_assessment.responses;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'MANAGEMENT ACCOUNTS ASSESSMENT - QUESTIONS & ANSWERS';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Client ID: %', v_client_id;
    RAISE NOTICE 'Completed: %', v_assessment.completed_at;
    RAISE NOTICE 'Completion: %%%', v_assessment.completion_percentage;
    RAISE NOTICE '';
    
    -- Section 1: Current State
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'SECTION 1: CURRENT STATE';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: How would you describe your current relationship with your business numbers?';
    RAISE NOTICE 'A: %', v_responses->>'ma_relationship_with_numbers';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: When was the last time your financial reports told you something you didn''t already know?';
    RAISE NOTICE 'A: %', v_responses->>'ma_reports_insight_frequency';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: What''s your "Tuesday morning" financial question? The thing you wish you could instantly answer when you sit down?';
    RAISE NOTICE 'A: %', v_responses->>'ma_tuesday_financial_question';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: If you could magic away ONE financial uncertainty, what would it be?';
    RAISE NOTICE 'A: %', v_responses->>'ma_magic_away_financial';
    RAISE NOTICE '';
    
    -- Section 2: Pain Points
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'SECTION 2: PAIN POINTS';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: Which of these keep you awake at night? (Select all that apply)';
    IF v_responses->'ma_pain_points' IS NOT NULL THEN
        RAISE NOTICE 'A: %', array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_responses->'ma_pain_points')), E'\n   - ');
    ELSE
        RAISE NOTICE 'A: (No answer)';
    END IF;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: How long does it take you to answer "How did we do last month?"';
    RAISE NOTICE 'A: %', v_responses->>'ma_reporting_lag';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: Last time you had a big business decision to make, how did financials inform it?';
    RAISE NOTICE 'A: %', v_responses->>'ma_decision_making_story';
    RAISE NOTICE '';
    
    -- Section 3: System Context
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'SECTION 3: SYSTEM CONTEXT';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: What accounting software are you using?';
    RAISE NOTICE 'A: %', v_responses->>'ma_accounting_platform';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: How up-to-date is your bookkeeping typically?';
    RAISE NOTICE 'A: %', v_responses->>'ma_bookkeeping_currency';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: Who currently does your bookkeeping?';
    RAISE NOTICE 'A: %', v_responses->>'ma_bookkeeping_owner';
    RAISE NOTICE '';
    
    -- Section 4: Desired Outcomes
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'SECTION 4: DESIRED OUTCOMES';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: If we delivered management accounts that actually worked for you, what would change?';
    IF v_responses->'ma_transformation_desires' IS NOT NULL THEN
        RAISE NOTICE 'A: %', array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_responses->'ma_transformation_desires')), E'\n   - ');
    ELSE
        RAISE NOTICE 'A: (No answer)';
    END IF;
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: What does "financial visibility" look like to you? Paint the picture.';
    RAISE NOTICE 'A: %', v_responses->>'ma_visibility_vision';
    RAISE NOTICE '';
    
    -- Section 5: Frequency & Scope
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'SECTION 5: FREQUENCY & SCOPE';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: How often do you realistically need to see your numbers to make good decisions?';
    RAISE NOTICE 'A: %', v_responses->>'ma_reporting_frequency';
    RAISE NOTICE '';
    
    RAISE NOTICE 'Q: What additional reporting would make the biggest difference? (Select all that apply)';
    IF v_responses->'ma_additional_reporting' IS NOT NULL THEN
        RAISE NOTICE 'A: %', array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_responses->'ma_additional_reporting')), E'\n   - ');
    ELSE
        RAISE NOTICE 'A: (No answer)';
    END IF;
    RAISE NOTICE '';
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'EXTRACTED INSIGHTS';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '%', jsonb_pretty(v_assessment.extracted_insights);
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
    
END $$;

