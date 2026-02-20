-- Add tier tracking to client_service_lines (idempotent; columns may exist from 20260213220000)
ALTER TABLE client_service_lines
  ADD COLUMN IF NOT EXISTS tier_name TEXT,
  ADD COLUMN IF NOT EXISTS current_sprint_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_sprints INTEGER DEFAULT 1;

COMMENT ON COLUMN client_service_lines.tier_name IS 'GA tier: Lite, Growth, or Partner';
COMMENT ON COLUMN client_service_lines.max_sprints IS 'Sprints per year: Lite=1, Growth=4, Partner=4';

-- Backfill: set 365_method enrollments without a tier to Partner (advisor can change via UI)
UPDATE client_service_lines csl
SET tier_name = 'Partner', max_sprints = 4
FROM service_lines sl
WHERE csl.service_line_id = sl.id
  AND sl.code = '365_method'
  AND csl.tier_name IS NULL;
