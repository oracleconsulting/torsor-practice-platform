-- ============================================================================
-- FIX BM ENGAGEMENTS AND ASSESSMENT RESPONSES RLS FOR CLIENT INSERTS
-- ============================================================================
-- Allow clients to create their own engagements and assessment responses
-- ============================================================================

-- Drop existing INSERT policy for bm_engagements (only allows practice members)
DROP POLICY IF EXISTS "Practice can create bm_engagements" ON bm_engagements;

-- Create new policies that allow clients to create their own engagements
CREATE POLICY "Clients can create own bm_engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    -- Client must be creating an engagement for themselves
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = bm_engagements.client_id
      AND pm.user_id = auth.uid()
      AND pm.member_type = 'client'
    )
  );

CREATE POLICY "Practice can create bm_engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    -- Practice members can create engagements for any client in their practice
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- Allow clients to INSERT their own assessment responses
CREATE POLICY "Clients can create own bm_assessment_responses" ON bm_assessment_responses
  FOR INSERT WITH CHECK (
    -- Client must own the engagement
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.id = bme.client_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.member_type = 'client'
    )
  );

-- Allow practice members to INSERT assessment responses
CREATE POLICY "Practice can create bm_assessment_responses" ON bm_assessment_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bm_engagements bme
      JOIN practice_members pm ON pm.practice_id = bme.practice_id
      WHERE bme.id = bm_assessment_responses.engagement_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'consultant')
    )
  );

-- Fix client SELECT policy to use user_id instead of direct client_id match
DROP POLICY IF EXISTS "Clients can view own bm_engagements" ON bm_engagements;

CREATE POLICY "Clients can view own bm_engagements" ON bm_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = bm_engagements.client_id
      AND pm.user_id = auth.uid()
      AND pm.member_type = 'client'
    )
  );

-- Fix client UPDATE policy for engagements
DROP POLICY IF EXISTS "Practice can update bm_engagements" ON bm_engagements;

CREATE POLICY "Clients can update own bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.id = bm_engagements.client_id
      AND pm.user_id = auth.uid()
      AND pm.member_type = 'client'
    )
  );

CREATE POLICY "Practice can update bm_engagements" ON bm_engagements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_members pm
      WHERE pm.user_id = auth.uid()
      AND pm.practice_id = bm_engagements.practice_id
      AND pm.role IN ('admin', 'consultant')
    )
  );

