-- =====================================================
-- EXTEND SESSION DURATION FOR BETTER USER EXPERIENCE
-- Issue: Users forced to log in too frequently
-- Solution: Extend JWT expiry to 7 days, refresh token to 30 days
-- =====================================================

-- Note: This needs to be run in Supabase Dashboard > Settings > Auth
-- Or via Supabase CLI

-- These settings control session persistence:
-- 1. JWT_EXPIRY: How long access tokens last (7 days = 604800 seconds)
-- 2. REFRESH_TOKEN_EXPIRY: How long refresh tokens last (30 days = 2592000 seconds)

-- To apply these settings:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Project Settings > Authentication
-- 3. Scroll to "JWT Expiry" and set to: 604800 (7 days)
-- 4. Scroll to "Refresh Token Expiry" and set to: 2592000 (30 days)
-- 5. Click "Save"

-- Alternative: Update via SQL (if you have admin access)
-- This updates the auth.config table if it exists
UPDATE auth.config 
SET jwt_exp = 604800,           -- 7 days in seconds
    refresh_token_exp = 2592000  -- 30 days in seconds
WHERE TRUE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Session duration settings updated!';
  RAISE NOTICE '✅ JWT Expiry: 7 days (604800 seconds)';
  RAISE NOTICE '✅ Refresh Token: 30 days (2592000 seconds)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ If this failed, manually update in:';
  RAISE NOTICE '   Supabase Dashboard > Project Settings > Authentication';
  RAISE NOTICE '   - JWT Expiry: 604800';
  RAISE NOTICE '   - Refresh Token Expiry: 2592000';
END $$;

