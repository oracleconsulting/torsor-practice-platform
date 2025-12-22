-- Fix RLS policies for benchmarking tables - use user_id instead of id
-- The bug: pm.id = auth.uid() should be pm.user_id = auth.uid()
-- practice_members.id is the member's UUID, not the user_id
-- practice_members.user_id is what links to auth.users.id

-- Fix bm_reports policies
DROP POLICY IF EXISTS "Practice can view bm_reports" ON bm_reports;
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

-- Fix bm_engagements policies (if they have the same bug)
DROP POLICY IF EXISTS "Practice can view bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can view bm_engagements" ON bm_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant', 'member')
    )
  );

DROP POLICY IF EXISTS "Practice can create bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can create bm_engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.practice_id = practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can update bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- Fix bm_assessment_responses policies (if they have the same bug)
DROP POLICY IF EXISTS "Practice can view bm_assessment_responses" ON bm_assessment_responses;
CREATE POLICY "Practice can view bm_assessment_responses" ON bm_assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant', 'member')
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_assessment_responses" ON bm_assessment_responses;
CREATE POLICY "Practice can update bm_assessment_responses" ON bm_assessment_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.user_id = auth.uid()  -- FIXED: was pm.id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

