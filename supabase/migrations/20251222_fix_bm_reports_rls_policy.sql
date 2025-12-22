-- Fix RLS policy for bm_reports - use user_id instead of id
-- The bug: pm.id = auth.uid() should be pm.user_id = auth.uid()

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Practice can view bm_reports" ON bm_reports;

-- Create the correct policy
CREATE POLICY "Practice can view bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant', 'member')
    )
  );

-- Also fix the insert/update policies if they have the same bug
DROP POLICY IF EXISTS "Practice can create bm_reports" ON bm_reports;
CREATE POLICY "Practice can create bm_reports" ON bm_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_reports" ON bm_reports;
CREATE POLICY "Practice can update bm_reports" ON bm_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
      AND pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

