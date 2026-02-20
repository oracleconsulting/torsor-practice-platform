-- =============================================================================
-- Migration: Add opportunity_calculations for full calculation transparency
-- Date: 2026-02-03
-- Purpose: Store full calculation breakdown for each opportunity figure
-- =============================================================================

-- Add opportunity_calculations column to bm_reports
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS opportunity_calculations JSONB DEFAULT '{}';

COMMENT ON COLUMN bm_reports.opportunity_calculations IS 
'Stores full calculation breakdown for each opportunity figure including steps, assumptions, and adjustments';

-- Add enhanced_suppressors column for detailed suppressor data
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS enhanced_suppressors JSONB DEFAULT '[]';

COMMENT ON COLUMN bm_reports.enhanced_suppressors IS 
'Stores enhanced value suppressor data with current/target states, recovery paths, and investment requirements';

-- Add exit_readiness_breakdown column for component-level scoring
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS exit_readiness_breakdown JSONB DEFAULT '{}';

COMMENT ON COLUMN bm_reports.exit_readiness_breakdown IS 
'Stores exit readiness scoring breakdown by component with improvement paths';

-- Add two_paths_narrative column for connecting operational and strategic
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS two_paths_narrative JSONB DEFAULT '{}';

COMMENT ON COLUMN bm_reports.two_paths_narrative IS 
'Stores the "Two Paths, One Goal" narrative connecting operational and strategic opportunities';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bm_reports_enhanced_suppressors 
ON bm_reports USING GIN (enhanced_suppressors);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
