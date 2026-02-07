-- Migration: Add report templates and per-report PDF configuration
-- Date: 2026-02-07
-- Purpose: Support customizable PDF export with saved templates

-- =============================================================================
-- 1. REPORT TEMPLATES TABLE (Practice-level presets)
-- =============================================================================

CREATE TABLE IF NOT EXISTS benchmarking_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Template identification
  name TEXT NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3)),
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Section configuration (JSONB array of section objects)
  -- Each object: { id: string, config: object, enabled: boolean }
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Global PDF settings
  pdf_settings JSONB DEFAULT '{
    "pageSize": "A4",
    "margins": { "top": 15, "right": 15, "bottom": 15, "left": 15 },
    "headerFooter": true,
    "coverPage": true,
    "tableOfContents": false,
    "watermark": null
  }'::jsonb,
  
  -- Branding overrides (null = use practice defaults)
  branding JSONB DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique names per practice
  UNIQUE(practice_id, name)
);

-- Index for fast lookup
CREATE INDEX idx_bm_templates_practice ON benchmarking_report_templates(practice_id);
CREATE INDEX idx_bm_templates_tier ON benchmarking_report_templates(tier);

-- =============================================================================
-- 2. ADD PDF CONFIG TO EXISTING REPORTS TABLE
-- =============================================================================

-- Add column for per-report PDF customization
ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS pdf_config JSONB DEFAULT NULL;

-- Add column to track which template was used (if any)
ALTER TABLE bm_reports
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES benchmarking_report_templates(id) ON DELETE SET NULL;

-- Add column for last PDF generation timestamp
ALTER TABLE bm_reports
ADD COLUMN IF NOT EXISTS last_pdf_generated_at TIMESTAMPTZ DEFAULT NULL;

-- Comment explaining the pdf_config structure
COMMENT ON COLUMN bm_reports.pdf_config IS 
'Per-report PDF customization. Structure:
{
  "sections": [{ "id": "cover", "config": {...}, "enabled": true }, ...],
  "pdfSettings": { "pageSize": "A4", ... },
  "generatedTier": 1 or 2
}
If null, uses template_id settings or system defaults.';

-- =============================================================================
-- 3. INSERT DEFAULT TEMPLATES
-- =============================================================================

-- Tier 1: Insight (full diagnosis, what to do)
INSERT INTO benchmarking_report_templates (practice_id, name, description, tier, is_default, sections, pdf_settings)
VALUES (
  NULL, -- NULL practice_id = system-wide default
  'Tier 1 - Insight',
  'Full diagnosis with recommendations (what to do). All metrics, valuations, and gaps included.',
  1,
  TRUE,
  '[
    {"id": "cover", "enabled": true, "config": {}},
    {"id": "executiveSummary", "enabled": true, "config": {"showHeroMetrics": true}},
    {"id": "hiddenValue", "enabled": true, "config": {}},
    {"id": "keyMetrics", "enabled": true, "config": {"layout": "detailed", "showPercentileBars": true}},
    {"id": "positionNarrative", "enabled": true, "config": {}},
    {"id": "strengthsNarrative", "enabled": true, "config": {}},
    {"id": "gapsNarrative", "enabled": true, "config": {}},
    {"id": "opportunityNarrative", "enabled": true, "config": {}},
    {"id": "recommendations", "enabled": true, "config": {"detailLevel": "summary", "showImplementationSteps": false, "showStartThisWeek": false}},
    {"id": "valuationAnalysis", "enabled": true, "config": {}},
    {"id": "valueSuppressors", "enabled": true, "config": {"layout": "table"}},
    {"id": "exitReadiness", "enabled": true, "config": {"showPathTo70": false}},
    {"id": "scenarioPlanning", "enabled": true, "config": {"layout": "table"}},
    {"id": "closingSummary", "enabled": true, "config": {"showContactCTA": true}}
  ]'::jsonb,
  '{
    "pageSize": "A4",
    "margins": {"top": 12, "right": 12, "bottom": 12, "left": 12},
    "headerFooter": true,
    "coverPage": true,
    "density": "comfortable"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Tier 2: Clarity (full diagnosis + implementation playbook)
