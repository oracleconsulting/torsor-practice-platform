-- ============================================================================
-- QUICK FIX: Approve Systems Audit Report
-- ============================================================================
-- Run this to approve the report so the client can see it
-- ============================================================================

UPDATE sa_audit_reports
SET 
  status = 'approved',
  approved_at = NOW(),
  approved_by = (
    SELECT id FROM practice_members 
    WHERE practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
    AND member_type IN ('admin', 'staff', 'consultant')
    LIMIT 1
  )
WHERE engagement_id = '6bbc7e3b-c0a1-4b41-942f-c5c178006d87'
  AND id = 'c8f8bb8a-ffa1-4873-86e3-3d308a32ed8e'
  AND status = 'generated';

-- Verify the update
SELECT 
  id,
  engagement_id,
  status,
  approved_at,
  approved_by,
  headline
FROM sa_audit_reports
WHERE engagement_id = '6bbc7e3b-c0a1-4b41-942f-c5c178006d87';

