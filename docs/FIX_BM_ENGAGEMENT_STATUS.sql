-- ============================================================================
-- FIX BM ENGAGEMENT STATUS - Reset incorrectly marked as complete
-- ============================================================================
-- If your benchmarking engagement is incorrectly marked as complete,
-- run this to reset it back to draft status so you can continue the assessment
-- ============================================================================

-- Check current status
SELECT 
  id,
  client_id,
  status,
  assessment_completed_at,
  created_at,
  updated_at
FROM bm_engagements
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'  -- Replace with your client_id if different
ORDER BY created_at DESC;

-- Reset status to 'draft' if it was incorrectly set to 'assessment_complete'
-- Only reset if assessment_completed_at is NULL (meaning it wasn't actually completed)
UPDATE bm_engagements
SET 
  status = 'draft',
  assessment_completed_at = NULL,
  updated_at = NOW()
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'  -- Replace with your client_id if different
  AND status = 'assessment_complete'
  AND assessment_completed_at IS NULL;

-- Or if you want to reset all incorrectly completed engagements:
-- UPDATE bm_engagements
-- SET 
--   status = 'draft',
--   assessment_completed_at = NULL,
--   updated_at = NOW()
-- WHERE status = 'assessment_complete'
--   AND assessment_completed_at IS NULL;

