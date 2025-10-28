-- ==============================================================
-- QUICK DIAGNOSTIC: What advisory services data exists?
-- ==============================================================
-- Run this first to see what's in your database

-- 1. Check if you have any service_skill_assignments
SELECT 
  'Total service skill assignments' as info,
  COUNT(*) as count
FROM service_skill_assignments;

-- 2. Check what services are defined
SELECT 
  'Unique services' as info,
  COUNT(DISTINCT service_id) as service_count,
  STRING_AGG(DISTINCT service_id, ', ') as service_ids
FROM service_skill_assignments;

-- 3. Check your practice_id
SELECT 
  'Your practice' as info,
  id as practice_id,
  name as practice_name
FROM practices
WHERE name = 'RPGCC';

-- 4. Sample of what's in service_skill_assignments
SELECT 
  service_id,
  COUNT(*) as skills_assigned,
  STRING_AGG(DISTINCT (SELECT name FROM skills WHERE id = skill_id), ', ') as skill_names
FROM service_skill_assignments
WHERE practice_id IN (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY service_id
LIMIT 10;

