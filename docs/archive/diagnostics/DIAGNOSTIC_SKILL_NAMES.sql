-- ==============================================================
-- DIAGNOSTIC: Check which skills exist in your database
-- Run this FIRST to see what skill names are actually available
-- ==============================================================

-- 1. Total skills in database
SELECT 
  'Total Skills in Database' as info,
  COUNT(*) as count
FROM skills;

-- 2. Skills by category
SELECT 
  category,
  COUNT(*) as skill_count
FROM skills
GROUP BY category
ORDER BY category;

-- 3. All skill names (alphabetically)
SELECT 
  category,
  name as skill_name
FROM skills
ORDER BY category, name;

-- 4. Check specific skills we're trying to assign
SELECT 
  'Skills We Need' as type,
  unnest(ARRAY[
    'Xero',
    'QuickBooks',
    'Sage',
    'Cloud Accounting',
    'Process Automation',
    'API Integration',
    'Excel (Intermediate)',
    'Excel (Advanced)',
    'Management Accounting',
    'Financial Reporting',
    'KPI Analysis',
    'Business Planning & Budgeting',
    'Strategic Thinking',
    'Commercial Acumen'
  ]) as skill_name_we_need
EXCEPT
SELECT 
  'Skills We Have' as type,
  name
FROM skills;

-- 5. Show what WAS successfully inserted
SELECT 
  s.category,
  s.name as skill_name,
  COUNT(DISTINCT ssa.service_id) as assigned_to_services
FROM skills s
JOIN service_skill_assignments ssa ON s.id = ssa.skill_id
WHERE ssa.practice_id IN (SELECT id FROM practices WHERE name = 'RPGCC')
GROUP BY s.id, s.category, s.name
ORDER BY s.category, s.name;

