-- ============================================================================
-- ADD show_in_client_view COLUMN TO discovery_opportunities
-- ============================================================================
-- Allows admins to mark which opportunities should be shown in client view

ALTER TABLE discovery_opportunities
ADD COLUMN IF NOT EXISTS show_in_client_view BOOLEAN DEFAULT false;

COMMENT ON COLUMN discovery_opportunities.show_in_client_view IS 
'Whether this opportunity should be displayed in the client-facing report view';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_discovery_opps_client_view 
ON discovery_opportunities(engagement_id, show_in_client_view) 
WHERE show_in_client_view = true;
