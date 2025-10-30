-- ============================================================================
-- CREATE RPC FUNCTION FOR PASSWORD CHANGE FLAG
-- ============================================================================
-- This function updates the password_change_required flag after a user
-- successfully changes their password
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS mark_password_changed(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION mark_password_changed(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE practice_members
  SET 
    password_change_required = false,
    last_password_change = NOW(),
    updated_at = NOW()
  WHERE email = user_email;
  
  -- Log the change
  RAISE NOTICE 'Password change flag updated for: %', user_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_password_changed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_password_changed(TEXT) TO anon;

-- Test the function (optional - comment out if not needed)
-- SELECT mark_password_changed('jameshowardivc@gmail.com');

-- Verify
SELECT 
  name,
  email,
  password_change_required,
  last_password_change
FROM practice_members
WHERE email = 'jameshowardivc@gmail.com';

