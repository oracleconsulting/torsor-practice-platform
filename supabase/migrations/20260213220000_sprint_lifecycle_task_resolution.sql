-- ============================================================================
-- Sprint Lifecycle — Task Resolution + Week Gating
-- ============================================================================
-- Adds 'skipped' status, skip tracking, and sprint/tier columns for gating.
-- ============================================================================

-- 1. Add 'skipped' to client_tasks status CHECK
ALTER TABLE client_tasks DROP CONSTRAINT IF EXISTS client_tasks_status_check;
ALTER TABLE client_tasks ADD CONSTRAINT client_tasks_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped'));

-- 2. Add skip tracking columns
ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS skip_reason TEXT;
ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS skipped_at TIMESTAMPTZ;

-- 3. Sprint numbering (for future renewal support)
ALTER TABLE roadmap_stages ADD COLUMN IF NOT EXISTS sprint_number INTEGER DEFAULT 1;

-- 4. Tier and sprint tracking (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_service_lines') THEN
    ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS current_sprint_number INTEGER DEFAULT 1;
    ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS tier_name TEXT;
    ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS max_sprints INTEGER DEFAULT 1;
    ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS renewal_due_at TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN client_tasks.skip_reason IS 'Optional reason when task is skipped';
COMMENT ON COLUMN client_tasks.skipped_at IS 'When the task was marked skipped';
