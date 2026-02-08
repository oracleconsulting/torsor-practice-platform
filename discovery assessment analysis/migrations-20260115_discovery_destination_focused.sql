-- COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md
-- ============================================================================
-- DISCOVERY REPORTS - DESTINATION-FOCUSED STRUCTURE
-- ============================================================================
-- "We're travel agents selling holidays, not airlines selling seats."
-- New columns to support the 5-page destination-focused report structure
-- ============================================================================

-- Add new destination-focused columns to discovery_reports
ALTER TABLE discovery_reports 
ADD COLUMN IF NOT EXISTS destination_report JSONB,
ADD COLUMN IF NOT EXISTS page1_destination JSONB,
ADD COLUMN IF NOT EXISTS page2_gaps JSONB,
ADD COLUMN IF NOT EXISTS page3_journey JSONB,
ADD COLUMN IF NOT EXISTS page4_numbers JSONB,
ADD COLUMN IF NOT EXISTS page5_next_steps JSONB,
ADD COLUMN IF NOT EXISTS quotes_used TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personal_anchors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'medium';

-- Add index for faster queries on destination report status
CREATE INDEX IF NOT EXISTS idx_discovery_reports_destination 
ON discovery_reports ((destination_report IS NOT NULL));

-- Comment on the new structure
COMMENT ON COLUMN discovery_reports.destination_report IS 'Complete destination-focused report JSON';
COMMENT ON COLUMN discovery_reports.page1_destination IS 'Page 1: The Destination You Described (their vision verbatim)';
COMMENT ON COLUMN discovery_reports.page2_gaps IS 'Page 2: What''s In The Way (gaps with patterns and costs)';
COMMENT ON COLUMN discovery_reports.page3_journey IS 'Page 3: The Journey (timeline with feelings, not features)';
COMMENT ON COLUMN discovery_reports.page4_numbers IS 'Page 4: The Numbers (cost of staying vs investment vs return)';
COMMENT ON COLUMN discovery_reports.page5_next_steps IS 'Page 5: What Happens Next (clear CTA)';
COMMENT ON COLUMN discovery_reports.quotes_used IS 'Array of 8+ verbatim quotes used in the report';
COMMENT ON COLUMN discovery_reports.personal_anchors IS 'Personal details used (spouse name, kids ages, etc)';
COMMENT ON COLUMN discovery_reports.urgency_level IS 'high/medium/low based on detected patterns';



