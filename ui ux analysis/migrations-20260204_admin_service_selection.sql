-- ============================================================================
-- Migration: Admin Service Selection Tables
-- Purpose: Allow advisors to pin/block specific services for each engagement
-- Created: 2026-02-04
-- ============================================================================

-- Table to store advisor-selected services for each engagement
CREATE TABLE IF NOT EXISTS bm_engagement_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES bm_engagements(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  selection_type text NOT NULL CHECK (selection_type IN ('pinned', 'blocked', 'suggested')),
  reason text,  -- Optional: why this was pinned/blocked
  include_in_value_calc boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(engagement_id, service_code)
);

COMMENT ON TABLE bm_engagement_services IS 
'Advisor-selected services to include or exclude from benchmarking analysis';

COMMENT ON COLUMN bm_engagement_services.selection_type IS 
'pinned = always include this service in recommendations
blocked = never recommend this service
suggested = AI suggested, advisor confirmed';

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_bm_engagement_services_engagement 
ON bm_engagement_services(engagement_id);

-- Also add columns to bm_reports for quick access during report generation
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS pinned_services jsonb DEFAULT '[]';

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS blocked_services_manual jsonb DEFAULT '[]';

COMMENT ON COLUMN bm_reports.pinned_services IS 
'Services manually pinned by advisor - ALWAYS include in recommendations';

COMMENT ON COLUMN bm_reports.blocked_services_manual IS 
'Services manually blocked by advisor - NEVER include in recommendations';

-- Create service alternatives table (for automatic substitution)
CREATE TABLE IF NOT EXISTS service_alternatives (
  blocked_service_code text NOT NULL,
  alternative_service_code text NOT NULL,
  condition text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocked_service_code, condition)
);

COMMENT ON TABLE service_alternatives IS 
'Defines alternative services to suggest when a service is blocked';

-- Insert default alternatives
INSERT INTO service_alternatives (blocked_service_code, alternative_service_code, condition, reason)
VALUES
  ('FRACTIONAL_COO', 'STRATEGIC_ADVISORY', 'avoidsInternalHires', 'Client prefers external support over embedded roles'),
  ('FRACTIONAL_COO', 'SYSTEMS_AUDIT', 'needsSystemsAudit', 'Address documentation needs through focused project'),
  ('FRACTIONAL_CFO', 'STRATEGIC_ADVISORY', 'avoidsInternalHires', 'Strategic finance input on project basis'),
  ('BENCHMARKING_DEEP_DIVE', 'QUARTERLY_BI_SUPPORT', 'hasActiveBenchmark', 'Ongoing insight rather than repeated deep dive')
ON CONFLICT DO NOTHING;

-- RLS Policies for bm_engagement_services
ALTER TABLE bm_engagement_services ENABLE ROW LEVEL SECURITY;

-- Admin/team members can manage service selections
CREATE POLICY "Practice members can manage engagement services"
ON bm_engagement_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM bm_engagements e
    JOIN practice_members pm ON pm.practice_id = e.practice_id
    WHERE e.id = bm_engagement_services.engagement_id
    AND pm.user_id = auth.uid()
    AND pm.member_type IN ('admin', 'owner', 'team')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bm_engagements e
    JOIN practice_members pm ON pm.practice_id = e.practice_id
    WHERE e.id = bm_engagement_services.engagement_id
    AND pm.user_id = auth.uid()
    AND pm.member_type IN ('admin', 'owner', 'team')
  )
);

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20260204_admin_service_selection completed';
END $$;
