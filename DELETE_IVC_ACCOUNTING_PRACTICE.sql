-- ============================================================================
-- DELETE IVC ACCOUNTING LTD PRACTICE
-- ============================================================================
-- This practice should not exist in the Torsor/RPGCC system
-- Practice ID: 6d0a4f47-1a98-4bba-be4e-26c439b1358d
-- Name: IVC Accounting Ltd
-- Email: jameshowardivc@googlemail.com
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY WHAT WILL BE DELETED
-- ============================================================================
-- Check if there are any team members associated with this practice
SELECT 
  'practice_members' AS table_name,
  COUNT(*) AS count
FROM practice_members
WHERE practice_id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d'

UNION ALL

SELECT 
  'invitations' AS table_name,
  COUNT(*) AS count
FROM invitations
WHERE practice_id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d'

UNION ALL

SELECT 
  'practices' AS table_name,
  COUNT(*) AS count
FROM practices
WHERE id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d';

-- ============================================================================
-- STEP 2: DELETE ALL ASSOCIATED DATA
-- ============================================================================
-- If the counts above are acceptable, run these deletions:

-- Delete practice members first (foreign key constraint)
DELETE FROM practice_members
WHERE practice_id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d';

-- Delete invitations
DELETE FROM invitations
WHERE practice_id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d';

-- Delete the practice itself
DELETE FROM practices
WHERE id = '6d0a4f47-1a98-4bba-be4e-26c439b1358d';

-- ============================================================================
-- STEP 3: VERIFY DELETION
-- ============================================================================
SELECT 
  id,
  name,
  email
FROM practices
ORDER BY created_at DESC;

-- Should only show RPGCC practice now

-- ============================================================================
-- EXPECTED RESULT
-- ============================================================================
-- After running this script, you should only have:
-- - RPGCC practice (a1b2c3d4-5678-90ab-cdef-123456789abc)
-- - No IVC Accounting Ltd practice
-- ============================================================================

