-- ============================================================================
-- FIX: Clients can only view approved Systems Audit reports
-- ============================================================================
-- 
-- Current issue: Clients can see all reports regardless of status
-- Requirement: Clients should only see reports when status is 'approved', 'published', or 'delivered'
-- Practice members (admins) should still see all reports
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own practice audit reports" ON sa_audit_reports;

-- Create new policy that restricts client access to approved reports only
CREATE POLICY "Users can view own practice audit reports" ON sa_audit_reports
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE (
                -- Practice members can see all reports for engagements in their practice
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR practice_id = current_setting('app.practice_id', true)::UUID
            )
            OR (
                -- Clients can only see their own engagements
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
        AND (
            -- If user is a client (not a practice member), only show approved reports
            -- If user is a practice member, show all reports
            EXISTS (
                SELECT 1 FROM practice_members 
                WHERE user_id = auth.uid() 
                AND member_type != 'client'
            )
            OR 
            status IN ('approved', 'published', 'delivered')
        )
    );

COMMENT ON POLICY "Users can view own practice audit reports" ON sa_audit_reports IS 
    'Practice members can view all reports. Clients can only view approved/published/delivered reports.';

