-- ============================================================================
-- FIX: Allow practice members (admins) to view Systems Audit engagements
-- ============================================================================
-- 
-- The existing RLS policy only allows:
-- 1. practice_id = current_setting('app.practice_id') (requires session variable)
-- 2. client_id matches auth.uid() (only works for clients)
-- 
-- This doesn't work for practice members viewing client data. We need to add:
-- 3. practice_id matches the practice member's practice_id
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own practice engagements" ON sa_engagements;

CREATE POLICY "Users can view own practice engagements" ON sa_engagements
    FOR SELECT USING (
        -- Option 1: Practice members - check if engagement's practice_id matches user's practice
        practice_id IN (
            SELECT practice_id 
            FROM practice_members 
            WHERE user_id = auth.uid()
        )
        OR
        -- Option 2: Session variable (for backward compatibility)
        practice_id = current_setting('app.practice_id', true)::UUID
        OR
        -- Option 3: Clients - check if client_id matches practice_members.id where user_id = auth.uid()
        client_id IN (
            SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
    );

-- Also update related tables to allow practice members to view client data

-- sa_discovery_responses
DROP POLICY IF EXISTS "Users can view own practice discovery responses" ON sa_discovery_responses;
CREATE POLICY "Users can view own practice discovery responses" ON sa_discovery_responses
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
            )
            OR practice_id = current_setting('app.practice_id', true)::UUID
            OR client_id IN (
                SELECT id FROM practice_members WHERE user_id = auth.uid()
            )
        )
    );

-- sa_system_inventory
DROP POLICY IF EXISTS "Users can view own practice system inventory" ON sa_system_inventory;
CREATE POLICY "Users can view own practice system inventory" ON sa_system_inventory
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
            )
            OR practice_id = current_setting('app.practice_id', true)::UUID
            OR client_id IN (
                SELECT id FROM practice_members WHERE user_id = auth.uid()
            )
        )
    );

-- sa_process_deep_dives
DROP POLICY IF EXISTS "Users can view own practice deep dives" ON sa_process_deep_dives;
CREATE POLICY "Users can view own practice deep dives" ON sa_process_deep_dives
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
            )
            OR practice_id = current_setting('app.practice_id', true)::UUID
            OR client_id IN (
                SELECT id FROM practice_members WHERE user_id = auth.uid()
            )
        )
    );

-- sa_audit_reports
DROP POLICY IF EXISTS "Users can view own practice audit reports" ON sa_audit_reports;
CREATE POLICY "Users can view own practice audit reports" ON sa_audit_reports
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements
            WHERE practice_id IN (
                SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
            )
            OR practice_id = current_setting('app.practice_id', true)::UUID
            OR client_id IN (
                SELECT id FROM practice_members WHERE user_id = auth.uid()
            )
        )
    );

