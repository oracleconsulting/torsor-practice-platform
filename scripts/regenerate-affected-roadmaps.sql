-- Script to identify all roadmaps that need regeneration
-- These roadmaps were generated with wrong assessment data

-- Find all roadmaps that need regeneration
SELECT 
  cr.id as roadmap_id,
  cr.client_id,
  pm.email,
  pm.name,
  cr.created_at,
  cr.status,
  'NEEDS REGENERATION' as action_required
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
WHERE cr.is_active = true
  AND (cr.roadmap_data::text ILIKE '%fitness equipment%' 
    OR cr.roadmap_data::text ILIKE '%rowing%' 
    OR cr.roadmap_data::text ILIKE '%rowgear%')
  AND pm.email NOT ILIKE '%rowgear%'
  AND pm.email NOT ILIKE '%fitness%'
  AND pm.name NOT ILIKE '%tom%'
ORDER BY cr.created_at DESC;

-- Summary count
SELECT 
  COUNT(*) as total_roadmaps_needing_regeneration,
  STRING_AGG(pm.email, ', ') as affected_clients
FROM client_roadmaps cr
JOIN practice_members pm ON cr.client_id = pm.id
WHERE cr.is_active = true
  AND (cr.roadmap_data::text ILIKE '%fitness equipment%' 
    OR cr.roadmap_data::text ILIKE '%rowing%' 
    OR cr.roadmap_data::text ILIKE '%rowgear%')
  AND pm.email NOT ILIKE '%rowgear%'
  AND pm.email NOT ILIKE '%fitness%'
  AND pm.name NOT ILIKE '%tom%';

-- ============================================================
-- OPTION: Mark roadmaps for regeneration by updating status
-- ============================================================
-- This sets status to 'pending_review' so they're flagged for regeneration
-- Uncomment to run:

/*
BEGIN;

UPDATE client_roadmaps cr
SET status = 'pending_review'
FROM practice_members pm
WHERE cr.client_id = pm.id
  AND cr.is_active = true
  AND (cr.roadmap_data::text ILIKE '%fitness equipment%' 
    OR cr.roadmap_data::text ILIKE '%rowing%' 
    OR cr.roadmap_data::text ILIKE '%rowgear%')
  AND pm.email NOT ILIKE '%rowgear%'
  AND pm.email NOT ILIKE '%fitness%'
  AND pm.name NOT ILIKE '%tom%';

COMMIT;
*/
