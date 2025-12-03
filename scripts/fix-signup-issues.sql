-- ============================================================================
-- FIX SIGNUP ISSUES
-- ============================================================================
-- 1. Drop program_status check constraint (allow any status)
-- 2. Show current practice (for debugging)
-- ============================================================================

-- Drop the restrictive check constraint
ALTER TABLE practice_members DROP CONSTRAINT IF EXISTS practice_members_program_status_check;

-- Show what practices exist
SELECT id, name, created_at FROM practices;

-- Expected: You should see RPGCC practice with a real UUID
-- If empty, run: scripts/setup-rpgcc-practice.sql

