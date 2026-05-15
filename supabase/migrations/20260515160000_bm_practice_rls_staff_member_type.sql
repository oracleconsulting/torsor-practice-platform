-- Benchmarking practice RLS: use practice_members.member_type for staff instead of role lists.
--
-- Problems with role-only checks:
-- - Omitted practice role "owner" (ClientServicesPage treats owner like admin).
-- - Drift vs other BM policies (e.g. bm_engagement_services uses member_type IN ('admin','owner','team')).
--
-- Staff rows use member_type IN ('admin','owner','team'); clients use member_type = 'client'.
-- Legacy rows may have NULL member_type: fall back to known staff roles on practice_members.role.

DROP POLICY IF EXISTS "Practice can view bm_reports" ON bm_reports;
CREATE POLICY "Practice can view bm_reports" ON bm_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can create bm_reports" ON bm_reports;
CREATE POLICY "Practice can create bm_reports" ON bm_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_reports" ON bm_reports;
CREATE POLICY "Practice can update bm_reports" ON bm_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_reports.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can view bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can view bm_engagements" ON bm_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.practice_id = bm_engagements.practice_id
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can create bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can create bm_engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.practice_id = practice_id
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_engagements" ON bm_engagements;
CREATE POLICY "Practice can update bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.practice_id = bm_engagements.practice_id
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can view bm_assessment_responses" ON bm_assessment_responses;
CREATE POLICY "Practice can view bm_assessment_responses" ON bm_assessment_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Practice can update bm_assessment_responses" ON bm_assessment_responses;
CREATE POLICY "Practice can update bm_assessment_responses" ON bm_assessment_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
        AND pm.user_id = auth.uid()
        AND (
          pm.member_type IN ('admin', 'owner', 'team')
          OR (
            pm.member_type IS NULL
            AND pm.role IN ('admin', 'consultant', 'member', 'owner')
          )
        )
    )
  );

COMMENT ON POLICY "Practice can update bm_reports" ON bm_reports IS
  'Practice staff (member_type admin/owner/team, or legacy role) may update reports for engagements in their practice.';
