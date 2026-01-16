-- ============================================================================
-- QUICK FIX: UNSHARE ALL MA INSIGHTS
-- ============================================================================
-- Migration: 20260115_unshare_ma_insights.sql
-- Purpose: Immediately unshare all MA insights to hide them from client portal
--          This can be run independently to fix the issue without clearing data
-- ============================================================================

-- Un-share ALL MA insights immediately
UPDATE ma_monthly_insights
SET shared_with_client = FALSE
WHERE shared_with_client = TRUE
  AND engagement_id IN (
    SELECT id FROM ma_engagements
  );

-- Also clear assessment_id references while we're at it
UPDATE ma_monthly_insights
SET assessment_id = NULL
WHERE assessment_id IS NOT NULL
  AND engagement_id IN (
    SELECT id FROM ma_engagements
  );

-- Return count of insights that were unshared
SELECT 
  COUNT(*) as insights_unshared
FROM ma_monthly_insights
WHERE shared_with_client = FALSE
  AND engagement_id IN (
    SELECT id FROM ma_engagements
  );

