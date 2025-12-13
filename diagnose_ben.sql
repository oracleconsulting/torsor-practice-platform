-- ============================================================================
-- DIAGNOSTIC QUERIES FOR BEN STOCKEN
-- ============================================================================
-- Run these in Supabase SQL Editor to diagnose why Ben disappeared
-- ============================================================================

-- 1. Check Ben's practice_member record
SELECT 
  id,
  name,
  email,
  practice_id,
  program_status,
  member_type,
  created_at,
  updated_at
FROM practice_members
WHERE id = '34c94120-928b-402e-bb04-85edf9d6de42'
   OR email = 'ben@atheriohq.com'
   OR name ILIKE '%Ben Stocken%';

-- 2. Check Ben's destination_discovery record
SELECT 
  id,
  client_id,
  practice_id,
  completed_at,
  created_at,
  updated_at
FROM destination_discovery
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
   OR practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568';

-- 3. Check Ben's service line assignments
SELECT 
  csl.id,
  csl.client_id,
  csl.practice_id,
  csl.service_line_id,
  csl.status,
  csl.created_at,
  sl.code,
  sl.name
FROM client_service_lines csl
JOIN service_lines sl ON sl.id = csl.service_line_id
WHERE csl.client_id = '34c94120-928b-402e-bb04-85edf9d6de42';

-- 4. Check all discoveries for this practice (to see if client_id mismatch)
SELECT 
  dd.id,
  dd.client_id,
  dd.practice_id,
  dd.completed_at,
  pm.name as client_name,
  pm.email as client_email
FROM destination_discovery dd
LEFT JOIN practice_members pm ON pm.id = dd.client_id
WHERE dd.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
ORDER BY dd.created_at DESC;

-- 5. Check all service assignments for this practice
SELECT 
  csl.id,
  csl.client_id,
  csl.practice_id,
  csl.status,
  pm.name as client_name,
  pm.email as client_email,
  sl.code,
  sl.name as service_name
FROM client_service_lines csl
JOIN practice_members pm ON pm.id = csl.client_id
JOIN service_lines sl ON sl.id = csl.service_line_id
WHERE csl.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
ORDER BY pm.name, sl.code;

-- 6. Check if there are any client_reports for Ben
SELECT 
  id,
  client_id,
  practice_id,
  report_type,
  is_shared_with_client,
  created_at
FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42';

