-- ============================================================================
-- BENCHMARK LIVE SEARCH ENHANCEMENT
-- ============================================================================
-- Adds support for live industry benchmark fetching via Perplexity AI
-- Tracks data sources, freshness, and search confidence
-- ============================================================================

-- Add live search tracking columns to benchmark_data
ALTER TABLE benchmark_data 
ADD COLUMN IF NOT EXISTS fetched_via TEXT DEFAULT 'manual' CHECK (fetched_via IN ('manual', 'live_search', 'api', 'import')),
ADD COLUMN IF NOT EXISTS sources TEXT[], -- Array of source URLs/citations
ADD COLUMN IF NOT EXISTS search_query TEXT, -- The query used to fetch this data
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ, -- Last time data was validated
ADD COLUMN IF NOT EXISTS raw_search_response JSONB, -- Full response from search for audit
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'UK'; -- Regional specificity

-- Create index for freshness queries (important for 30-day cache check)
CREATE INDEX IF NOT EXISTS idx_benchmark_data_freshness 
ON benchmark_data(industry_code, metric_code, updated_at DESC) 
WHERE is_current = true;

-- Create index for fetched_via queries
CREATE INDEX IF NOT EXISTS idx_benchmark_data_fetched_via 
ON benchmark_data(fetched_via, updated_at DESC);

-- ============================================================================
-- TABLE: benchmark_search_log
-- Detailed log of live benchmark searches for audit and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_search_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Search context
  industry_code TEXT REFERENCES industries(code),
  industry_name TEXT NOT NULL,
  revenue_band TEXT,
  employee_band TEXT,
  
  -- Search details
  search_provider TEXT NOT NULL CHECK (search_provider IN ('perplexity', 'grok', 'tavily', 'manual')),
  model_used TEXT NOT NULL, -- e.g., 'perplexity/sonar-pro'
  search_query TEXT NOT NULL,
  
  -- Response tracking
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'timeout', 'rate_limited')),
  metrics_found INTEGER DEFAULT 0,
  metrics_updated INTEGER DEFAULT 0,
  metrics_created INTEGER DEFAULT 0,
  
  -- Sources captured
  sources_found TEXT[],
  source_count INTEGER DEFAULT 0,
  
  -- Quality metrics
  confidence_score DECIMAL(3,2), -- Overall confidence in results
  validation_notes TEXT, -- Any warnings or validation issues
  
  -- Raw data for audit
  raw_response JSONB,
  parsed_metrics JSONB, -- Structured metrics extracted
  
  -- Cost tracking
  tokens_used INTEGER,
  estimated_cost DECIMAL(8,4),
  response_time_ms INTEGER,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Triggered by
  triggered_by TEXT CHECK (triggered_by IN ('benchmarking_service', 'scheduled_refresh', 'manual', 'other_service')),
  engagement_id UUID, -- If triggered by a specific benchmarking engagement
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by industry and recency
CREATE INDEX IF NOT EXISTS idx_benchmark_search_log_industry 
ON benchmark_search_log(industry_code, started_at DESC);

-- Index for finding recent successful searches (for cache checking)
CREATE INDEX IF NOT EXISTS idx_benchmark_search_log_success 
ON benchmark_search_log(industry_code, status, completed_at DESC) 
WHERE status = 'success';

-- ============================================================================
-- TABLE: benchmark_metric_sources
-- Links individual benchmark data points to their specific sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_metric_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benchmark_data_id UUID REFERENCES benchmark_data(id) ON DELETE CASCADE,
  
  source_name TEXT NOT NULL, -- e.g., "ONS Annual Business Survey 2024"
  source_type TEXT CHECK (source_type IN ('government', 'trade_association', 'research', 'news', 'company_data', 'aggregator')),
  source_url TEXT,
  source_date DATE, -- Publication date of the source
  
  -- Relevance scoring
  relevance_score DECIMAL(3,2), -- How relevant this source is to the metric
  citation_text TEXT, -- The actual quote/data from source
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_metric_sources_data 
ON benchmark_metric_sources(benchmark_data_id);

-- ============================================================================
-- FUNCTION: check_benchmark_freshness
-- Returns whether benchmarks for an industry need refreshing
-- ============================================================================

CREATE OR REPLACE FUNCTION check_benchmark_freshness(
  p_industry_code TEXT,
  p_max_age_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  needs_refresh BOOLEAN,
  last_updated TIMESTAMPTZ,
  days_old INTEGER,
  metric_count INTEGER,
  live_search_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN MAX(bd.updated_at) IS NULL THEN true
      WHEN MAX(bd.updated_at) < NOW() - (p_max_age_days || ' days')::INTERVAL THEN true
      ELSE false
    END as needs_refresh,
    MAX(bd.updated_at) as last_updated,
    COALESCE(EXTRACT(DAY FROM NOW() - MAX(bd.updated_at))::INTEGER, 999) as days_old,
    COUNT(*)::INTEGER as metric_count,
    COUNT(*) FILTER (WHERE bd.fetched_via = 'live_search')::INTEGER as live_search_count
  FROM benchmark_data bd
  WHERE bd.industry_code = p_industry_code
    AND bd.is_current = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_recent_search_for_industry
-- Gets the most recent successful search for an industry (for cache check)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recent_search_for_industry(
  p_industry_code TEXT,
  p_max_age_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  search_id UUID,
  searched_at TIMESTAMPTZ,
  sources_found TEXT[],
  confidence_score DECIMAL,
  metrics_found INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bsl.id,
    bsl.completed_at,
    bsl.sources_found,
    bsl.confidence_score,
    bsl.metrics_found
  FROM benchmark_search_log bsl
  WHERE bsl.industry_code = p_industry_code
    AND bsl.status = 'success'
    AND bsl.completed_at > NOW() - (p_max_age_days || ' days')::INTERVAL
  ORDER BY bsl.completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update benchmark_sources to add live search provider
-- ============================================================================

-- Add Perplexity as a benchmark source
INSERT INTO benchmark_sources (name, source_type, url, refresh_frequency, is_active, notes)
VALUES (
  'Perplexity AI Live Search',
  'research',
  'https://www.perplexity.ai',
  'monthly',
  true,
  'Real-time industry benchmark data via Perplexity Sonar Pro model. Aggregates data from government sources, trade associations, news, and company reports.'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN benchmark_data.fetched_via IS 'How this data was obtained: manual (seeded), live_search (Perplexity), api (direct integration), import (bulk)';
COMMENT ON COLUMN benchmark_data.sources IS 'Array of URLs or citations for this data point';
COMMENT ON COLUMN benchmark_data.confidence_score IS 'AI confidence in data accuracy (0.00-1.00)';
COMMENT ON COLUMN benchmark_data.last_verified_at IS 'Last time this data was cross-checked against sources';

COMMENT ON TABLE benchmark_search_log IS 'Audit log of all live benchmark searches for debugging and cost tracking';
COMMENT ON TABLE benchmark_metric_sources IS 'Links benchmark data points to their specific source citations';

COMMENT ON FUNCTION check_benchmark_freshness IS 'Check if an industry needs benchmark data refresh based on age threshold';
COMMENT ON FUNCTION get_recent_search_for_industry IS 'Get the most recent successful benchmark search for an industry';


