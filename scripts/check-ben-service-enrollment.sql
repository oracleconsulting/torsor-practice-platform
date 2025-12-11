-- Check Ben's service line enrollment and status
-- Email: ben@atheriohq.com

-- Step 1: Find Ben's client_id
SELECT 
  id as client_id,
  name,
  email,
  user_id,
  practice_id,
  member_type,
  program_status
FROM practice_members
WHERE email = 'ben@atheriohq.com'
  AND member_type = 'client';

-- Step 2: Check Ben's service line enrollments
SELECT 
  csl.id,
  csl.client_id,
  csl.service_line_id,
  csl.status,
  csl.onboarding_completed_at,
  csl.created_at,
  sl.code as service_line_code,
  sl.name as service_line_name,
  pm.email,
  pm.name
FROM client_service_lines csl
JOIN service_lines sl ON csl.service_line_id = sl.id
JOIN practice_members pm ON csl.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
ORDER BY csl.created_at DESC;

-- Step 3: Check if 365_method service line exists
SELECT 
  id,
  code,
  name,
  short_description,
  is_active
FROM service_lines
WHERE code = '365_method' OR code = '365_alignment'
ORDER BY code;

-- Step 4: Check what service lines Ben should have based on discovery recommendations
SELECT 
  dd.id,
  dd.client_id,
  dd.recommended_services,
  pm.email
FROM destination_discovery dd
JOIN practice_members pm ON dd.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
ORDER BY dd.created_at DESC
LIMIT 1;

-- ============================================================
-- FIX: Ensure Ben is enrolled in 365_method service line
-- ============================================================
-- This will enroll Ben in the 365 Alignment Programme if not already enrolled
-- Run this to fix Ben's access to 365 alignment assessments

BEGIN;

DO $$
DECLARE
  ben_client_id UUID;
  practice_id_val UUID;
  service_line_id_val UUID;
BEGIN
  -- Get Ben's client_id and practice_id
  SELECT id, practice_id INTO ben_client_id, practice_id_val
  FROM practice_members
  WHERE email = 'ben@atheriohq.com'
    AND member_type = 'client'
  LIMIT 1;
  
  IF ben_client_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Ben''s client record';
  END IF;
  
  RAISE NOTICE 'Found Ben: client_id = %, practice_id = %', ben_client_id, practice_id_val;
  
  -- Get 365_method service line ID
  SELECT id INTO service_line_id_val
  FROM service_lines
  WHERE code = '365_method'
  LIMIT 1;
  
  IF service_line_id_val IS NULL THEN
    RAISE EXCEPTION 'Could not find 365_method service line. Please check service_lines table.';
  END IF;
  
  RAISE NOTICE 'Found 365_method service line: id = %', service_line_id_val;
  
  -- Check if enrollment already exists
  IF NOT EXISTS (
    SELECT 1 FROM client_service_lines
    WHERE client_id = ben_client_id
      AND service_line_id = service_line_id_val
  ) THEN
    -- Create enrollment
    INSERT INTO client_service_lines (
      client_id,
      practice_id,
      service_line_id,
      status,
      created_at
    ) VALUES (
      ben_client_id,
      practice_id_val,
      service_line_id_val,
      'pending_onboarding',
      NOW()
    );
    
    RAISE NOTICE '✅ Enrolled Ben in 365_method service line';
  ELSE
    RAISE NOTICE 'Ben is already enrolled in 365_method service line';
    
    -- Update status to pending_onboarding if it's something else (but not active)
    UPDATE client_service_lines
    SET status = 'pending_onboarding',
        updated_at = NOW()
    WHERE client_id = ben_client_id
      AND service_line_id = service_line_id_val
      AND status != 'active';
    
    IF FOUND THEN
      RAISE NOTICE 'Updated enrollment status to pending_onboarding';
    ELSE
      RAISE NOTICE 'Enrollment status is already active - no change needed';
    END IF;
  END IF;
END $$;

COMMIT;

-- Verify the fix
SELECT 
  'Verification' as check_type,
  csl.id,
  csl.client_id,
  csl.status,
  sl.code as service_line_code,
  sl.name as service_line_name,
  pm.email,
  pm.name
FROM client_service_lines csl
JOIN service_lines sl ON csl.service_line_id = sl.id
JOIN practice_members pm ON csl.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
  AND sl.code = '365_method';
