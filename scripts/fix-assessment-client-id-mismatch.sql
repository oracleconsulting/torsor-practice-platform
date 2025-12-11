-- Find and fix assessments with wrong client_id
-- This identifies assessments that may have been saved with incorrect client_id

-- Step 1: Find all assessments and verify they belong to the correct client
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.status,
  ca.completed_at,
  ca.created_at,
  pm1.email as client_email,
  pm1.user_id,
  pm1.id as practice_member_id,
  -- Extract full_name from responses JSON
  ca.responses->>'full_name' as full_name_in_response,
  CASE 
    WHEN ca.responses->>'full_name' IS NOT NULL 
      AND pm1.email IS NOT NULL
      AND LOWER(ca.responses->>'full_name') NOT LIKE LOWER('%' || SPLIT_PART(pm1.email, '@', 1) || '%')
      AND LOWER(ca.responses->>'full_name') NOT LIKE LOWER('%' || SPLIT_PART(pm1.name, ' ', 1) || '%')
    THEN '⚠️ Name mismatch - may belong to different client'
    ELSE 'OK'
  END as name_validation
FROM client_assessments ca
LEFT JOIN practice_members pm1 ON ca.client_id = pm1.id
ORDER BY ca.created_at DESC;

-- Step 2: Find assessments where full_name in response doesn't match client
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.responses->>'full_name' as full_name_in_response,
  pm1.email as client_email,
  pm1.name as client_name,
  pm1.user_id,
  'Name in response does not match client' as issue
FROM client_assessments ca
JOIN practice_members pm1 ON ca.client_id = pm1.id
WHERE ca.responses->>'full_name' IS NOT NULL
  AND LOWER(ca.responses->>'full_name') NOT LIKE LOWER('%' || SPLIT_PART(pm1.email, '@', 1) || '%')
  AND LOWER(ca.responses->>'full_name') NOT LIKE LOWER('%' || SPLIT_PART(COALESCE(pm1.name, ''), ' ', 1) || '%')
ORDER BY ca.created_at DESC;

-- Step 3: Specifically check for assessments with "Tom" in responses but wrong client_id
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.responses->>'full_name' as full_name_in_response,
  pm1.email as current_client_email,
  pm1.name as current_client_name,
  pm2.email as tom_email,
  pm2.id as tom_client_id,
  'Assessment has "Tom" in response but belongs to different client' as issue
FROM client_assessments ca
JOIN practice_members pm1 ON ca.client_id = pm1.id
LEFT JOIN practice_members pm2 ON (
  pm2.email ILIKE '%tom%' 
  OR pm2.name ILIKE '%tom%'
  OR pm2.id::text = '16d5f176-7863-440f-aa79-9d49f6%'
)
WHERE ca.responses->>'full_name' ILIKE '%tom%'
  AND pm1.email NOT ILIKE '%tom%'
  AND pm1.name NOT ILIKE '%tom%'
ORDER BY ca.created_at DESC;

