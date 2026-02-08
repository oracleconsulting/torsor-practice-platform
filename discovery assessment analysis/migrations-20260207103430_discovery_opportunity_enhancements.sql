-- COPY - Do not edit. Reference only. Source: supabase/migrations/20260207103430_discovery_opportunity_enhancements.sql
-- Discovery Opportunity Management Enhancements
-- Brings discovery to parity with benchmarking system

-- ============================================================================
-- 1. Add pin/block columns to discovery_engagements
-- ============================================================================

ALTER TABLE discovery_engagements 
  ADD COLUMN IF NOT EXISTS pinned_services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blocked_services TEXT[] DEFAULT '{}';

COMMENT ON COLUMN discovery_engagements.pinned_services IS 'Service codes the advisor wants Pass 3 to include';
COMMENT ON COLUMN discovery_engagements.blocked_services IS 'Service codes the advisor wants Pass 3 to exclude';

-- ============================================================================
-- 2. Add recommended_services to discovery_reports (authoritative source)
-- ============================================================================

ALTER TABLE discovery_reports 
  ADD COLUMN IF NOT EXISTS recommended_services JSONB,
  ADD COLUMN IF NOT EXISTS not_recommended_services JSONB,
  ADD COLUMN IF NOT EXISTS opportunity_assessment JSONB;

COMMENT ON COLUMN discovery_reports.recommended_services IS 'Synthesised "How We Can Help" section - authoritative client-facing recommendations';
COMMENT ON COLUMN discovery_reports.not_recommended_services IS 'Services explicitly ruled out with reasons';
COMMENT ON COLUMN discovery_reports.opportunity_assessment IS 'Overall opportunity metrics (count, value, severity distribution)';

-- ============================================================================
-- 3. Ensure required columns exist on discovery_opportunities
-- ============================================================================

DO $$ 
BEGIN
  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'discovery_opportunities' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE discovery_opportunities ADD COLUMN description TEXT;
    COMMENT ON COLUMN discovery_opportunities.description IS 'Detailed description of the opportunity';
  END IF;
  
  -- Add show_in_client_view column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'discovery_opportunities' 
    AND column_name = 'show_in_client_view'
  ) THEN
    ALTER TABLE discovery_opportunities ADD COLUMN show_in_client_view BOOLEAN DEFAULT false;
    COMMENT ON COLUMN discovery_opportunities.show_in_client_view IS 'Whether this opportunity should be visible to the client';
  END IF;
END $$;

-- ============================================================================
-- 4. RLS policy for client access to approved opportunities
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Clients can view approved discovery opportunities" ON discovery_opportunities;

-- Create new policy
CREATE POLICY "Clients can view approved discovery opportunities" 
ON discovery_opportunities FOR SELECT
USING (
  show_in_client_view = true 
  AND client_id IN (
    SELECT id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- Index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_discovery_opportunities_client_visible 
  ON discovery_opportunities(client_id, show_in_client_view) 
  WHERE show_in_client_view = true;

CREATE INDEX IF NOT EXISTS idx_discovery_opportunities_engagement 
  ON discovery_opportunities(engagement_id);
