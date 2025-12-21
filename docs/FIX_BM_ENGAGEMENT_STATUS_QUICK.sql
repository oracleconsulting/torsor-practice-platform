-- ============================================================================
-- QUICK FIX: Reset Benchmarking Engagement Status
-- ============================================================================
-- Run this to reset your benchmarking engagement so you can continue the assessment
-- ============================================================================

-- Reset status to 'draft' for your client (replace client_id if needed)
UPDATE bm_engagements
SET 
  status = 'draft',
  assessment_completed_at = NULL,
  updated_at = NOW()
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
  AND status = 'assessment_complete';

-- Verify the change
SELECT 
  id,
  client_id,
  status,
  assessment_completed_at,
  created_at
FROM bm_engagements
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28';

