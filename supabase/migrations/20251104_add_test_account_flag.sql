-- =====================================================
-- ADD TEST ACCOUNT FLAG TO PRACTICE MEMBERS
-- =====================================================
-- Mark Jimmy Test as a test account to exclude from analytics
-- =====================================================

BEGIN;

-- Step 1: Add is_test_account column
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_practice_members_is_test_account 
ON practice_members(is_test_account);

-- Add comment
COMMENT ON COLUMN practice_members.is_test_account IS 'If true, this account is for testing and should be excluded from team analytics and reports';

-- Step 2: Mark Jimmy Test as test account
UPDATE practice_members
SET is_test_account = true
WHERE email = 'jameshowardivc@gmail.com' OR name = 'Jimmy Test';

-- Step 3: Verify
SELECT 
  name,
  email,
  is_test_account,
  (SELECT COUNT(*) FROM skill_assessments WHERE team_member_id = practice_members.id) as skills
FROM practice_members
WHERE is_test_account = true;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
  'TEST ACCOUNTS' as type,
  COUNT(*) as count
FROM practice_members
WHERE is_test_account = true;

SELECT 
  'REAL ACCOUNTS' as type,
  COUNT(*) as count
FROM practice_members
WHERE is_test_account = false OR is_test_account IS NULL;

