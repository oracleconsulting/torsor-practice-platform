-- ============================================================================
-- Discovery Three-Phase Pipeline
-- ============================================================================
-- Add new status values and phase timestamps for the restructured workflow:
-- Phase 1: Deep Analysis (prepare → advisory-deep-dive → generate-analysis)
-- Phase 2: Score + Opportunities (pass1 → generate-discovery-opportunities)
-- Phase 3: Narrative Report (pass2)
-- ============================================================================

-- discovery_engagements: expand status enum (drop inline check and re-add)
ALTER TABLE discovery_engagements
DROP CONSTRAINT IF EXISTS discovery_engagements_status_check;

ALTER TABLE discovery_engagements
ADD CONSTRAINT discovery_engagements_status_check
CHECK (status IN (
    'pending_responses',
    'responses_complete',
    -- Phase 1: Deep Analysis
    'analysis_processing',
    'analysis_complete',
    -- Phase 2: Scoring & Opportunities
    'pass1_processing',
    'pass1_complete',
    'opportunities_processing',
    'opportunities_complete',
    -- Legacy
    'adding_context',
    -- Phase 3: Narrative Report
    'pass2_processing',
    'pass2_complete',
    -- Review & Publish
    'approved',
    'published',
    'delivered'
));

-- Phase tracking timestamps
ALTER TABLE discovery_engagements
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opportunities_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opportunities_completed_at TIMESTAMPTZ;

-- discovery_reports: expand status for phase clarity
ALTER TABLE discovery_reports
DROP CONSTRAINT IF EXISTS discovery_reports_status_check;

ALTER TABLE discovery_reports
ADD CONSTRAINT discovery_reports_status_check
CHECK (status IN (
    'pending',
    'analysis_complete',
    'pass1_complete',
    'opportunities_complete',
    'generated',
    'approved',
    'published'
));
