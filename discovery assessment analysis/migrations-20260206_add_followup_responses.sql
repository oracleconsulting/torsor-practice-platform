-- COPY - Do not edit. Reference only. Source: supabase/migrations/20260206_add_followup_responses.sql
-- ADD FOLLOW-UP RESPONSES COLUMN to destination_discovery
ALTER TABLE destination_discovery
  ADD COLUMN IF NOT EXISTS follow_up_responses JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN destination_discovery.follow_up_responses IS 'Type-specific follow-up question responses. Stored as JSONB with question keys and answer values.';
