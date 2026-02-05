-- Add DELETE policy for bm_reports
-- Allows practice members to delete reports (needed for Force Reset functionality)
-- Date: 2026-02-05

DROP POLICY IF EXISTS "Practice can delete bm_reports" ON bm_reports;

CREATE POLICY "Practice can delete bm_reports" ON bm_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

COMMENT ON POLICY "Practice can delete bm_reports" ON bm_reports IS 
'Allows practice admins and consultants to delete benchmarking reports (e.g., for Force Reset when generation is stuck)';
