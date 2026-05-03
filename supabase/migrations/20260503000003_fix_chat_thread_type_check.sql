-- ============================================================================
-- FIX: client_chat_threads.thread_type CHECK constraint
-- ============================================================================
-- The pre-existing client_chat_threads table (created before migration
-- 20260502000002_advisory_agent.sql) had a CHECK constraint that did not
-- include 'advisory_agent', so the panel's INSERT failed with SQLSTATE
-- 23514 ("violates check constraint").
--
-- Drop the constraint and replace it with a permissive list that covers
-- the thread types we actually use, so any future thread_type the
-- application introduces won't require a DB migration.
-- ============================================================================

DO $$
BEGIN
  ALTER TABLE client_chat_threads
    DROP CONSTRAINT IF EXISTS client_chat_threads_thread_type_check;
EXCEPTION WHEN undefined_table THEN
  -- Table didn't exist; the create migration handles defaults.
  NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE client_chat_threads
    ADD CONSTRAINT client_chat_threads_thread_type_check
    CHECK (thread_type IN (
      'advisory_agent',
      'general',
      'support',
      'feedback',
      'sprint_chat',
      'discovery_chat'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
