-- ============================================================================
-- FIX: Add RLS policies to allow clients to view their own Systems Audit engagements
-- ============================================================================
-- 
-- The existing RLS policies only check practice_id from session settings,
-- which works for practice members but not for clients. This migration adds
-- policies that allow clients to view and update their own engagements.
-- ============================================================================

-- Drop existing SELECT policy and recreate with OR condition for clients
DROP POLICY IF EXISTS "Users can view own practice engagements" ON sa_engagements;

CREATE POLICY "Users can view own practice engagements" ON sa_engagements
    FOR SELECT USING (
        -- Practice members: check practice_id from session
        practice_id = current_setting('app.practice_id', true)::UUID
        OR
        -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
        client_id IN (
            SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
    );

-- Drop existing INSERT policy and recreate with OR condition for clients
DROP POLICY IF EXISTS "Users can insert own practice engagements" ON sa_engagements;

CREATE POLICY "Users can insert own practice engagements" ON sa_engagements
    FOR INSERT WITH CHECK (
        -- Practice members: check practice_id from session
        practice_id = current_setting('app.practice_id', true)::UUID
        OR
        -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
        client_id IN (
            SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
    );

-- Drop existing UPDATE policy and recreate with OR condition for clients
DROP POLICY IF EXISTS "Users can update own practice engagements" ON sa_engagements;

CREATE POLICY "Users can update own practice engagements" ON sa_engagements
    FOR UPDATE USING (
        -- Practice members: check practice_id from session
        practice_id = current_setting('app.practice_id', true)::UUID
        OR
        -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
        client_id IN (
            SELECT id FROM practice_members WHERE user_id = auth.uid()
        )
    );

-- Also update discovery responses policies to allow clients to view their own
DROP POLICY IF EXISTS "Users can view own practice discovery" ON sa_discovery_responses;

CREATE POLICY "Users can view own practice discovery" ON sa_discovery_responses
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Allow clients to insert/update their own discovery responses
DROP POLICY IF EXISTS "Users can insert own practice discovery" ON sa_discovery_responses;

CREATE POLICY "Users can insert own practice discovery" ON sa_discovery_responses
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can update own practice discovery" ON sa_discovery_responses;

CREATE POLICY "Users can update own practice discovery" ON sa_discovery_responses
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Update system inventory policies to allow clients to view their own
DROP POLICY IF EXISTS "Users can view own practice inventory" ON sa_system_inventory;

CREATE POLICY "Users can view own practice inventory" ON sa_system_inventory
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert own practice inventory" ON sa_system_inventory;

CREATE POLICY "Users can insert own practice inventory" ON sa_system_inventory
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can update own practice inventory" ON sa_system_inventory;

CREATE POLICY "Users can update own practice inventory" ON sa_system_inventory
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete own practice inventory" ON sa_system_inventory;

CREATE POLICY "Users can delete own practice inventory" ON sa_system_inventory
    FOR DELETE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

