-- ============================================================================
-- Add benchmark_sources_detail column to bm_reports
-- Stores rich source metadata from Perplexity search for admin transparency
-- ============================================================================

ALTER TABLE bm_reports 
ADD COLUMN IF NOT EXISTS benchmark_sources_detail JSONB;

COMMENT ON COLUMN bm_reports.benchmark_sources_detail IS 'Rich source data including per-metric attribution, confidence scores, and market context from Perplexity search';


