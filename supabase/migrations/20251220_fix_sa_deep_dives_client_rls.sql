-- ============================================================================
-- FIX: Add RLS policies to allow clients to access their own Process Deep Dives
-- ============================================================================
-- 
-- The existing RLS policies only check practice_id from session settings,
-- which works for practice members but not for clients. This migration updates
-- policies to allow clients to view, insert, and update their own deep dives.
-- ============================================================================

-- Drop existing SELECT policy and recreate with OR condition for clients
DROP POLICY IF EXISTS "Users can view own practice deep dives" ON sa_process_deep_dives;

CREATE POLICY "Users can view own practice deep dives" ON sa_process_deep_dives
    FOR SELECT USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                -- Practice members: check practice_id from session
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop existing INSERT policy and recreate with OR condition for clients
DROP POLICY IF EXISTS "Users can insert own practice deep dives" ON sa_process_deep_dives;

CREATE POLICY "Users can insert own practice deep dives" ON sa_process_deep_dives
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                -- Practice members: check practice_id from session
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Add UPDATE policy (may not exist yet)
DROP POLICY IF EXISTS "Users can update own practice deep dives" ON sa_process_deep_dives;

CREATE POLICY "Users can update own practice deep dives" ON sa_process_deep_dives
    FOR UPDATE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                -- Practice members: check practice_id from session
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Add DELETE policy (for completeness, though may not be needed)
DROP POLICY IF EXISTS "Users can delete own practice deep dives" ON sa_process_deep_dives;

CREATE POLICY "Users can delete own practice deep dives" ON sa_process_deep_dives
    FOR DELETE USING (
        engagement_id IN (
            SELECT id FROM sa_engagements 
            WHERE (
                -- Practice members: check practice_id from session
                practice_id = current_setting('app.practice_id', true)::UUID
                OR
                -- Clients: check client_id matches practice_members.id where user_id = auth.uid()
                client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

