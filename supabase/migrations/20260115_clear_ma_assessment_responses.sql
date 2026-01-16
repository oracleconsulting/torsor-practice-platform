-- ============================================================================
-- CLEAR MA ASSESSMENT RESPONSES FOR NEW ONBOARDING ASSESSMENT
-- ============================================================================
-- Migration: 20260115_clear_ma_assessment_responses.sql
-- Purpose: Clear existing MA assessment responses to allow clients to
--          complete the new expanded 31-question onboarding assessment
-- ============================================================================

-- Step 1: Remove ALL foreign key references from ma_monthly_insights
-- This preserves existing insights but removes the assessment link
-- We do this BEFORE deleting from ma_assessment_responses to avoid FK constraint errors
UPDATE ma_monthly_insights
SET assessment_id = NULL
WHERE assessment_id IS NOT NULL;

-- Step 2: Clear all existing MA assessment responses
-- This allows clients to retake the assessment with the new structure
-- Now that we've cleared the FK references, this should work
-- Note: ma_assessment_responses table is specific to MA, so we can delete all rows
-- But we'll join with ma_engagements to be safe (only delete responses for MA engagements)
DELETE FROM ma_assessment_responses
WHERE engagement_id IN (
  SELECT id FROM ma_engagements
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

