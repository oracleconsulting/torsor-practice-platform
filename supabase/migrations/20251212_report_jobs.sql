-- ============================================================================
-- REPORT JOBS TABLE - For async report generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id UUID REFERENCES practices(id),
    discovery_id UUID REFERENCES destination_discovery(id),
    job_type TEXT NOT NULL DEFAULT 'discovery_report',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0, -- 0-100
    progress_message TEXT,
    result JSONB, -- The completed report data
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_jobs_client ON report_jobs(client_id);
CREATE INDEX idx_report_jobs_status ON report_jobs(status);
CREATE INDEX idx_report_jobs_created ON report_jobs(created_at DESC);

-- RLS
ALTER TABLE report_jobs ENABLE ROW LEVEL SECURITY;

-- Team can view jobs for their practice clients
CREATE POLICY "Team can view jobs for their practice"
ON report_jobs FOR SELECT
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid() AND member_type = 'team'
    )
);

-- Service role can manage all jobs
CREATE POLICY "Service role can manage jobs"
ON report_jobs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER set_report_jobs_updated_at
    BEFORE UPDATE ON report_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE report_jobs IS 'Tracks async report generation jobs for polling';


