-- ==============================================================
-- QUICK FIX: Map your current 6 service-IDs to new service names
-- Then run a corrected full population script
-- ==============================================================

-- First, let's see what service_ids currently exist
SELECT DISTINCT service_id FROM service_skill_assignments;

-- If you need to create the new Fractional services in the Advisory Services UI first,
-- use these service_ids:
-- 'fractional-cfo'
-- 'fractional-coo'
-- 'combined-cfo-coo'

-- For now, run this comprehensive diagnostic to help me build the correct script:
SELECT 
  category,
  STRING_AGG(name, ''', ''') as skill_names
FROM skills
GROUP BY category
ORDER BY category;

