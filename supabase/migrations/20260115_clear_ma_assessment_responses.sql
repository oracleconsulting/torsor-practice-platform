-- ============================================================================
-- CLEAR MA ASSESSMENT RESPONSES FOR NEW ONBOARDING ASSESSMENT
-- ============================================================================
-- Migration: 20260115_clear_ma_assessment_responses.sql
-- Purpose: Clear existing MA assessment responses to allow clients to
--          complete the new expanded 25-question onboarding assessment
-- ============================================================================

-- Clear all existing MA assessment responses
-- This allows clients to retake the assessment with the new structure
DELETE FROM ma_assessment_responses;

-- Also clear any related assessment data in service_line_assessments
-- for management_accounts service line
DELETE FROM service_line_assessments
WHERE service_line_code = 'management_accounts';

-- Note: This will not delete engagements or insights, only assessment responses
-- Clients will need to retake the assessment to generate new insights

