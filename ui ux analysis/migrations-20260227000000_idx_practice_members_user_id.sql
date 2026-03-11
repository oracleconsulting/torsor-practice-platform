-- Index on practice_members.user_id for fast lookups by auth user (client portal session load).
-- Reduces 25s timeout risk when multiple auth events trigger practice_members queries.
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members (user_id);
