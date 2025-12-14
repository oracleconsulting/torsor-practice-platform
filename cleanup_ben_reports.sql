-- ============================================================================
-- CLEANUP OLD DISCOVERY REPORTS FOR BEN STOCKEN
-- ============================================================================
-- This script removes old discovery_analysis reports, keeping only:
-- 1. The most recent report (the one that's shared)
-- 2. Optionally: Keep the last 3-5 reports for history
-- ============================================================================

-- OPTION 1: Keep only the most recent report (recommended)
-- This deletes all reports except the latest one
DELETE FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
  AND report_type = 'discovery_analysis'
  AND id NOT IN (
    SELECT id 
    FROM client_reports
    WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
      AND report_type = 'discovery_analysis'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- OPTION 2: Keep the last 5 reports for history (uncomment to use instead)
-- DELETE FROM client_reports
-- WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
--   AND report_type = 'discovery_analysis'
--   AND id NOT IN (
--     SELECT id 
--     FROM client_reports
--     WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
--       AND report_type = 'discovery_analysis'
--     ORDER BY created_at DESC
--     LIMIT 5
--   );

-- Verify cleanup
SELECT 
  id,
  created_at,
  is_shared_with_client,
  CASE 
    WHEN id = (
      SELECT id 
      FROM client_reports
      WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
        AND report_type = 'discovery_analysis'
      ORDER BY created_at DESC
      LIMIT 1
    ) THEN '✅ KEPT (Latest)'
    ELSE '❌ Should be deleted'
  END as status
FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
  AND report_type = 'discovery_analysis'
ORDER BY created_at DESC;

-- Final count
SELECT 
  COUNT(*) as remaining_reports,
  COUNT(*) FILTER (WHERE is_shared_with_client = true) as shared_reports
FROM client_reports
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
  AND report_type = 'discovery_analysis';


