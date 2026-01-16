-- ============================================================================
-- CLEAR MA ASSESSMENT RESPONSES FOR NEW ONBOARDING ASSESSMENT
-- ============================================================================
-- Migration: 20260115_clear_ma_assessment_responses.sql
-- Purpose: Clear existing MA assessment responses to allow clients to
--          complete the new expanded 25-question onboarding assessment
-- ============================================================================

-- Step 1: Remove foreign key references from ma_monthly_insights
-- This preserves existing insights but removes the assessment link
UPDATE ma_monthly_insights
SET assessment_id = NULL
WHERE assessment_id IS NOT NULL;

-- Step 2: Clear all existing MA assessment responses
-- This allows clients to retake the assessment with the new structure
DELETE FROM ma_assessment_responses;

-- Step 3: Also clear any related assessment data in service_line_assessments
-- for management_accounts service line
DELETE FROM service_line_assessments
WHERE service_line_code = 'management_accounts';

-- Note: This will not delete engagements or insights, only assessment responses
-- Existing insights will remain but will no longer reference the old assessment
-- Clients will need to retake the assessment to generate new insights

