-- ============================================================================
-- FIX BM ENGAGEMENTS AND ASSESSMENT RESPONSES RLS FOR CLIENT INSERTS (V2)
-- ============================================================================
-- This is an updated version that uses the exact same pattern as sa_engagements
-- Run this if the previous migration didn't work
-- ============================================================================

-- Drop ALL existing policies on bm_engagements to start fresh
DROP POLICY IF EXISTS "Practice can create bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Clients can create own bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Users can insert own practice engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Clients can view own bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Practice can view bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Users can view own practice engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Practice can update bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Clients can update own bm_engagements" ON bm_engagements;
DROP POLICY IF EXISTS "Users can update own practice engagements" ON bm_engagements;

-- Unified SELECT policy - matches sa_engagements pattern exactly
CREATE POLICY "Users can view own practice engagements" ON bm_engagements
  FOR SELECT USING (
    -- Practice members: check practice_id matches user's practice
    practice_id IN (
      SELECT practice_id 
      FROM practice_members 
      WHERE user_id = auth.uid()
    )
    OR
    -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
    client_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Unified INSERT policy - matches sa_engagements pattern exactly
CREATE POLICY "Users can insert own practice engagements" ON bm_engagements
  FOR INSERT WITH CHECK (
    -- Practice members: check practice_id matches user's practice
    practice_id IN (
      SELECT practice_id 
      FROM practice_members 
      WHERE user_id = auth.uid()
    )
    OR
    -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
    client_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Unified UPDATE policy - matches sa_engagements pattern exactly
CREATE POLICY "Users can update own practice engagements" ON bm_engagements
  FOR UPDATE USING (
    -- Practice members: check practice_id matches user's practice
    practice_id IN (
      SELECT practice_id 
      FROM practice_members 
      WHERE user_id = auth.uid()
    )
    OR
    -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
    client_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Drop existing INSERT policies on bm_assessment_responses
DROP POLICY IF EXISTS "Clients can create own bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Practice can create bm_assessment_responses" ON bm_assessment_responses;
DROP POLICY IF EXISTS "Users can insert own assessment responses" ON bm_assessment_responses;

-- Unified INSERT policy for assessment responses
CREATE POLICY "Users can insert own assessment responses" ON bm_assessment_responses
  FOR INSERT WITH CHECK (
    -- Check if the engagement belongs to the user (as client) or their practice (as practice member)
    engagement_id IN (
      SELECT id FROM bm_engagements 
      WHERE 
        -- Client owns the engagement
        client_id IN (
          SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
        OR
        -- Practice member's practice matches engagement's practice
        practice_id IN (
          SELECT practice_id 
          FROM practice_members 
          WHERE user_id = auth.uid()
        )
    )
  );

