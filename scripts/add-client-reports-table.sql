-- ============================================================================
-- CLIENT REPORTS TABLE
-- ============================================================================
-- Stores generated analysis reports for clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
    discovery_id uuid,
    report_type text NOT NULL DEFAULT 'discovery_analysis',
    report_data jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    is_shared_with_client boolean DEFAULT false,
    shared_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_client_reports_client ON client_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_practice ON client_reports(practice_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_type ON client_reports(report_type);

-- RLS
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;

-- Team can view and create reports
CREATE POLICY "Team can manage reports" ON client_reports
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() AND member_type = 'team'
        )
    );

-- Clients can only see reports shared with them
CREATE POLICY "Clients see shared reports" ON client_reports
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
        AND is_shared_with_client = true
    );

-- Add analysis columns to destination_discovery if they don't exist
ALTER TABLE destination_discovery 
ADD COLUMN IF NOT EXISTS analysis_notes text,
ADD COLUMN IF NOT EXISTS analysis_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS analysis_report_id uuid;

-- Grant permissions
GRANT ALL ON client_reports TO authenticated;

