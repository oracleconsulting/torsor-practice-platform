-- ============================================================================
-- DIAGNOSTIC: Find Your Practice ID
-- ============================================================================
-- Run this first to find the correct practice name and ID

SELECT 
  id AS practice_id,
  name AS practice_name,
  email AS practice_email,
  contact_name,
  subscription AS subscription_tier
FROM practices
ORDER BY created_at DESC;

-- Once you find your practice, use its ID in CREATE_TEST_USER_JIMMY.sql

