-- ============================================================================
-- Allow clients to see reports with status 'generated' and 'regenerating'
-- so they are not locked out during regeneration or after first generation.
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own practice audit reports" ON sa_audit_reports;

CREATE POLICY "Users can view own practice audit reports" ON sa_audit_reports
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE 
                practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR practice_id = current_setting('app.practice_id', true)::UUID
                OR client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
        )
        AND (
            EXISTS (
                SELECT 1 FROM practice_members 
                WHERE user_id = auth.uid() 
                AND member_type IN ('admin', 'staff', 'consultant')
            )
            OR 
            (
                NOT EXISTS (
                    SELECT 1 FROM practice_members 
                    WHERE user_id = auth.uid() 
                    AND member_type IN ('admin', 'staff', 'consultant')
                )
                AND status IN ('generated', 'regenerating', 'approved', 'published', 'delivered')
            )
        )
    );

COMMENT ON POLICY "Users can view own practice audit reports" ON sa_audit_reports IS 
    'Practice members can view all reports. Clients can view generated/regenerating/approved/published/delivered.';
