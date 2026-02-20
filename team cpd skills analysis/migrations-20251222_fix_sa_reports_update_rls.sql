-- ============================================================================
-- FIX: Allow practice members to UPDATE Systems Audit reports
-- ============================================================================
-- 
-- Current issue: UPDATE policy only checks app.practice_id session variable
-- Requirement: Practice members should be able to update reports for engagements
-- in their practice, similar to how SELECT works
-- ============================================================================

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own practice reports" ON sa_audit_reports;

-- Create new UPDATE policy that allows practice members to update reports
CREATE POLICY "Users can update own practice reports" ON sa_audit_reports
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE 
                -- Practice members can update reports for engagements in their practice
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR practice_id = current_setting('app.practice_id', true)::UUID
        )
    );

COMMENT ON POLICY "Users can update own practice reports" ON sa_audit_reports IS 
    'Practice members can update reports for engagements in their practice.';

