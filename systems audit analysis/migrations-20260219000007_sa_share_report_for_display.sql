-- ============================================================================
-- Share one SA report with client for display (one-off)
-- ============================================================================
-- Run in Supabase SQL Editor to make the report visible in the client portal.
-- If the client still sees "Report not available yet", verify:
--   SELECT e.id, e.client_id, e.is_shared_with_client, r.status
--   FROM sa_engagements e
--   LEFT JOIN sa_audit_reports r ON r.engagement_id = e.id
--   WHERE e.id = '80603cc0-1c4d-46ed-8041-04bdbbaffa70';
-- The client's practice_members.id (from their session) must equal e.client_id.
-- ============================================================================

-- 1. Mark the report as approved (so client can see it)
UPDATE sa_audit_reports
SET status = 'approved',
    approved_at = COALESCE(approved_at, NOW())
WHERE engagement_id = '80603cc0-1c4d-46ed-8041-04bdbbaffa70';

-- 2. Mark the engagement as shared with client (RLS requires this)
UPDATE sa_engagements
SET is_shared_with_client = TRUE
WHERE id = '80603cc0-1c4d-46ed-8041-04bdbbaffa70';