INSERT INTO benchmarking_report_templates (practice_id, name, description, tier, is_default, sections, pdf_settings)
VALUES (
  NULL,
  'Tier 2 - Clarity',
  'Complete diagnosis plus detailed implementation roadmap (how to do it). Includes service recommendations.',
  2,
  TRUE,
  '[
    {"id": "cover", "enabled": true, "config": {}},
    {"id": "executiveSummary", "enabled": true, "config": {"showHeroMetrics": true}},
    {"id": "hiddenValue", "enabled": true, "config": {"showBreakdown": true}},
    {"id": "keyMetrics", "enabled": true, "config": {"layout": "full", "showPercentileBars": true, "showGapIndicators": true}},
    {"id": "positionNarrative", "enabled": true, "config": {}},
    {"id": "strengthsNarrative", "enabled": true, "config": {}},
    {"id": "gapsNarrative", "enabled": true, "config": {}},
    {"id": "opportunityNarrative", "enabled": true, "config": {}},
    {"id": "recommendations", "enabled": true, "config": {"detailLevel": "full", "showImplementationSteps": true, "showStartThisWeek": true}},
    {"id": "scenarioExplorer", "enabled": true, "config": {}},
    {"id": "valuationAnalysis", "enabled": true, "config": {"showSurplusCashAdd": true}},
    {"id": "valueSuppressors", "enabled": true, "config": {"layout": "cards", "showRecoveryTimelines": true}},
    {"id": "exitReadiness", "enabled": true, "config": {"showComponentBreakdown": true, "showPathTo70": true}},
    {"id": "twoPaths", "enabled": true, "config": {}},
    {"id": "scenarioPlanning", "enabled": true, "config": {"layout": "sequential", "showRequirements": true}},
    {"id": "serviceRecommendations", "enabled": true, "config": {"showPricing": true, "showValueAtStake": true, "showOutcomes": true}},
    {"id": "closingSummary", "enabled": true, "config": {"showContactCTA": true, "showDataSources": true}}
  ]'::jsonb,
  '{
    "pageSize": "A4",
    "margins": {"top": 12, "right": 12, "bottom": 12, "left": 12},
    "headerFooter": true,
    "coverPage": true,
    "density": "compact"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

ALTER TABLE benchmarking_report_templates ENABLE ROW LEVEL SECURITY;

-- Practice members can view their practice's templates + system defaults
CREATE POLICY "View own practice templates and system defaults"
ON benchmarking_report_templates FOR SELECT
USING (
  practice_id IS NULL 
  OR practice_id IN (
    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
  )
);

-- Only practice admins can create/update/delete their practice's templates
CREATE POLICY "Manage own practice templates"
ON benchmarking_report_templates FOR ALL
USING (
  practice_id IN (
    SELECT practice_id FROM practice_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- =============================================================================
-- 5. HELPER FUNCTION: Get effective PDF config for a report
-- =============================================================================

CREATE OR REPLACE FUNCTION get_report_pdf_config(report_id UUID)
RETURNS JSONB AS $$
DECLARE
  report_record RECORD;
  template_config JSONB;
BEGIN
  -- Get the report (bm_reports keyed by engagement_id)
  SELECT pdf_config, template_id INTO report_record
  FROM bm_reports WHERE engagement_id = report_id;
  
  -- If report has custom config, use it
  IF report_record.pdf_config IS NOT NULL THEN
    RETURN report_record.pdf_config;
  END IF;
  
  -- If report has a template, use template config
  IF report_record.template_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'sections', sections,
      'pdfSettings', pdf_settings,
      'templateName', name,
      'tier', tier
    ) INTO template_config
    FROM benchmarking_report_templates WHERE id = report_record.template_id;
    
    IF template_config IS NOT NULL THEN
      RETURN template_config;
    END IF;
  END IF;
  
  -- Fall back to Tier 2 default
  SELECT jsonb_build_object(
    'sections', sections,
    'pdfSettings', pdf_settings,
    'templateName', name,
    'tier', tier
  ) INTO template_config
  FROM benchmarking_report_templates 
  WHERE practice_id IS NULL AND tier = 2 AND is_default = TRUE
  LIMIT 1;
  
  RETURN COALESCE(template_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_bm_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bm_template_timestamp
BEFORE UPDATE ON benchmarking_report_templates
FOR EACH ROW EXECUTE FUNCTION update_bm_template_timestamp();
