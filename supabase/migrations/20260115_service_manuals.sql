-- ============================================================================
-- SERVICE LINE MANUALS & DOCUMENTATION
-- ============================================================================
-- Add manual/documentation storage to service lines
-- Enables "Enabled by: [Service]" to be clickable with popup detail view
-- ============================================================================

-- Add manual and documentation fields to service_line_metadata
ALTER TABLE service_line_metadata 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS manual_content TEXT,                    -- Rich text/markdown manual content
ADD COLUMN IF NOT EXISTS manual_file_path TEXT,                  -- Path to uploaded PDF in storage
ADD COLUMN IF NOT EXISTS key_deliverables TEXT[],                -- What the client receives
ADD COLUMN IF NOT EXISTS typical_timeline TEXT,                  -- "4-6 weeks" etc
ADD COLUMN IF NOT EXISTS roi_calculation_method TEXT,            -- How ROI is calculated
ADD COLUMN IF NOT EXISTS roi_example TEXT,                       -- Example ROI calculation
ADD COLUMN IF NOT EXISTS prerequisites TEXT[],                   -- Required before this service
ADD COLUMN IF NOT EXISTS complementary_services TEXT[];          -- Services that pair well

-- Update existing records with display names (fixing 365 naming)
UPDATE service_line_metadata SET
  display_name = CASE code
    WHEN '365_method' THEN 'Goal Alignment Programme'
    WHEN 'management_accounts' THEN 'Management Accounts'
    WHEN 'systems_audit' THEN 'Systems Audit'
    WHEN 'fractional_cfo' THEN 'Fractional CFO Services'
    WHEN 'fractional_coo' THEN 'Fractional COO Services'
    WHEN 'combined_advisory' THEN 'Combined CFO/COO Advisory'
    WHEN 'business_advisory' THEN 'Business Advisory & Exit Planning'
    WHEN 'automation' THEN 'Automation Services'
    WHEN 'benchmarking' THEN 'Benchmarking Services'
    ELSE name
  END,
  short_description = CASE code
    WHEN '365_method' THEN 'Life-first business transformation with structured accountability'
    WHEN 'management_accounts' THEN 'Monthly financial visibility with actionable insights'
    WHEN 'systems_audit' THEN 'Map every bottleneck, fix the right problems first'
    WHEN 'fractional_cfo' THEN 'Strategic financial leadership without the full-time cost'
    WHEN 'fractional_coo' THEN 'Operational leadership to build systems that run without you'
    WHEN 'combined_advisory' THEN 'Integrated financial and operational executive partnership'
    WHEN 'business_advisory' THEN 'Protect and maximise the value you have built'
    WHEN 'automation' THEN 'Eliminate manual work and unlock team capacity'
    WHEN 'benchmarking' THEN 'Know how you compare, know what to fix'
    ELSE core_function
  END
WHERE display_name IS NULL;

-- Add key deliverables for each service
UPDATE service_line_metadata SET
  key_deliverables = CASE code
    WHEN 'management_accounts' THEN ARRAY[
      'Monthly P&L with commentary',
      'Balance Sheet',
      'Cash Flow statement',
      'KPI dashboard',
      'Rolling 12-month forecast',
      'Board pack ready'
    ]
    WHEN 'systems_audit' THEN ARRAY[
      'Process map of all core operations',
      'Bottleneck identification matrix',
      'Integration gap analysis',
      'Quick wins list (< 30 days)',
      'Medium-term roadmap (3-6 months)',
      'Cost of manual work calculation'
    ]
    WHEN '365_method' THEN ARRAY[
      '5-Year Vision document',
      '6-Month Shift priorities',
      '12-Week Sprint plans',
      'Weekly accountability sessions',
      'Progress tracking dashboard',
      'Life-work integration scorecard'
    ]
    WHEN 'fractional_cfo' THEN ARRAY[
      'Monthly financial review meetings',
      'Board meeting preparation',
      'Investor materials support',
      'Pricing and margin analysis',
      'Cash runway management',
      'Strategic scenario modelling'
    ]
    WHEN 'fractional_coo' THEN ARRAY[
      'Operations playbook',
      'Team structure recommendations',
      'Process documentation',
      'Hiring support',
      'Performance frameworks',
      'Delegation matrices'
    ]
    ELSE key_deliverables
  END
WHERE key_deliverables IS NULL;

-- Add ROI calculation methods
UPDATE service_line_metadata SET
  roi_calculation_method = CASE code
    WHEN 'management_accounts' THEN 'Cost of bad decisions avoided. Typical clients identify 2-3 pricing/cost issues worth £10-50k in first quarter.'
    WHEN 'systems_audit' THEN 'Manual work hours × hourly cost. Typical finding: 30-50% of team effort is manual work that could be automated or eliminated.'
    WHEN '365_method' THEN 'Hours reclaimed + opportunity cost. Reducing 70→40 hours/week = 1,560 hours/year. At £100/hr, that''s £156,000 in time value.'
    WHEN 'fractional_cfo' THEN 'Valuation multiple improvement. Systemised businesses sell at 8-12x vs 4-6x for founder-dependent. At £5M revenue, that''s £10-30M delta.'
    WHEN 'fractional_coo' THEN 'Founder time freed + operational efficiency. Typical: 20+ hours/week of founder time freed, £30-60k in process efficiency gains.'
    WHEN 'combined_advisory' THEN 'Combined CFO and COO value. Strategic coordination typically adds 10-20% efficiency over separate engagements.'
    WHEN 'automation' THEN 'Hours saved × hourly cost. Typical automation project: 10-20 hours/week saved = £25-75k/year depending on who was doing the work.'
    WHEN 'benchmarking' THEN 'Performance gap identification. Knowing you''re 15% below industry margin highlights £50-200k improvement opportunity.'
    ELSE roi_calculation_method
  END
