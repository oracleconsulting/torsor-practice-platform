-- ============================================================================
-- QUICK FIX: UNSHARE ALL MA INSIGHTS
-- ============================================================================
-- Migration: 20260115_unshare_ma_insights.sql
-- Purpose: Immediately unshare all MA insights to hide them from client portal
--          This fixes both v2 (ma_monthly_insights) and old format (client_context)
-- ============================================================================

-- Step 1: Un-share ALL MA insights in v2 format (ma_monthly_insights)
-- This is more aggressive to catch any orphaned insights
UPDATE ma_monthly_insights
SET shared_with_client = FALSE
WHERE shared_with_client = TRUE;

-- Step 2: Un-share ALL MA insights in old format (client_context)
-- The frontend falls back to client_context if ma_monthly_insights is empty
UPDATE client_context
SET is_shared = FALSE
WHERE is_shared = TRUE
  AND context_type = 'note'
  AND data_source_type IN ('management_accounts_analysis', 'general')
  AND processed = true;

-- Step 3: Also clear assessment_id references in v2 format
UPDATE ma_monthly_insights
SET assessment_id = NULL
WHERE assessment_id IS NOT NULL;

-- Return counts of insights that were unshared
SELECT 
  'ma_monthly_insights' as table_name,
  COUNT(*) FILTER (WHERE shared_with_client = FALSE) as unshared_count,
  COUNT(*) FILTER (WHERE shared_with_client = TRUE) as still_shared_count
FROM ma_monthly_insights

UNION ALL

SELECT 
  'client_context' as table_name,
  COUNT(*) FILTER (WHERE is_shared = FALSE) as unshared_count,
  COUNT(*) FILTER (WHERE is_shared = TRUE) as still_shared_count
FROM client_context
WHERE context_type = 'note'
  AND data_source_type IN ('management_accounts_analysis', 'general');

