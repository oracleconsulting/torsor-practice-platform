-- =============================================================================
-- Add existing Goal Alignment clients to Discovery Assessment
-- Run in Supabase SQL Editor.
-- Clients: Tom Clark (tom@rowgear.com), Zaneta Clark (zaneta@zlsalon.co.uk)
-- Practice: 8624cd8c-b4c2-4fc3-85b8-e559d14b0568
-- =============================================================================
-- After running, they will appear in Client Services → Discovery so you can
-- assign other service lines to them.
-- =============================================================================

-- 1. Add destination_discovery so they appear in the Discovery list
INSERT INTO destination_discovery (client_id, practice_id)
SELECT pm.id, pm.practice_id
FROM practice_members pm
WHERE pm.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
  AND pm.member_type = 'client'
  AND LOWER(pm.email) IN ('tom@rowgear.com', 'zaneta@zlsalon.co.uk')
  AND NOT EXISTS (
    SELECT 1 FROM destination_discovery dd WHERE dd.client_id = pm.id
  );

-- 2. Enroll them in the Discovery service line (so they're "in" discovery)
INSERT INTO client_service_lines (client_id, service_line_id, practice_id, status)
SELECT pm.id, sl.id, pm.practice_id, 'active'
FROM practice_members pm
CROSS JOIN (SELECT id FROM service_lines WHERE code = 'discovery' LIMIT 1) sl
WHERE pm.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
  AND pm.member_type = 'client'
  AND LOWER(pm.email) IN ('tom@rowgear.com', 'zaneta@zlsalon.co.uk')
  AND NOT EXISTS (
    SELECT 1 FROM client_service_lines csl
    WHERE csl.client_id = pm.id AND csl.service_line_id = sl.id
  );
