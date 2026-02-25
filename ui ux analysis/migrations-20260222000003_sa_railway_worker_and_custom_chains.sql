-- =============================================================================
-- SA Railway Worker + Custom Process Chains
-- 1A: Fix status CHECK on sa_audit_reports (CRITICAL)
-- 1B: Report jobs table for worker polling
-- 1C: Custom process chain columns and RLS
-- =============================================================================

-- 1A: Fix the status CHECK constraint to include ALL possible statuses
ALTER TABLE sa_audit_reports
DROP CONSTRAINT IF EXISTS sa_audit_reports_status_check;

ALTER TABLE sa_audit_reports
ADD CONSTRAINT sa_audit_reports_status_check
CHECK (status IN (
    'generating',
    'regenerating',
    'generated',
    'approved',
    'published',
    'delivered',
    'pass1_complete',
    'pass2_failed',
    'phase1_failed',
    'phase2_failed',
    'phase3_failed',
    'phase4_failed',
    'phase5_failed',
    'phase6_failed',
    'phase7_failed',
    'phase8_failed'
));

-- 1B: Report jobs table
CREATE TABLE IF NOT EXISTS sa_report_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,

  -- Job spec
  job_type TEXT NOT NULL DEFAULT 'pass1_full'
    CHECK (job_type IN ('pass1_full', 'pass1_from_phase', 'pass2')),
  start_phase INTEGER DEFAULT 1,
  config JSONB DEFAULT '{}',

  -- State
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'processing', 'completed', 'failed', 'cancelled')),
  worker_id TEXT,
  claimed_at TIMESTAMPTZ,

  -- Progress
  current_phase INTEGER,
  phase_started_at TIMESTAMPTZ,

  -- Result
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_phase INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for worker polling (find pending jobs fast)
CREATE INDEX IF NOT EXISTS idx_sa_report_jobs_pending
  ON sa_report_jobs (status, created_at) WHERE status = 'pending';

-- Index for engagement lookup
CREATE INDEX IF NOT EXISTS idx_sa_report_jobs_engagement
  ON sa_report_jobs (engagement_id);

-- Atomic job claiming function
CREATE OR REPLACE FUNCTION claim_report_job(p_worker_id TEXT)
RETURNS SETOF sa_report_jobs AS $$
BEGIN
  RETURN QUERY
  UPDATE sa_report_jobs
  SET
    status = 'claimed',
    worker_id = p_worker_id,
    claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM sa_report_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 1C: Custom process chain columns
ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES sa_engagements(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system'
    CHECK (source IN ('system', 'ai_suggested', 'admin_created', 'client_created')),
  ADD COLUMN IF NOT EXISTS question_config JSONB,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS chain_status TEXT DEFAULT 'active'
    CHECK (chain_status IN ('suggested', 'active', 'rejected'));

-- Mark all existing chains as core/system
UPDATE sa_process_chains SET is_core = TRUE, source = 'system', chain_status = 'active'
WHERE engagement_id IS NULL;

-- Drop the old unique constraint on chain_code (custom chains share codes across engagements)
ALTER TABLE sa_process_chains DROP CONSTRAINT IF EXISTS sa_process_chains_chain_code_key;

-- New unique: core chains are global (engagement_id IS NULL), custom chains are per-engagement
CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_process_chains_unique_code
  ON sa_process_chains (chain_code) WHERE engagement_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_process_chains_unique_per_engagement
  ON sa_process_chains (chain_code, engagement_id) WHERE engagement_id IS NOT NULL;

-- Index for fetching chains for an engagement
CREATE INDEX IF NOT EXISTS idx_sa_process_chains_engagement
  ON sa_process_chains (engagement_id) WHERE engagement_id IS NOT NULL;

-- Store AI chain suggestions on the engagement
ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS suggested_chains JSONB,
  ADD COLUMN IF NOT EXISTS chain_suggestions_generated_at TIMESTAMPTZ;

-- RLS: team can see/manage custom chains for their engagements
-- (Uses user_practice_ids(), user_client_ids(), is_practice_team() from 20260216_sa_rls_systematic_review.sql)
DROP POLICY IF EXISTS "sa_process_chains_core_select" ON sa_process_chains;
CREATE POLICY "sa_process_chains_core_select" ON sa_process_chains
  FOR SELECT USING (is_core = TRUE);

DROP POLICY IF EXISTS "sa_process_chains_custom_team_select" ON sa_process_chains;
CREATE POLICY "sa_process_chains_custom_team_select" ON sa_process_chains
  FOR SELECT USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

DROP POLICY IF EXISTS "sa_process_chains_custom_client_select" ON sa_process_chains;
CREATE POLICY "sa_process_chains_custom_client_select" ON sa_process_chains
  FOR SELECT USING (
    engagement_id IN (
      SELECT id FROM sa_engagements WHERE client_id IN (SELECT user_client_ids())
    )
    AND chain_status = 'active'
  );

DROP POLICY IF EXISTS "sa_process_chains_team_insert" ON sa_process_chains;
CREATE POLICY "sa_process_chains_team_insert" ON sa_process_chains
  FOR INSERT WITH CHECK (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );

DROP POLICY IF EXISTS "sa_process_chains_team_update" ON sa_process_chains;
CREATE POLICY "sa_process_chains_team_update" ON sa_process_chains
  FOR UPDATE USING (
    engagement_id IN (SELECT id FROM sa_engagements WHERE practice_id IN (SELECT user_practice_ids()))
    AND is_practice_team()
  );
