-- ============================================================================
-- Fix destination_discovery RLS for Client Portal Access
-- ============================================================================
-- Ensures clients can see their own discovery records when logged in
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE destination_discovery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Clients can view own discovery" ON destination_discovery;
DROP POLICY IF EXISTS "Clients can update own discovery" ON destination_discovery;
DROP POLICY IF EXISTS "Team members can view all discoveries" ON destination_discovery;
DROP POLICY IF EXISTS "Service role full access" ON destination_discovery;

-- Policy 1: Clients can view their own discovery records
-- A client's practice_members.user_id = auth.uid()
-- Their discovery record has client_id = practice_members.id
CREATE POLICY "Clients can view own discovery" ON destination_discovery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy 2: Clients can update their own discovery records (for assessment responses)
CREATE POLICY "Clients can update own discovery" ON destination_discovery
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy 3: Clients can insert their own discovery records (if they start fresh)
CREATE POLICY "Clients can insert own discovery" ON destination_discovery
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy 4: Team members (admin, staff, consultants) can view all discoveries in their practice
CREATE POLICY "Team members can view all discoveries" ON destination_discovery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = destination_discovery.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

-- Policy 5: Team members can manage discoveries in their practice
CREATE POLICY "Team members can manage discoveries" ON destination_discovery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = destination_discovery.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

-- Policy 6: Service role has full access (for edge functions)
CREATE POLICY "Service role full access" ON destination_discovery
    FOR ALL USING (
        auth.role() = 'service_role'
    );

COMMENT ON POLICY "Clients can view own discovery" ON destination_discovery IS 
'Allows clients to view their own discovery assessment records via practice_members.user_id linkage';

COMMENT ON POLICY "Team members can view all discoveries" ON destination_discovery IS 
'Allows team members (admin/staff/consultants) to view all discoveries within their practice';

