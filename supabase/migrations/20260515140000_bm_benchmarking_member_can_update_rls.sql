-- Allow practice role "member" to UPDATE bm_reports (align with SELECT policy).
--
-- Bug: "Practice can view bm_reports" uses role IN ('admin', 'consultant', 'member')
-- but "Practice can update bm_reports" only allowed admin/consultant. Advisors with
-- role member could load the benchmarking modal (SELECT) but Share with Client ran
-- an UPDATE that matched 0 rows under RLS, returning empty data and a misleading
-- "No benchmarking report row" message.

DROP POLICY IF EXISTS "Practice can update bm_reports" ON bm_reports;

CREATE POLICY "Practice can update bm_reports" ON bm_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'consultant', 'member')
    )
  );

COMMENT ON POLICY "Practice can update bm_reports" ON bm_reports IS
  'Practice staff (admin, consultant, member) may update report rows for their practice engagements.';

-- Same alignment for engagement row (Share with Client updates share flags on bm_engagements).

DROP POLICY IF EXISTS "Practice can update bm_engagements" ON bm_engagements;

CREATE POLICY "Practice can update bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.practice_id = bm_engagements.practice_id
        AND pm.role IN ('admin', 'consultant', 'member')
    )
  );

COMMENT ON POLICY "Practice can update bm_engagements" ON bm_engagements IS
  'Practice staff (admin, consultant, member) may update engagements for their practice.';
