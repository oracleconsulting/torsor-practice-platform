-- ============================================================================
-- LLM RESPONSE CACHING - P1 Priority
-- ============================================================================
-- Expected: 40-60% LLM cost reduction
-- From: December 3, 2025 Architecture Assessment
-- ============================================================================

-- Create cache table
CREATE TABLE IF NOT EXISTS llm_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  model text NOT NULL,
  response jsonb NOT NULL,
  tokens_used int,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  hit_count int DEFAULT 0,
  last_hit_at timestamptz
);

-- Index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_cache_hash ON llm_response_cache(prompt_hash);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_cache_expires ON llm_response_cache(expires_at);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_cache_model ON llm_response_cache(model, created_at DESC);

-- RLS: Only service role can access cache
ALTER TABLE llm_response_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON llm_response_cache;
CREATE POLICY "Service role only" ON llm_response_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean expired cache entries (run daily via cron)
CREATE OR REPLACE FUNCTION clean_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM llm_response_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cache analytics view
CREATE OR REPLACE VIEW cache_analytics AS
SELECT 
  model,
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  SUM(tokens_used) as total_tokens_saved,
  -- Estimate cost savings (rough: $0.003 per 1k tokens)
  ROUND((SUM(hit_count * tokens_used) / 1000.0 * 0.003)::numeric, 2) as estimated_savings_usd
FROM llm_response_cache
WHERE expires_at > now()
GROUP BY model;

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 0,
  window_start bigint DEFAULT extract(epoch from now()) * 1000,
  updated_at timestamptz DEFAULT now()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key text,
  p_max_requests int,
  p_window_seconds int
) RETURNS boolean AS $$
DECLARE
  v_current record;
  v_now bigint := extract(epoch from now()) * 1000;
  v_window_start bigint;
BEGIN
  SELECT * INTO v_current FROM rate_limits WHERE key = p_key;
  
  v_window_start := v_now - (p_window_seconds * 1000);
  
  IF v_current IS NULL OR v_current.window_start < v_window_start THEN
    -- Start new window
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = v_now;
    RETURN true;
  END IF;
  
  IF v_current.count >= p_max_requests THEN
    RETURN false;  -- Rate limited
  END IF;
  
  -- Increment counter
  UPDATE rate_limits SET count = count + 1, updated_at = now() WHERE key = p_key;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Clean old rate limit entries (run hourly)
CREATE OR REPLACE FUNCTION clean_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < extract(epoch from now() - interval '1 day') * 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

