-- Diagnostic and fix script for Ben Stocken's ID mismatch issue
-- Email: ben@atheriohq.com
-- Auth User ID: 83015fd4-e9af-4a57-9ef5-a219b16f6127
-- Discovery Assessment client_id: 1522309d-3516-4694-8a0a-69f24ab22d28

-- Step 1: Find the correct practice_members record for Ben
SELECT 
  pm.id as practice_member_id,
  pm.user_id as auth_user_id,
  pm.name,
  pm.email,
  pm.practice_id,
  pm.member_type,
  pm.created_at
FROM practice_members pm
WHERE pm.email = 'ben@atheriohq.com'
  AND pm.member_type = 'client';

-- Step 2: Check what discovery assessment exists and its client_id
SELECT 
  dd.id,
  dd.client_id,
  dd.practice_id,
  dd.completed_at,
  dd.created_at,
  pm.name as client_name,
  pm.email as client_email,
  pm.user_id as practice_member_user_id
FROM destination_discovery dd
LEFT JOIN practice_members pm ON dd.client_id = pm.id
WHERE dd.client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
   OR EXISTS (
     SELECT 1 FROM practice_members pm2 
     WHERE pm2.email = 'ben@atheriohq.com' 
       AND pm2.id = dd.client_id
   );

-- Step 3: Find the correct practice_members ID that matches the auth user
SELECT 
  pm.id as correct_client_id,
  pm.user_id,
  pm.email,
  pm.name
FROM practice_members pm
WHERE pm.user_id = '83015fd4-e9af-4a57-9ef5-a219b16f6127'
  AND pm.member_type = 'client';

-- Step 4: Check if there are multiple practice_members records for Ben
SELECT 
  pm.id,
  pm.user_id,
  pm.email,
  pm.name,
  pm.practice_id,
  pm.created_at
FROM practice_members pm
WHERE pm.email = 'ben@atheriohq.com'
ORDER BY pm.created_at DESC;

-- Step 5: Check service line enrollments
SELECT 
  csl.id,
  csl.client_id,
  csl.service_line_id,
  sl.code as service_line_code,
  sl.name as service_line_name,
  csl.onboarding_completed_at,
  pm.email,
  pm.user_id
FROM client_service_lines csl
JOIN service_lines sl ON csl.service_line_id = sl.id
LEFT JOIN practice_members pm ON csl.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
   OR csl.client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
   OR csl.client_id IN (
     SELECT id FROM practice_members 
     WHERE user_id = '83015fd4-e9af-4a57-9ef5-a219b16f6127'
   );

-- Step 6: Check for 365 alignment assessments
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.status,
  ca.completed_at,
  pm.email,
  pm.user_id
FROM client_assessments ca
LEFT JOIN practice_members pm ON ca.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
   OR ca.client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
   OR ca.client_id IN (
     SELECT id FROM practice_members 
     WHERE user_id = '83015fd4-e9af-4a57-9ef5-a219b16f6127'
   );

-- ============================================================
-- FIX: Update discovery assessment to use correct client_id
-- ============================================================
-- WARNING: Only run this after verifying the correct client_id above
-- This will fix Ben's discovery assessment to use the correct client_id

BEGIN;

-- Step 1: Find the correct client_id for Ben
DO $$
DECLARE
  correct_client_id UUID;
  wrong_client_id UUID := '1522309d-3516-4694-8a0a-69f24ab22d28';
  ben_user_id UUID := '83015fd4-e9af-4a57-9ef5-a219b16f6127';
BEGIN
  -- Get the correct client_id
  SELECT id INTO correct_client_id
  FROM practice_members 
  WHERE user_id = ben_user_id
    AND member_type = 'client'
    AND email = 'ben@atheriohq.com'
  LIMIT 1;
  
  IF correct_client_id IS NULL THEN
    RAISE EXCEPTION 'Could not find correct client_id for Ben. Check Step 3 results.';
  END IF;
  
  RAISE NOTICE 'Found correct client_id: %', correct_client_id;
  RAISE NOTICE 'Updating records from wrong client_id: %', wrong_client_id;
  
  -- Update discovery assessment
  UPDATE destination_discovery
  SET client_id = correct_client_id,
      updated_at = NOW()
  WHERE client_id = wrong_client_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Updated destination_discovery record';
  ELSE
    RAISE NOTICE 'No destination_discovery record found with wrong client_id';
  END IF;
  
  -- Update any service line enrollments
  UPDATE client_service_lines
  SET client_id = correct_client_id,
      updated_at = NOW()
  WHERE client_id = wrong_client_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Updated client_service_lines records';
  ELSE
    RAISE NOTICE 'No client_service_lines records found with wrong client_id';
  END IF;
  
  -- Update any 365 alignment assessments
  UPDATE client_assessments
  SET client_id = correct_client_id,
      updated_at = NOW()
  WHERE client_id = wrong_client_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Updated client_assessments records';
  ELSE
    RAISE NOTICE 'No client_assessments records found with wrong client_id';
  END IF;
  
  -- Update any roadmaps
  UPDATE client_roadmaps
  SET client_id = correct_client_id,
      updated_at = NOW()
  WHERE client_id = wrong_client_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Updated client_roadmaps records';
  ELSE
    RAISE NOTICE 'No client_roadmaps records found with wrong client_id';
  END IF;
  
  -- Update any context
  UPDATE client_context
  SET client_id = correct_client_id,
      updated_at = NOW()
  WHERE client_id = wrong_client_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Updated client_context records';
  ELSE
    RAISE NOTICE 'No client_context records found with wrong client_id';
  END IF;
  
  RAISE NOTICE 'Fix completed successfully!';
END $$;

COMMIT;

-- Verify the fix
SELECT 
  'Verification' as check_type,
  dd.id as discovery_id,
  dd.client_id,
  pm.email,
  pm.user_id,
  pm.id as practice_member_id
FROM destination_discovery dd
JOIN practice_members pm ON dd.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com';
