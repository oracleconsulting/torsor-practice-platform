-- Align client SELECT on bm_reports with bm_engagements.report_shared_with_client
--
-- Problem: Clients see engagement.report_shared_with_client = true in the portal loader, but
-- bm_reports SELECT returns no row because RLS only checked bm_reports.is_shared_with_client.
-- Those flags can drift if engagement was updated without a matching bm_reports row update.
--
-- Fix: Allow read when EITHER flag is true (same client via practice_members.user_id = auth.uid()).

DROP POLICY IF EXISTS "Clients can view own SHARED bm_reports" ON bm_reports;
DROP POLICY IF EXISTS "Clients can view own bm_reports" ON bm_reports;
DROP POLICY IF EXISTS "Clients can view shared bm_reports" ON bm_reports;

CREATE POLICY "Clients can view shared bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM bm_engagements bme
      JOIN practice_members pm ON pm.id = bme.client_id
      WHERE bme.id = bm_reports.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          bm_reports.is_shared_with_client IS TRUE
          OR bme.report_shared_with_client IS TRUE
        )
    )
  );
