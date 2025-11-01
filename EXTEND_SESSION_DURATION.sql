-- =====================================================
-- EXTEND SESSION DURATION FOR BETTER USER EXPERIENCE
-- Issue: Users forced to log in too frequently
-- Solution: Extend JWT expiry to 7 days, refresh token to 30 days
-- =====================================================

-- ⚠️ IMPORTANT: This SQL will NOT work as auth.config table doesn't exist
-- Instead, you MUST use the Supabase Dashboard UI

-- CORRECT METHOD - Supabase Dashboard:
-- ============================================
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to: Project Settings > Authentication
-- 4. Scroll down to find these settings:
--    - "JWT Expiry" → Change to: 604800 (7 days in seconds)
--    - "Refresh Token Expiry" → Change to: 2592000 (30 days in seconds)
-- 5. Click "Save" at the bottom
-- 6. Done! ✅

-- What these settings do:
-- - JWT_EXPIRY (604800 = 7 days): How long users stay logged in
-- - REFRESH_TOKEN_EXPIRY (2592000 = 30 days): How long refresh tokens work

-- Default values (before change):
-- - JWT Expiry: 3600 (1 hour) ❌ Too short!
-- - Refresh Token: 604800 (7 days)

-- New values (after change):
-- - JWT Expiry: 604800 (7 days) ✅ Much better!
-- - Refresh Token: 2592000 (30 days) ✅ Excellent!

-- Benefits:
-- ✅ Users stay logged in for 7 days (not just 1 hour)
-- ✅ No more constant "Please log in again" messages
-- ✅ Sessions persist through browser closes and refreshes
-- ✅ Better user experience overall

-- DO NOT RUN THIS SQL - It will fail with "relation auth.config does not exist"
-- USE THE DASHBOARD INSTEAD (instructions above)

