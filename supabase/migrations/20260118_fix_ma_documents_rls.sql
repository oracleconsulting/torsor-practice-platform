-- ============================================================================
-- FIX: ma_uploaded_documents RLS policy
-- The policy required member_type = 'team' but should allow any practice member
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "ma_documents_policy" ON ma_uploaded_documents;

-- Create new policy that allows all practice members to view/manage documents
CREATE POLICY "ma_documents_policy" ON ma_uploaded_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ma_engagements e
            WHERE e.id = ma_uploaded_documents.engagement_id
            AND e.practice_id IN (
                SELECT practice_id FROM practice_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Also fix ma_engagements RLS to be consistent
-- (users should be able to see engagements for their practice)
DROP POLICY IF EXISTS ma_engagements_select ON ma_engagements;
CREATE POLICY ma_engagements_select ON ma_engagements
    FOR SELECT USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid()
        )
    );

-- Make sure service role can still access everything
DROP POLICY IF EXISTS "ma_documents_service" ON ma_uploaded_documents;
CREATE POLICY "ma_documents_service" ON ma_uploaded_documents
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Fixed ma_uploaded_documents RLS policy';
  RAISE NOTICE 'All practice members can now view documents for their practice';
END $$;

