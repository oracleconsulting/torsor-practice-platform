-- ============================================================================
-- Backfill sa_engagements.is_shared_with_client where report is already shared
-- ============================================================================
-- RLS allows clients to see reports only when sa_engagements.is_shared_with_client = TRUE.
-- "Make available" previously only updated report status; this backfills the engagement
-- flag for any engagement that already has an approved/published/delivered report.
-- ============================================================================

UPDATE sa_engagements e
SET is_shared_with_client = TRUE
FROM sa_audit_reports r
WHERE r.engagement_id = e.id
  AND r.status IN ('approved', 'published', 'delivered')
  AND (e.is_shared_with_client IS NOT TRUE);
