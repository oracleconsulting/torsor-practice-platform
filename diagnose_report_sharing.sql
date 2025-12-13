-- ============================================================================
-- DIAGNOSTIC QUERY: Check Report Sharing Status
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose why a report isn't showing
-- in the client portal
-- ============================================================================

-- 1. Find the client's practice_members record
SELECT 
  id as client_id,
  name,
  email,
  user_id,
  practice_id,
  member_type,
  program_status
FROM practice_members
WHERE email = 'ben@atheriohq.com'  -- Replace with client email
  AND member_type = 'client';

-- 2. Find all discovery reports for this client
SELECT 
  id,
  client_id,
  practice_id,
  report_type,
  is_shared_with_client,
  shared_at,
  created_at,
  updated_at
FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'  -- Replace with client_id from step 1
  AND report_type = 'discovery_analysis'
ORDER BY created_at DESC;

-- 3. Check if the most recent report is shared
SELECT 
  id,
  client_id,
  is_shared_with_client,
  shared_at,
  created_at,
  CASE 
    WHEN is_shared_with_client = true THEN '✅ SHARED - Should be visible'
    WHEN is_shared_with_client = false THEN '❌ NOT SHARED - Needs to be shared'
    WHEN is_shared_with_client IS NULL THEN '⚠️ NULL - Needs to be set to true'
  END as sharing_status
FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'  -- Replace with client_id
  AND report_type = 'discovery_analysis'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Fix: Share the most recent report (if needed)
-- Uncomment and run this if the report is not shared:
/*
UPDATE client_reports
SET 
  is_shared_with_client = true,
  shared_at = NOW()
WHERE id = '00a97356-b27c-4af0-b256-09176d381cca'  -- Replace with report ID from step 2
  AND client_id = '34c94120-928b-402e-bb04-85edf9d6de42';  -- Replace with client_id
*/

-- 5. Verify the fix
SELECT 
  id,
  client_id,
  is_shared_with_client,
  shared_at,
  created_at
FROM client_reports
WHERE id = '00a97356-b27c-4af0-b256-09176d381cca'  -- Replace with report ID
  AND is_shared_with_client = true;

