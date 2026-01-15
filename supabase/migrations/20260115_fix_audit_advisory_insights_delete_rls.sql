-- ============================================================================
-- FIX: Add DELETE policy for audit_advisory_insights
-- ============================================================================
-- The table only had SELECT for practice members and ALL for service_role.
-- This blocked client deletion because there was no DELETE policy.
-- ============================================================================

-- Add DELETE policy for practice members
CREATE POLICY "Practice members can delete audit insights" ON audit_advisory_insights
    FOR DELETE USING (
        client_id IN (
            SELECT id FROM practice_members 
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Also add INSERT and UPDATE policies for completeness
CREATE POLICY "Practice members can insert audit insights" ON audit_advisory_insights
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM practice_members 
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Practice members can update audit insights" ON audit_advisory_insights
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM practice_members 
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'audit_advisory_insights DELETE policy' as policy,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_policies 
           WHERE tablename = 'audit_advisory_insights' 
           AND policyname = 'Practice members can delete audit insights'
       ) THEN 'Created' ELSE 'Failed' END as status;

