-- =====================================================
-- DELETE OLD SEEDED ROLES FROM ROLE DEFINITIONS
-- =====================================================
-- This removes the default roles (Audit Senior, Tax Advisor, etc.)
-- that were created during migration
-- =====================================================

BEGIN;

-- Delete the 5 seeded roles
DELETE FROM role_definitions
WHERE role_title IN (
  'Audit Senior',
  'Tax Advisor',
  'Corporate Finance Analyst',
  'Audit Manager',
  'Tax Manager'
);

-- Verify deletion
SELECT 
  'Remaining Roles' as status,
  COUNT(*) as count
FROM role_definitions;

COMMIT;

-- =====================================================
-- AFTER RUNNING THIS:
-- =====================================================
-- The Role Definitions tab should show 0 roles
-- You can then create your own custom roles for your practice
-- =====================================================