WHERE roi_calculation_method IS NULL;

-- Add typical timelines
UPDATE service_line_metadata SET
  typical_timeline = CASE code
    WHEN 'management_accounts' THEN 'Ongoing monthly delivery, first report within 2 weeks of engagement'
    WHEN 'systems_audit' THEN '4-6 weeks for comprehensive audit and roadmap'
    WHEN '365_method' THEN '12-month programme with weekly touchpoints'
    WHEN 'fractional_cfo' THEN 'Ongoing engagement, typically 2-4 days per month'
    WHEN 'fractional_coo' THEN 'Ongoing engagement, typically 2-4 days per month'
    WHEN 'combined_advisory' THEN 'Ongoing engagement, typically 3-5 days per month combined'
    WHEN 'business_advisory' THEN '3-6 months initial engagement, then ongoing as needed'
    WHEN 'automation' THEN 'Project-based, typically 4-12 weeks per initiative'
    WHEN 'benchmarking' THEN '2-4 weeks for full analysis and recommendations'
    ELSE typical_timeline
  END
WHERE typical_timeline IS NULL;

-- Add prerequisite relationships
UPDATE service_line_metadata SET
  prerequisites = CASE code
    WHEN 'automation' THEN ARRAY['systems_audit']
    WHEN 'fractional_coo' THEN ARRAY['systems_audit']
    WHEN 'combined_advisory' THEN ARRAY['management_accounts']
    WHEN 'business_advisory' THEN ARRAY['management_accounts']
    ELSE ARRAY[]::TEXT[]
  END
WHERE prerequisites IS NULL;

-- Add complementary services
UPDATE service_line_metadata SET
  complementary_services = CASE code
    WHEN 'management_accounts' THEN ARRAY['fractional_cfo', 'benchmarking']
    WHEN 'systems_audit' THEN ARRAY['automation', 'fractional_coo']
    WHEN '365_method' THEN ARRAY['management_accounts', 'fractional_cfo']
    WHEN 'fractional_cfo' THEN ARRAY['management_accounts', 'benchmarking']
    WHEN 'fractional_coo' THEN ARRAY['systems_audit', 'automation']
    WHEN 'automation' THEN ARRAY['systems_audit', 'fractional_coo']
    ELSE ARRAY[]::TEXT[]
  END
WHERE complementary_services IS NULL;

-- Create storage bucket for service manuals
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-manuals', 'service-manuals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for manual uploads (team members only)
DROP POLICY IF EXISTS "Team members can upload manuals" ON storage.objects;
CREATE POLICY "Team members can upload manuals" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-manuals'
  AND EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE pm.user_id = auth.uid()
    AND pm.member_type = 'team'
  )
);

-- Public read access for manuals
DROP POLICY IF EXISTS "Manuals are publicly readable" ON storage.objects;
CREATE POLICY "Manuals are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'service-manuals');

-- Create a function to get service detail for popup
CREATE OR REPLACE FUNCTION get_service_detail(p_code TEXT)
RETURNS TABLE (
  code TEXT,
  display_name TEXT,
  short_description TEXT,
  core_function TEXT,
  key_deliverables TEXT[],
  pricing JSONB,
  typical_timeline TEXT,
  roi_calculation_method TEXT,
  prerequisites TEXT[],
  complementary_services TEXT[],
  manual_content TEXT,
  manual_file_path TEXT,
  problems_addressed TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    slm.code,
    slm.display_name,
    slm.short_description,
    slm.core_function,
    slm.key_deliverables,
    slm.pricing,
    slm.typical_timeline,
    slm.roi_calculation_method,
    slm.prerequisites,
    slm.complementary_services,
    slm.manual_content,
    slm.manual_file_path,
    slm.problems_addressed
  FROM service_line_metadata slm
  WHERE slm.code = p_code;
END;
$$;

GRANT EXECUTE ON FUNCTION get_service_detail(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_service_detail(TEXT) TO anon;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_line_metadata_code ON service_line_metadata(code);

-- Comment for documentation
COMMENT ON COLUMN service_line_metadata.display_name IS 'User-facing name (e.g., Goal Alignment Programme instead of 365_method)';
COMMENT ON COLUMN service_line_metadata.manual_content IS 'Markdown/rich text content for inline manual display';
COMMENT ON COLUMN service_line_metadata.manual_file_path IS 'Path to PDF manual in service-manuals storage bucket';


