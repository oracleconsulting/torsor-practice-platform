-- ============================================================================
-- CLEAR MA ASSESSMENT RESPONSES FOR NEW ONBOARDING ASSESSMENT
-- ============================================================================
-- Migration: 20260115_clear_ma_assessment_responses.sql
-- Purpose: Clear existing MA assessment responses to allow clients to
--          complete the new expanded 31-question onboarding assessment
-- ============================================================================

-- Step 1: Remove foreign key references from ma_monthly_insights
-- This preserves existing insights but removes the assessment link
-- We need to do this for ALL insights that reference MA assessment responses
UPDATE ma_monthly_insights
SET assessment_id = NULL
WHERE assessment_id IS NOT NULL
  AND assessment_id IN (
    SELECT id FROM ma_assessment_responses
    WHERE service_line_code = 'management_accounts'
  );

-- Step 2: Also check if there are any other tables referencing ma_assessment_responses
-- and clear those references as well

-- Step 3: Clear all existing MA assessment responses
-- This allows clients to retake the assessment with the new structure
DELETE FROM ma_assessment_responses
WHERE service_line_code = 'management_accounts';

-- Step 4: Also clear any orphaned assessment responses (if any)
-- This is a safety measure
DELETE FROM ma_assessment_responses
WHERE id NOT IN (
  SELECT DISTINCT assessment_id 
  FROM ma_monthly_insights 
  WHERE assessment_id IS NOT NULL
);

-- Step 5: Clear any related assessment data in service_line_assessments
-- for management_accounts service line
DELETE FROM service_line_assessments
WHERE service_line_code = 'management_accounts';

-- Step 6: Clear assessment questions (they will be re-inserted by the update migration)
-- This is handled by the 20260115_update_ma_assessment_questions.sql migration

-- Note: This will not delete engagements or insights, only assessment responses
-- Existing insights will remain but will no longer reference the old assessment
-- Clients will need to retake the assessment to generate new insights

