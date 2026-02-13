-- =============================================================================
-- Add Goal Alignment team members to Discovery Assessment service line
-- Run in Supabase SQL Editor.
-- Practice: 8624cd8c-b4c2-4fc3-85b8-e559d14b0568
-- Use case: Allow team members already on Goal Alignment (365_method) to be
--           assigned to Discovery so they can be assigned to further services.
-- =============================================================================

-- 1. Ensure Discovery has at least one service role (for team member assignments)
INSERT INTO service_roles (
  service_line_code, code, name, description,
  is_lead, min_hours_per_client, max_hours_per_client,
  required_skill_level, is_required, display_order
) VALUES (
  'discovery', 'discovery_facilitator', 'Discovery Facilitator',
  'Runs discovery assessments and assigns follow-on services',
  true, 2, 6, 'intermediate', true, 1
)
ON CONFLICT (service_line_code, code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- 2. Ensure a Discovery delivery team exists for the practice
INSERT INTO delivery_teams (practice_id, service_line_code, name, status, max_clients)
SELECT
  '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'::uuid,
  'discovery',
  'Discovery Assessment',
  'active',
  50
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_teams
  WHERE practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
    AND service_line_code = 'discovery'
);

-- 3. Add every team member who is on a Goal Alignment (365_method) team
--    to the Discovery team (same practice), if not already assigned.
INSERT INTO team_member_assignments (
  team_id,
  member_id,
  service_role_id,
  role_name,
  is_team_lead,
  allocated_hours_per_week,
  status
)
SELECT
  dt_discovery.id AS team_id,
  tma_ga.member_id,
  sr.id AS service_role_id,
  sr.name AS role_name,
  false AS is_team_lead,
  8 AS allocated_hours_per_week,
  'active' AS status
FROM delivery_teams dt_ga
JOIN team_member_assignments tma_ga ON tma_ga.team_id = dt_ga.id AND tma_ga.status = 'active'
JOIN delivery_teams dt_discovery ON dt_discovery.practice_id = dt_ga.practice_id
  AND dt_discovery.service_line_code = 'discovery'
  AND dt_discovery.status = 'active'
CROSS JOIN LATERAL (
  SELECT id, name FROM service_roles
  WHERE service_line_code = 'discovery'
  ORDER BY display_order
  LIMIT 1
) sr
WHERE dt_ga.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
  AND dt_ga.service_line_code = '365_method'
  AND dt_ga.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM team_member_assignments tma2
    WHERE tma2.team_id = dt_discovery.id
      AND tma2.member_id = tma_ga.member_id
      AND tma2.status = 'active'
  )
ON CONFLICT (team_id, member_id) DO NOTHING;

-- Optional: list who was added (run after the insert to verify)
-- SELECT pm.name, pm.email
-- FROM team_member_assignments tma
-- JOIN delivery_teams dt ON dt.id = tma.team_id
-- JOIN practice_members pm ON pm.id = tma.member_id
-- WHERE dt.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
--   AND dt.service_line_code = 'discovery'
--   AND tma.status = 'active';
