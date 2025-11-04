-- =====================================================
-- RESET LUKE'S PASSWORD ONLY
-- =====================================================
-- Use this to reset password after the main reset script has run
-- =====================================================

BEGIN;

-- Method 1: Update encrypted_password directly with proper hashing
DO $$ 
DECLARE
  v_user_id UUID;
BEGIN
  -- Find Luke's user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'ltyrrell@rpgcc.co.uk';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: ltyrrell@rpgcc.co.uk';
  END IF;
  
  -- Update password using Supabase's password hash function
  -- This ensures compatibility with Supabase Auth
  UPDATE auth.users
  SET 
    encrypted_password = crypt('Torsorteam2025!', gen_salt('bf')),
    updated_at = NOW(),
    -- Also ensure email is confirmed
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmation_sent_at = COALESCE(confirmation_sent_at, NOW())
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Password reset for ltyrrell@rpgcc.co.uk';
  RAISE NOTICE '   New password: Torsorteam2025!';
  RAISE NOTICE '   Email confirmed: Yes';
END $$;

COMMIT;

-- =====================================================
-- ALTERNATIVE: If the above doesn't work, use this
-- =====================================================
-- You can also reset the password via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Find ltyrrell@rpgcc.co.uk
-- 3. Click the three dots (...)
-- 4. Click "Reset Password"
-- 5. Set password to: Torsorteam2025!
-- =====================================================

