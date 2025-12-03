-- ============================================================================
-- ALLOW PUBLIC READ ACCESS TO PRACTICES
-- ============================================================================
-- Needed for signup flow - clients need to find practice before they're authed
-- ============================================================================

-- Allow anyone to read practice IDs (needed for signup)
DROP POLICY IF EXISTS "Public can read practices" ON practices;
CREATE POLICY "Public can read practices" ON practices
  FOR SELECT USING (true);

-- Note: This only exposes id, name - no sensitive data
-- The insert to practice_members still requires auth

