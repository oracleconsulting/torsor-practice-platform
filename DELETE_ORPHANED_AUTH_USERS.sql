-- ============================================================================
-- DELETE ORPHANED AUTH USERS
-- ============================================================================
-- Run this in Supabase SQL Editor to remove auth users that don't need to exist
-- These are users that were created for testing or by mistake
-- ============================================================================

-- List of emails to delete
-- BSGBD@rpgcc.co.uk
-- benstocken@gmail.com
-- julie@accessibleaccounting.co.uk
-- info@the365.uk
-- james@ivcaccounting.co.uk

-- ⚠️ WARNING: This is a destructive operation!
-- Make sure these users should actually be deleted before running this.

-- First, let's see what auth users exist with these emails
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'BSGBD@rpgcc.co.uk',
  'benstocken@gmail.com',
  'julie@accessibleaccounting.co.uk',
  'info@the365.uk',
  'james@ivcaccounting.co.uk'
);

-- If the above query shows the users you want to delete, uncomment and run this:
/*
DELETE FROM auth.users
WHERE email IN (
  'BSGBD@rpgcc.co.uk',
  'benstocken@gmail.com',
  'julie@accessibleaccounting.co.uk',
  'info@the365.uk',
  'james@ivcaccounting.co.uk'
);
*/

-- ============================================================================
-- ALTERNATIVE: Delete via Supabase Dashboard
-- ============================================================================
-- If the SQL DELETE doesn't work (due to RLS or permissions), use the Dashboard:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Search for each email address
-- 3. Click "..." menu → Delete user
-- ============================================================================

