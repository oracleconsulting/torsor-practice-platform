ALTER TABLE sa_engagements
ADD COLUMN IF NOT EXISTS platform_direction JSONB DEFAULT NULL;

COMMENT ON COLUMN sa_engagements.platform_direction IS
  'Practice team strategic platform recommendation for optimal stack (Map 4).
   Set during review phase before report generation. JSON structure:
   { financial_core: { platform, rationale, constraints[] },
     document_layer: { platform, rationale },
     operational_keep: [slugs],
     must_replace: [slugs],
     notes: string }';
