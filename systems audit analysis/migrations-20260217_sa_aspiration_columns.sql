-- ============================================================================
-- Add target-state / aspiration columns to sa_discovery_responses
-- Captures WHERE the client wants their operations to get to
-- ============================================================================

-- Structured operational goals (multi-select, stored as text array)
ALTER TABLE sa_discovery_responses
  ADD COLUMN IF NOT EXISTS desired_outcomes TEXT[];

COMMENT ON COLUMN sa_discovery_responses.desired_outcomes
  IS 'Top 3 operational outcomes the client wants — drives recommendation anchoring';

-- Open text vision — what "fixed" looks like on a Monday morning
ALTER TABLE sa_discovery_responses
  ADD COLUMN IF NOT EXISTS monday_morning_vision TEXT;

COMMENT ON COLUMN sa_discovery_responses.monday_morning_vision
  IS 'Client''s description of what Monday morning looks like when systems work — emotional anchor for Your Future narrative';

-- What they would do with reclaimed time
ALTER TABLE sa_discovery_responses
  ADD COLUMN IF NOT EXISTS time_freedom_priority TEXT;

COMMENT ON COLUMN sa_discovery_responses.time_freedom_priority
  IS 'What they would do with 10+ hours/week back — drives time freedom narrative personalisation';
