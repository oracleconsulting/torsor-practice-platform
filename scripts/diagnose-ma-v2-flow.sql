-- ============================================================================
-- DIAGNOSTIC QUERIES FOR MA v2 FLOW
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the v2 workflow
-- ============================================================================

-- 1. Check if ma_uploaded_documents table exists and has data
SELECT 
  'ma_uploaded_documents' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM ma_uploaded_documents;

-- 2. Check extraction status of uploaded documents
SELECT 
  id,
  filename,
  extraction_status,
  extraction_error,
  created_at,
  extracted_at
FROM ma_uploaded_documents
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if extracted financials exist
SELECT 
  'ma_extracted_financials' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM ma_extracted_financials;

-- 4. View recent extracted financials
SELECT 
  id,
  document_id,
  engagement_id,
  period_end_date,
  period_label,
  revenue,
  operating_profit,
  bank_balance,
  extraction_confidence,
  created_at
FROM ma_extracted_financials
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check True Cash calculations
SELECT 
  'ma_true_cash_calculations' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as latest_record
FROM ma_true_cash_calculations;

-- 6. View recent True Cash calculations
SELECT 
  id,
  extracted_financials_id,
  engagement_id,
  period_end_date,
  bank_balance,
  less_vat_payable,
  less_paye_nic,
  less_director_loan,
  true_cash_available,
  is_positive,
  created_at
FROM ma_true_cash_calculations
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check engagements
SELECT 
  id,
  client_id,
  practice_id,
  tier,
  frequency,
  status,
  created_at
FROM ma_engagements
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check assessment responses
SELECT 
  id,
  engagement_id,
  client_id,
  tuesday_financial_question,
  magic_away_financial,
  decision_making_story,
  completed_at
FROM ma_assessment_responses
ORDER BY completed_at DESC
LIMIT 5;

-- 9. Check insights (v2 format)
SELECT 
  id,
  engagement_id,
  extracted_financials_id,
  assessment_id,
  period_end_date,
  headline_text,
  headline_sentiment,
  true_cash_narrative,
  tuesday_question_original,
  prompt_version,
  status,
  created_at
FROM ma_monthly_insights
ORDER BY created_at DESC
LIMIT 5;

-- 10. Check if v2 columns exist in ma_monthly_insights
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ma_monthly_insights'
  AND column_name IN (
    'extracted_financials_id',
    'assessment_id',
    'true_cash_narrative',
    'tuesday_question_original',
    'tuesday_question_answer',
    'prompt_version'
  )
ORDER BY column_name;

-- 11. Check for a specific client's engagement and documents
-- Replace 'CLIENT_ID_HERE' with actual client ID
SELECT 
  e.id as engagement_id,
  e.client_id,
  e.status as engagement_status,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT f.id) as extracted_financials_count,
  COUNT(DISTINCT t.id) as true_cash_count,
  COUNT(DISTINCT i.id) as insight_count
FROM ma_engagements e
LEFT JOIN ma_uploaded_documents d ON d.engagement_id = e.id
LEFT JOIN ma_extracted_financials f ON f.engagement_id = e.id
LEFT JOIN ma_true_cash_calculations t ON t.engagement_id = e.id
LEFT JOIN ma_monthly_insights i ON i.engagement_id = e.id
WHERE e.client_id = '1522309d-3516-4694-8a0a-69f24ab22d28' -- Replace with your test client ID
GROUP BY e.id, e.client_id, e.status;

