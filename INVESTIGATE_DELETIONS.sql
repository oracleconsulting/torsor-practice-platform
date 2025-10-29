-- ==============================================================
-- INVESTIGATE: What's deleting skill_assessments?
-- ==============================================================

-- 1. Check for triggers on skill_assessments
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'skill_assessments'
ORDER BY trigger_name;

-- 2. Check for foreign key cascades that might delete
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'skill_assessments';

-- 3. Check RLS policies
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'skill_assessments'
ORDER BY policyname;

-- 4. Check if there are any scheduled functions/cron jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE command LIKE '%skill_assessments%'
  OR command LIKE '%DELETE%';

-- 5. Sample the assessments to see if they're actually there
SELECT 
  COUNT(*) as total_assessments,
  COUNT(DISTINCT team_member_id) as unique_members,
  MIN(assessed_at) as oldest_assessment,
  MAX(assessed_at) as newest_assessment
FROM skill_assessments;