-- Step 4: Find assessments for client_id 8951... (the user's client_id)
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.responses->>'full_name' as full_name_in_response,
  ca.responses->>'company_name' as company_name_in_response,
  pm.email as client_email,
  pm.name as client_name,
  CASE 
    WHEN ca.responses->>'full_name' ILIKE '%tom%' THEN '⚠️ HAS TOM IN RESPONSE'
    WHEN ca.responses->>'company_name' ILIKE '%rowgear%' OR ca.responses->>'company_name' ILIKE '%rowing%' THEN '⚠️ HAS ROWGEAR/ROWING IN RESPONSE'
    ELSE 'OK'
  END as status
FROM client_assessments ca
JOIN practice_members pm ON ca.client_id = pm.id
WHERE ca.client_id::text LIKE '8951%'
ORDER BY ca.assessment_type, ca.created_at DESC;

-- Step 5: Find assessments for Tom's client_id (16d5...)
SELECT 
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.responses->>'full_name' as full_name_in_response,
  ca.responses->>'company_name' as company_name_in_response,
  pm.email as client_email,
  pm.name as client_name
FROM client_assessments ca
JOIN practice_members pm ON ca.client_id = pm.id
WHERE ca.client_id::text LIKE '16d5%'
ORDER BY ca.assessment_type, ca.created_at DESC;

-- ============================================================
-- FIX: Reassign assessments to correct client based on response data
-- ============================================================
-- WARNING: Review the results above before running this fix
-- This will update assessments to use the correct client_id based on name matching

BEGIN;

DO $$
DECLARE
  assessment_record RECORD;
  correct_client_id UUID;
  current_client_id UUID;
BEGIN
  -- Find assessments where full_name contains "Tom" but client_id doesn't match Tom
  FOR assessment_record IN 
    SELECT 
      ca.id,
      ca.client_id,
      ca.assessment_type,
      ca.responses->>'full_name' as full_name
    FROM client_assessments ca
    JOIN practice_members pm ON ca.client_id = pm.id
    WHERE ca.responses->>'full_name' ILIKE '%tom%'
      AND pm.email NOT ILIKE '%tom%'
      AND pm.name NOT ILIKE '%tom%'
  LOOP
    -- Find Tom's correct client_id
    SELECT id INTO correct_client_id
    FROM practice_members
    WHERE (email ILIKE '%tom%' OR name ILIKE '%tom%')
      AND member_type = 'client'
      AND id::text LIKE '16d5%'
    LIMIT 1;
    
    IF correct_client_id IS NOT NULL AND correct_client_id != assessment_record.client_id THEN
      RAISE NOTICE 'Updating assessment % from client_id % to % (Tom)', 
        assessment_record.id, assessment_record.client_id, correct_client_id;
      
      UPDATE client_assessments
      SET client_id = correct_client_id
      WHERE id = assessment_record.id;
    END IF;
  END LOOP;
  
  -- Find assessments for client_id 8951... that have Tom's data
  FOR assessment_record IN 
    SELECT 
      ca.id,
      ca.client_id,
      ca.assessment_type,
      ca.responses->>'full_name' as full_name
    FROM client_assessments ca
    WHERE ca.client_id::text LIKE '8951%'
      AND (ca.responses->>'full_name' ILIKE '%tom%'
        OR ca.responses->>'company_name' ILIKE '%rowgear%'
        OR ca.responses->>'company_name' ILIKE '%rowing%')
  LOOP
    -- Find Tom's correct client_id
    SELECT id INTO correct_client_id
    FROM practice_members
    WHERE (email ILIKE '%tom%' OR name ILIKE '%tom%')
      AND member_type = 'client'
      AND id::text LIKE '16d5%'
    LIMIT 1;
    
    IF correct_client_id IS NOT NULL THEN
      RAISE NOTICE 'Moving assessment % from user (8951...) to Tom (16d5...)', 
        assessment_record.id;
      
      UPDATE client_assessments
      SET client_id = correct_client_id
      WHERE id = assessment_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Assessment reassignment completed';
END $$;

COMMIT;

-- Verify the fix
SELECT 
  'Verification' as check_type,
  ca.id,
  ca.client_id,
  ca.assessment_type,
  ca.responses->>'full_name' as full_name,
  pm.email,
  pm.name,
  CASE 
    WHEN ca.responses->>'full_name' ILIKE '%tom%' AND (pm.email ILIKE '%tom%' OR pm.name ILIKE '%tom%') THEN '✅ Fixed'
    WHEN ca.responses->>'full_name' ILIKE '%tom%' AND pm.email NOT ILIKE '%tom%' THEN '⚠️ Still has Tom data but wrong client'
    ELSE 'OK'
  END as status
FROM client_assessments ca
JOIN practice_members pm ON ca.client_id = pm.id
WHERE ca.client_id::text LIKE '8951%' OR ca.client_id::text LIKE '16d5%'
ORDER BY ca.assessment_type, ca.created_at DESC;
