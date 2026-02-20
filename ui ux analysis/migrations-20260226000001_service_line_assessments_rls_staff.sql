-- Allow all practice staff (not just member_type = 'team') to SELECT service_line_assessments
-- so admin portal can show the same Stage 1 data as client portal (service_line_assessments.responses).
-- ============================================================================

DROP POLICY IF EXISTS "Team sees service assessments" ON service_line_assessments;

CREATE POLICY "Team sees service assessments" ON service_line_assessments
  FOR SELECT USING (
    practice_id IN (
      SELECT pm.practice_id FROM practice_members pm
      WHERE pm.user_id = auth.uid()
        AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
    )
  );

COMMENT ON POLICY "Team sees service assessments" ON service_line_assessments IS
  'Practice staff (team or role admin/member/owner) can view assessments for their practice';
