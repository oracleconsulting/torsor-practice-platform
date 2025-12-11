-- ============================================================================
-- SQL Script to Delete User and All Related Records
-- ============================================================================
-- This script deletes a user and all related records in the correct order
-- to avoid foreign key constraint violations
-- ============================================================================

-- Replace 'james@ivcaccounting.co.uk' with the email you want to delete
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'james@ivcaccounting.co.uk';
  v_practice_id UUID;
BEGIN
  -- Find the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found: %', v_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user: % (ID: %)', v_email, v_user_id;
  
  -- Get practice_id from practice_members if exists
  SELECT practice_id INTO v_practice_id
  FROM practice_members
  WHERE user_id = v_user_id
  LIMIT 1;
  
  -- Step 1: Delete client_service_lines (references client_id which is practice_members.id)
  DELETE FROM client_service_lines
  WHERE client_id IN (
    SELECT id FROM practice_members WHERE user_id = v_user_id
  );
  RAISE NOTICE 'Deleted client_service_lines records';
  
  -- Step 2: Delete client_assessments
  DELETE FROM client_assessments
  WHERE client_id IN (
    SELECT id FROM practice_members WHERE user_id = v_user_id
  );
  RAISE NOTICE 'Deleted client_assessments records';
  
  -- Step 3: Delete client_roadmaps
  DELETE FROM client_roadmaps
  WHERE client_id IN (
    SELECT id FROM practice_members WHERE user_id = v_user_id
  );
  RAISE NOTICE 'Deleted client_roadmaps records';
  
  -- Step 4: Delete service_line_assessments
  DELETE FROM service_line_assessments
  WHERE client_id IN (
    SELECT id FROM practice_members WHERE user_id = v_user_id
  );
  RAISE NOTICE 'Deleted service_line_assessments records';
  
  -- Step 5: Delete destination_discovery
  DELETE FROM destination_discovery
  WHERE client_id IN (
    SELECT id FROM practice_members WHERE user_id = v_user_id
  );
  RAISE NOTICE 'Deleted destination_discovery records';
  
  -- Step 6: Delete client_invitations
  DELETE FROM client_invitations
  WHERE email = v_email;
  RAISE NOTICE 'Deleted client_invitations records';
  
  -- Step 7: Delete practice_members (references user_id)
  DELETE FROM practice_members
  WHERE user_id = v_user_id;
  RAISE NOTICE 'Deleted practice_members records';
  
  -- Step 8: Finally, delete the auth user
  -- Note: This requires super admin privileges
  DELETE FROM auth.users
  WHERE id = v_user_id;
  RAISE NOTICE 'Deleted auth user: %', v_user_id;
  
  RAISE NOTICE 'Successfully deleted user: %', v_email;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error deleting user: %', SQLERRM;
    RAISE;
END $$;
