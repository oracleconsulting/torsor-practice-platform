-- Allow practice to hide the Discovery assessment in the client portal for specific clients
-- (e.g. when auto-onboarding to a specific service line and Discovery is not part of their journey).
ALTER TABLE practice_members
  ADD COLUMN IF NOT EXISTS hide_discovery_in_portal BOOLEAN DEFAULT false;

COMMENT ON COLUMN practice_members.hide_discovery_in_portal IS
  'When true, the Discovery assessment card is hidden on the client dashboard. Use for clients onboarded directly to a specific service (e.g. Systems Audit) without Discovery.';

CREATE INDEX IF NOT EXISTS idx_practice_members_hide_discovery
  ON practice_members(hide_discovery_in_portal) WHERE member_type = 'client';
