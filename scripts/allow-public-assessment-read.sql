-- ============================================================================
-- Allow public (anonymous) read access to assessment_questions
-- ============================================================================
-- This is needed for the /review page to work without login
-- Only allows reading active questions - no write access
-- ============================================================================

-- First, check if the policy already exists and drop it
DROP POLICY IF EXISTS "Allow public read access to assessment_questions" ON assessment_questions;

-- Create policy for anonymous read access
CREATE POLICY "Allow public read access to assessment_questions"
ON assessment_questions
FOR SELECT
TO anon
USING (is_active = true);

-- Verify the policy was created
SELECT 
  policyname, 
  cmd, 
  roles
FROM pg_policies 
WHERE tablename = 'assessment_questions';

