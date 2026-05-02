-- Track whether a client has seen the Goal Alignment first-time tutorial.
-- Server-side flag (rather than localStorage) so admin can reset it via SQL
-- when re-running a client's onboarding, and the tutorial follows the client
-- across browsers/devices/incognito sessions.

ALTER TABLE client_service_lines
  ADD COLUMN IF NOT EXISTS ga_tutorial_seen_at TIMESTAMPTZ;
