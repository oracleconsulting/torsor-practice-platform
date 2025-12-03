-- ============================================================================
-- CLEAN UP DUPLICATE PRACTICES
-- ============================================================================
-- Remove placeholder practice, keep the real one
-- ============================================================================

-- Delete the placeholder practice (created Oct 8)
DELETE FROM practice_members WHERE practice_id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
DELETE FROM practices WHERE id = 'a1b2c3d4-5678-90ab-cdef-123456789abc';

-- Verify only one RPGCC practice remains
SELECT id, name, created_at FROM practices WHERE name = 'RPGCC';

-- Expected: Only 8624cd8c-b4c2-4fc3-85b8-e559d14b0568 should remain

