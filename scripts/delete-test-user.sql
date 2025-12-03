-- ============================================================================
-- DELETE TEST USER - laspartnership@googlemail.com
-- ============================================================================
-- Run this to reset the test user so you can test signup again
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_member_id uuid;
BEGIN
  -- Find the auth user
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'laspartnership@googlemail.com';
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found: laspartnership@googlemail.com';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user: %', v_user_id;
  
  -- Find the practice member
  SELECT id INTO v_member_id
  FROM practice_members
  WHERE user_id = v_user_id;
  
  IF v_member_id IS NOT NULL THEN
    RAISE NOTICE 'Found practice member: %', v_member_id;
    
    -- Delete service line enrollments
    DELETE FROM client_service_lines WHERE client_id = v_member_id;
    RAISE NOTICE 'Deleted client_service_lines';
    
    -- Delete service assessments
    DELETE FROM service_line_assessments WHERE client_id = v_member_id;
    RAISE NOTICE 'Deleted service_line_assessments';
    
    -- Delete client assessments
    DELETE FROM client_assessments WHERE client_id = v_member_id;
    RAISE NOTICE 'Deleted client_assessments';
    
    -- Delete roadmaps
    DELETE FROM client_roadmaps WHERE client_id = v_member_id;
    RAISE NOTICE 'Deleted client_roadmaps';
    
    -- Delete the practice member
    DELETE FROM practice_members WHERE id = v_member_id;
    RAISE NOTICE 'Deleted practice_member';
  END IF;
  
  -- Delete the auth user (must use auth.users directly with service role)
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE 'Deleted auth user';
  
  RAISE NOTICE '✅ Successfully deleted laspartnership@googlemail.com';
END $$;

-- Verify deletion
SELECT 'Auth users with this email:' as check;
SELECT id, email FROM auth.users WHERE email = 'laspartnership@googlemail.com';

SELECT 'Practice members with this email:' as check;
SELECT id, name, email FROM practice_members WHERE email = 'laspartnership@googlemail.com';

