-- Migration: Rename "365 Alignment Programme" to "Goal Alignment Programme"
-- This fixes the service name displayed in discovery analysis recommendations

-- Update service_line_metadata (main service table)
UPDATE service_line_metadata
SET name = 'Goal Alignment Programme'
WHERE code = '365_method' AND name LIKE '%365 Alignment%';

-- Update core_function if it references 365 Alignment
UPDATE service_line_metadata
SET core_function = REPLACE(core_function, '365 Alignment', 'Goal Alignment')
WHERE core_function LIKE '%365 Alignment%';

-- Update service_advisory_triggers
UPDATE service_advisory_triggers
SET 
  rationale = REPLACE(rationale, '365 Alignment', 'Goal Alignment'),
  client_value_template = REPLACE(client_value_template, '365 Alignment', 'Goal Alignment')
WHERE rationale LIKE '%365 Alignment%' OR client_value_template LIKE '%365 Alignment%';

-- Update service_contraindications
UPDATE service_contraindications
SET alternative_suggestion = REPLACE(alternative_suggestion, '365', 'Goal Alignment')
WHERE alternative_suggestion LIKE '%365%' AND service_code = '365_method';

-- Update service_narrative_templates (hook column, not template_text)
UPDATE service_narrative_templates
SET hook = REPLACE(hook, '365 Alignment', 'Goal Alignment')
WHERE hook LIKE '%365 Alignment%';

-- Add comment for documentation
COMMENT ON TABLE service_line_metadata IS 'Service metadata - 365_method name changed to Goal Alignment Programme as of 2026-01-22';

