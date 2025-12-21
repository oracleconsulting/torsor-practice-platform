-- ============================================================================
-- FIX BM ASSESSMENT RESPONSES RLS FOR UPSERTS
-- ============================================================================
-- Ensure both INSERT and UPDATE policies work correctly for upsert operations
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view own bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Practice can view bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Clients can update own bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Practice can update bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Users can insert own assessment responses" ON bm_assessment_responses;

-- Unified SELECT policy
CREATE POLICY "Users can view own assessment responses" ON bm_assessment_responses
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM bm_engagements 
      WHERE 
        client_id IN (
          SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
        OR
        practice_id IN (
          SELECT practice_id 
          FROM practice_members 
          WHERE user_id = auth.uid()
        )
    )
  );

-- Unified INSERT policy
CREATE POLICY "Users can insert own assessment responses" ON bm_assessment_responses
  FOR INSERT WITH CHECK (
    engagement_id IN (
      SELECT id FROM bm_engagements 
      WHERE 
        client_id IN (
          SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
        OR
        practice_id IN (
          SELECT practice_id 
          FROM practice_members 
          WHERE user_id = auth.uid()
        )
    )
  );

-- Unified UPDATE policy (needed for UPSERT operations)
CREATE POLICY "Users can update own assessment responses" ON bm_assessment_responses
  FOR UPDATE USING (
    engagement_id IN (
      SELECT id FROM bm_engagements 
      WHERE 
        client_id IN (
          SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
        OR
        practice_id IN (
          SELECT practice_id 
          FROM practice_members 
          WHERE user_id = auth.uid()
        )
    )
  );

