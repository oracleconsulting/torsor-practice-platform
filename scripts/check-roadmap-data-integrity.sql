-- Check if roadmaps were generated with wrong assessment data
-- This identifies roadmaps that may need to be regenerated

-- Step 1: Find roadmaps and their associated assessments
SELECT 
  cr.id as roadmap_id,
  cr.client_id,
  cr.status,
  cr.created_at as roadmap_created_at,
  pm.email as client_email,
  pm.name as client_name,
  -- Get assessment data
  ca1.responses->>'full_name' as part1_full_name,
  ca1.responses->>'company_name' as part1_company_name,
  ca2.responses->>'trading_name' as part2_trading_name,
  ca2.responses->>'ten_year_vision' as part2_vision,
  -- Check for mismatches
  CASE 
    WHEN ca1.responses->>'full_name' ILIKE '%tom%' AND pm.email NOT ILIKE '%tom%' AND pm.name NOT ILIKE '%tom%' 
    THEN '⚠️ Part1 has "Tom" but client is not Tom'
    WHEN ca1.responses->>'company_name' ILIKE '%rowgear%' AND pm.email NOT ILIKE '%rowgear%' 
    THEN '⚠️ Part1 has "Rowgear" but client is not Tom'
    WHEN ca2.responses->>'trading_name' ILIKE '%rowgear%' AND pm.email NOT ILIKE '%rowgear%' 
    THEN '⚠️ Part2 has "Rowgear" but client is not Tom'
    WHEN (ca1.responses::text ILIKE '%fitness%' OR ca1.responses::text ILIKE '%rowing%') 
      AND pm.email NOT ILIKE '%rowgear%' AND pm.email NOT ILIKE '%fitness%' AND pm.name NOT ILIKE '%tom%'
    THEN '⚠️ Assessment has fitness/rowing data but client is not in fitness industry'
    ELSE 'OK'
  END as data_integrity_check
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
LEFT JOIN client_assessments ca1 ON cr.client_id = ca1.client_id AND ca1.assessment_type = 'part1'
LEFT JOIN client_assessments ca2 ON cr.client_id = ca2.client_id AND ca2.assessment_type = 'part2'
WHERE cr.is_active = true
ORDER BY cr.created_at DESC;

-- Step 2: Specifically check James's roadmap (james@ivcaccounting.co.uk)
SELECT 
  cr.id as roadmap_id,
  cr.client_id,
  cr.status,
  cr.created_at,
  pm.email,
  pm.name,
  -- Extract key data from roadmap
  cr.roadmap_data->'fiveYearVision'->>'northStar' as north_star,
  cr.roadmap_data->'summary'->>'headline' as summary_headline,
  -- Check assessment data
  ca1.responses->>'full_name' as part1_full_name,
  ca1.responses->>'company_name' as part1_company_name,
  ca2.responses->>'trading_name' as part2_trading_name,
  -- Check for fitness equipment references
  CASE 
    WHEN cr.roadmap_data::text ILIKE '%fitness equipment%' OR cr.roadmap_data::text ILIKE '%rowing%' OR cr.roadmap_data::text ILIKE '%rowgear%'
    THEN '⚠️ ROADMAP CONTAINS FITNESS/ROWING DATA'
    ELSE 'OK'
  END as roadmap_check,
  CASE 
    WHEN ca1.responses::text ILIKE '%fitness%' OR ca1.responses::text ILIKE '%rowing%' OR ca1.responses::text ILIKE '%rowgear%'
      OR ca2.responses::text ILIKE '%fitness%' OR ca2.responses::text ILIKE '%rowing%' OR ca2.responses::text ILIKE '%rowgear%'
    THEN '⚠️ ASSESSMENT CONTAINS FITNESS/ROWING DATA'
    ELSE 'OK'
  END as assessment_check
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
LEFT JOIN client_assessments ca1 ON cr.client_id = ca1.client_id AND ca1.assessment_type = 'part1'
LEFT JOIN client_assessments ca2 ON cr.client_id = ca2.client_id AND ca2.assessment_type = 'part2'
WHERE pm.email = 'james@ivcaccounting.co.uk'
  AND cr.is_active = true
ORDER BY cr.created_at DESC;

-- Step 3: Check Tom's roadmap for comparison
SELECT 
  cr.id as roadmap_id,
  cr.client_id,
  cr.status,
  cr.created_at,
  pm.email,
  pm.name,
  cr.roadmap_data->'fiveYearVision'->>'northStar' as north_star,
  cr.roadmap_data->'summary'->>'headline' as summary_headline
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
WHERE pm.email = 'tom@rowgear.com'
  AND cr.is_active = true
ORDER BY cr.created_at DESC;

-- Step 4: Find all roadmaps that need regeneration (contain fitness/rowing but client is not Tom)
SELECT 
  cr.id as roadmap_id,
  cr.client_id,
  pm.email,
  pm.name,
  cr.created_at,
  'NEEDS REGENERATION - Contains fitness/rowing data but client is not in fitness industry' as issue
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
WHERE cr.is_active = true
  AND (cr.roadmap_data::text ILIKE '%fitness equipment%' 
    OR cr.roadmap_data::text ILIKE '%rowing%' 
    OR cr.roadmap_data::text ILIKE '%rowgear%')
  AND pm.email NOT ILIKE '%rowgear%'
  AND pm.email NOT ILIKE '%fitness%'
  AND pm.name NOT ILIKE '%tom%'
ORDER BY cr.created_at DESC;
