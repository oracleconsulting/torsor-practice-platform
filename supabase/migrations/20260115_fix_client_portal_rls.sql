-- ============================================================================
-- Fix Client Portal RLS - Comprehensive
-- ============================================================================
-- Ensures clients can see their:
-- 1. Service enrollments (client_service_lines)
-- 2. Discovery assessment (destination_discovery)
-- 3. Service line metadata (service_lines)
-- ============================================================================

-- ============================================================================
-- 1. CLIENT_SERVICE_LINES - Client's enrolled services
-- ============================================================================
ALTER TABLE client_service_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own enrollments" ON client_service_lines;
DROP POLICY IF EXISTS "Team members can manage enrollments" ON client_service_lines;
DROP POLICY IF EXISTS "Service role full access csl" ON client_service_lines;

-- Clients can see their own service enrollments
CREATE POLICY "Clients can view own enrollments" ON client_service_lines
    FOR SELECT USING (
        -- Client's practice_members.user_id = auth.uid()
        -- Their enrollment has client_id = practice_members.id
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = client_service_lines.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Team members can manage all enrollments in their practice
CREATE POLICY "Team members can manage enrollments" ON client_service_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN practice_members client_pm ON client_pm.id = client_service_lines.client_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = client_pm.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

-- Service role full access
CREATE POLICY "Service role full access csl" ON client_service_lines
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. SERVICE_LINES - Service metadata (codes, names, descriptions)
-- ============================================================================
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read service lines" ON service_lines;
DROP POLICY IF EXISTS "Service role can manage service lines" ON service_lines;

-- Everyone can read service line metadata (it's not sensitive)
CREATE POLICY "Anyone can read service lines" ON service_lines
    FOR SELECT USING (true);

-- Only service role can modify
CREATE POLICY "Service role can manage service lines" ON service_lines
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. DESTINATION_DISCOVERY - Client's discovery assessment
-- ============================================================================
ALTER TABLE destination_discovery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own discovery" ON destination_discovery;
DROP POLICY IF EXISTS "Clients can update own discovery" ON destination_discovery;
DROP POLICY IF EXISTS "Clients can insert own discovery" ON destination_discovery;
DROP POLICY IF EXISTS "Team members can view all discoveries" ON destination_discovery;
DROP POLICY IF EXISTS "Team members can manage discoveries" ON destination_discovery;
DROP POLICY IF EXISTS "Service role full access" ON destination_discovery;
DROP POLICY IF EXISTS "Service role full access dd" ON destination_discovery;

-- Clients can view their own discovery records
CREATE POLICY "Clients can view own discovery" ON destination_discovery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Clients can update their own discovery records (for responses)
CREATE POLICY "Clients can update own discovery" ON destination_discovery
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Clients can insert their own discovery records
CREATE POLICY "Clients can insert own discovery" ON destination_discovery
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = destination_discovery.client_id
            AND pm.user_id = auth.uid()
        )
    );

-- Team members can view all discoveries in their practice
CREATE POLICY "Team members can view all discoveries" ON destination_discovery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = destination_discovery.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

-- Team members can manage discoveries in their practice
CREATE POLICY "Team members can manage discoveries" ON destination_discovery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = destination_discovery.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

-- Service role full access
CREATE POLICY "Service role full access dd" ON destination_discovery
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. PRACTICE_MEMBERS - Client profile data
-- ============================================================================
-- This should already have policies, but ensure clients can see their own record

DROP POLICY IF EXISTS "Users can view own practice member" ON practice_members;

CREATE POLICY "Users can view own practice member" ON practice_members
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY "Clients can view own enrollments" ON client_service_lines IS 
'Allows clients to see which services they are enrolled in';

COMMENT ON POLICY "Clients can view own discovery" ON destination_discovery IS 
'Allows clients to see their discovery assessment progress and responses';

COMMENT ON POLICY "Anyone can read service lines" ON service_lines IS 
'Service line metadata (names, codes, descriptions) is public within the app';

