-- =============================================================================
-- STRATEGIC OVERHAUL: Leadership, Direction, and Priority-Based Opportunities
-- =============================================================================
-- This migration adds:
-- 1. Client direction and leadership context to engagements
-- 2. Priority classification for opportunities
-- 3. Synthesis narrative storage
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Add leadership and direction context to engagements
-- -----------------------------------------------------------------------------

ALTER TABLE bm_engagements
ADD COLUMN IF NOT EXISTS client_direction VARCHAR(50),
ADD COLUMN IF NOT EXISTS client_exit_timeline VARCHAR(50),
ADD COLUMN IF NOT EXISTS has_cfo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_coo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS leadership_structure VARCHAR(50),
ADD COLUMN IF NOT EXISTS existing_roles TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN bm_engagements.client_direction IS 
'Primary business direction: grow_aggressive, grow_steady, maintain_optimise, step_back, prepare_exit, unsure';

COMMENT ON COLUMN bm_engagements.client_exit_timeline IS 
'Exit timeline if applicable: within_2_years, 2_to_5_years, 5_plus_years, right_offer, no_exit';

COMMENT ON COLUMN bm_engagements.leadership_structure IS 
'Leadership structure: solo, informal, formal_small, full_exec';

-- Create index for filtering by direction
CREATE INDEX IF NOT EXISTS idx_bm_engagements_direction 
ON bm_engagements(client_direction);

-- -----------------------------------------------------------------------------
-- PART 2: Add priority columns to client_opportunities
-- -----------------------------------------------------------------------------

ALTER TABLE client_opportunities
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'next_12_months',
ADD COLUMN IF NOT EXISTS priority_rationale TEXT,
ADD COLUMN IF NOT EXISTS priority_adjusted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consolidated_from TEXT[],
ADD COLUMN IF NOT EXISTS for_the_owner TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN client_opportunities.priority IS 
'Priority classification: must_address_now, next_12_months, when_ready';

COMMENT ON COLUMN client_opportunities.priority_rationale IS 
'Why this priority was assigned given client direction';

COMMENT ON COLUMN client_opportunities.consolidated_from IS 
'Array of opportunity codes that were merged into this one';

COMMENT ON COLUMN client_opportunities.for_the_owner IS 
'Direct message to business owner - personal, impactful';

-- Create index for priority queries
CREATE INDEX IF NOT EXISTS idx_client_opportunities_priority 
ON client_opportunities(engagement_id, priority);

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_client_opportunities_display_order 
ON client_opportunities(engagement_id, display_order);

-- -----------------------------------------------------------------------------
-- PART 3: Add synthesis data to bm_reports
-- -----------------------------------------------------------------------------

ALTER TABLE bm_reports
ADD COLUMN IF NOT EXISTS opportunity_synthesis JSONB,
ADD COLUMN IF NOT EXISTS not_recommended_services JSONB,
ADD COLUMN IF NOT EXISTS opportunity_data_gaps TEXT[],
ADD COLUMN IF NOT EXISTS client_direction_at_generation VARCHAR(50);

-- Add comments
COMMENT ON COLUMN bm_reports.opportunity_synthesis IS 
'Narrative synthesis: {opening, theGap, thePath, theStakes}';

COMMENT ON COLUMN bm_reports.not_recommended_services IS 
'Services not recommended and why: [{serviceCode, reason}]';

COMMENT ON COLUMN bm_reports.client_direction_at_generation IS 
'Client direction at time of generation (for audit trail)';

-- -----------------------------------------------------------------------------
-- PART 4: Create view for priority-grouped opportunities
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_opportunities_by_priority AS
SELECT 
  co.*,
  be.client_direction,
  be.leadership_structure,
  be.has_cfo,
  be.has_coo,
  CASE 
    WHEN co.priority = 'must_address_now' THEN 1
    WHEN co.priority = 'next_12_months' THEN 2
    WHEN co.priority = 'when_ready' THEN 3
    ELSE 4
  END as priority_order
FROM client_opportunities co
JOIN bm_engagements be ON co.engagement_id = be.id
ORDER BY co.engagement_id, priority_order, co.display_order;

-- -----------------------------------------------------------------------------
-- Done
-- -----------------------------------------------------------------------------

