-- ============================================================================
-- FIX: SA Reports RLS should check both member_type AND role columns
-- ============================================================================
-- 
-- Issue: Practice members with role='member' but member_type not set to 
-- admin/staff/consultant are being treated as clients and can only see
-- approved reports, not pass1_complete or generated reports.
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own practice audit reports" ON sa_audit_reports;

-- Create new policy that checks both member_type and role
CREATE POLICY "Users can view own practice audit reports" ON sa_audit_reports
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE 
                -- Practice members can see all reports for engagements in their practice
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR practice_id = current_setting('app.practice_id', true)::UUID
                -- Clients can see their own engagements
                OR client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
        )
        AND (
            -- If user is a practice team member (member_type='team' OR role is admin/member/owner), show all reports
            EXISTS (
                SELECT 1 FROM practice_members 
                WHERE user_id = auth.uid() 
                AND (
                    member_type = 'team'
                    OR role IN ('admin', 'member', 'owner')  -- Team members by role
                )
            )
            OR 
            -- If user is a client, only show approved/published/delivered reports
            (
                EXISTS (
                    SELECT 1 FROM practice_members 
                    WHERE user_id = auth.uid() 
                    AND member_type = 'client'
                )
                AND status IN ('approved', 'published', 'delivered')
            )
        )
    );

COMMENT ON POLICY "Users can view own practice audit reports" ON sa_audit_reports IS 
    'Practice team members (admin/staff/consultant or role=admin/member/owner) can view all reports. Clients can only view approved/published/delivered reports.';

