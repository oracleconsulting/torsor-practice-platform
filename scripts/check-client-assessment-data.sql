-- Diagnostic script to check assessment data for a specific client
-- Usage: Replace 'james@ivcaccounting.co.uk' with the email you want to check

-- Find the client
SELECT 
  pm.id as client_id,
  pm.name,
  pm.email,
  pm.member_type
FROM practice_members pm
WHERE pm.email = 'james@ivcaccounting.co.uk'
  AND pm.member_type = 'client';

-- Check assessment data for this client
-- Replace the client_id below with the ID from the query above
WITH client_info AS (
  SELECT id, name, email
  FROM practice_members
  WHERE email = 'james@ivcaccounting.co.uk'
    AND member_type = 'client'
  LIMIT 1
)
SELECT 
  ca.id,
  ca.assessment_type,
  ca.status,
  ca.completed_at,
  ca.created_at,
  -- Show key fields from responses
  ca.responses->>'full_name' as full_name,
  ca.responses->>'company_name' as company_name,
  ca.responses->>'trading_name' as trading_name,
  ca.responses->>'annual_turnover' as annual_turnover,
  ca.responses->>'tuesday_test' as tuesday_test_preview,
  ca.responses->>'ten_year_vision' as ten_year_vision_preview,
  -- Check for any mentions of rowgear/fitness/rowing
  CASE 
    WHEN ca.responses::text ILIKE '%rowgear%' THEN '⚠️ CONTAINS ROWGEAR'
    WHEN ca.responses::text ILIKE '%rowing%' THEN '⚠️ CONTAINS ROWING'
    WHEN ca.responses::text ILIKE '%fitness%' THEN '⚠️ CONTAINS FITNESS'
    WHEN ca.responses::text ILIKE '%tom%' THEN '⚠️ CONTAINS TOM'
    ELSE 'OK'
  END as data_quality_check,
  ca.client_id,
  ci.name as expected_client_name,
  ci.email as expected_client_email
FROM client_assessments ca
CROSS JOIN client_info ci
WHERE ca.client_id = ci.id
ORDER BY ca.assessment_type, ca.created_at DESC;

-- Check for any assessments that might be incorrectly linked
SELECT 
  ca.id,
  ca.assessment_type,
  ca.client_id,
  pm.name as client_name,
  pm.email as client_email,
  ca.responses->>'company_name' as company_name,
  ca.responses->>'trading_name' as trading_name,
  CASE 
    WHEN ca.responses::text ILIKE '%rowgear%' OR ca.responses::text ILIKE '%rowing%' OR ca.responses::text ILIKE '%tom%' 
    THEN '⚠️ MAY BE TOM/ROWGEAR DATA'
    ELSE 'OK'
  END as warning
FROM client_assessments ca
JOIN practice_members pm ON ca.client_id = pm.id
WHERE ca.responses::text ILIKE '%rowgear%' 
   OR ca.responses::text ILIKE '%rowing%'
   OR ca.responses::text ILIKE '%tom%'
ORDER BY ca.created_at DESC;

-- Check client_context for any shared documents that might be leaking
WITH client_info AS (
  SELECT id, name, email
  FROM practice_members
  WHERE email = 'james@ivcaccounting.co.uk'
    AND member_type = 'client'
  LIMIT 1
)
SELECT 
  cc.id,
  cc.context_type,
  cc.is_shared,
  cc.data_source_type,
  cc.client_id,
  ci.name as expected_client_name,
  LEFT(cc.content, 200) as content_preview,
  CASE 
    WHEN cc.content ILIKE '%rowgear%' THEN '⚠️ CONTAINS ROWGEAR'
    WHEN cc.content ILIKE '%rowing%' THEN '⚠️ CONTAINS ROWING'
    WHEN cc.content ILIKE '%tom%' THEN '⚠️ CONTAINS TOM'
    ELSE 'OK'
  END as data_quality_check
FROM client_context cc
CROSS JOIN client_info ci
WHERE cc.client_id = ci.id
ORDER BY cc.created_at DESC;
