ALTER TABLE roadmap_stages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
COMMENT ON COLUMN roadmap_stages.metadata IS 'Flexible metadata — enrichment sources, generation config, etc.';
