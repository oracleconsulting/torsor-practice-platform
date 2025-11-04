-- =====================================================
-- SIMPLE PASSWORD RESET FOR LUKE - TRY THIS NOW
-- =====================================================

-- Update password with proper encryption
UPDATE auth.users
SET 
  encrypted_password = crypt('Torsorteam2025!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_sent_at = COALESCE(confirmation_sent_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'ltyrrell@rpgcc.co.uk';

-- Check the result
SELECT 
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  confirmed_at IS NOT NULL as confirmed,
  'Password should be: Torsorteam2025!' as note
FROM auth.users
WHERE email = 'ltyrrell@rpgcc.co.uk';

