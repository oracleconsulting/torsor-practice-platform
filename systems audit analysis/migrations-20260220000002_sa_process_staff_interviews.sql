-- ============================================================================
-- New process chain: Project-to-Delivery
-- ============================================================================

INSERT INTO sa_process_chains (chain_code, chain_name, description, trigger_areas, process_steps, estimated_duration_mins, display_order) VALUES
('project_to_delivery', 'Project-to-Delivery (Operations)', 'From signed deal to completed work',
    ARRAY['project_management', 'resource_planning', 'client_delivery', 'scope_management'],
    ARRAY['Deal Signed', 'Project Setup', 'Brief Handoff', 'Resource Assigned', 'Work In Progress', 'Milestones Tracked', 'Budget Monitored', 'Scope Managed', 'Deliverable Reviewed', 'Project Closed', 'Retrospective'],
    15, 7)
ON CONFLICT (chain_code) DO NOTHING;

-- ============================================================================
-- SA Staff Interviews (Stage 3b)
-- Optional staff-level questionnaires capturing ground-level system frustrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_staff_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,

    -- Identity (nullable for anonymous mode)
    staff_name TEXT,
    role_title TEXT NOT NULL,
    department TEXT,
    tenure TEXT,
    anonymous BOOLEAN NOT NULL DEFAULT false,

    -- Responses stored as JSONB (same pattern as assessment responses)
    responses JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'complete')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_staff_interviews_engagement ON sa_staff_interviews(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sa_staff_interviews_status ON sa_staff_interviews(status);

ALTER TABLE sa_staff_interviews ENABLE ROW LEVEL SECURITY;

-- Practice members view
CREATE POLICY "Practice members can view staff interviews" ON sa_staff_interviews
    FOR SELECT USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Client view (engagement client_id = their practice_members.id)
CREATE POLICY "Client members can view own company staff interviews" ON sa_staff_interviews
    FOR SELECT USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.id = e.client_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Anyone with a valid interview ID can update their own (for the interview form itself)
CREATE POLICY "Staff can update own interview" ON sa_staff_interviews
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Anyone can insert staff interview (when creating from a shared link)
CREATE POLICY "Anyone can insert staff interview" ON sa_staff_interviews
    FOR INSERT WITH CHECK (true);

-- Also add interview tracking columns to sa_engagements
ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS staff_interviews_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS staff_interviews_anonymous BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN sa_engagements.staff_interviews_enabled IS
    'Whether staff interviews are enabled for this engagement';

COMMENT ON COLUMN sa_engagements.staff_interviews_anonymous IS
    'Whether staff interview responses are anonymous (names hidden from report)';

-- Allow anon to read only engagements where staff interviews are enabled (for shared link validation)
CREATE POLICY "Anon can read engagement when staff interviews enabled" ON sa_engagements
    FOR SELECT USING (staff_interviews_enabled = true);
