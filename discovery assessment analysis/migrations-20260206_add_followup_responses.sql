-- ============================================================================
-- ADD FOLLOW-UP RESPONSES COLUMN
-- ============================================================================
-- Adds follow_up_responses JSONB column to destination_discovery table
-- Stores type-specific follow-up question responses
-- ============================================================================

ALTER TABLE destination_discovery 
  ADD COLUMN IF NOT EXISTS follow_up_responses JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN destination_discovery.follow_up_responses IS 'Type-specific follow-up question responses (investment_vehicle, funded_startup, trading_agency, professional_practice). Stored as JSONB with question keys and answer values.';
