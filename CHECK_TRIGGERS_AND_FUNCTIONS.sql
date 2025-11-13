-- =====================================================
-- DIAGNOSTIC: Find ALL triggers and functions related to team_composition_insights
-- =====================================================

-- 1. Find ALL triggers on the table
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'team_composition_insights'::regclass;

-- 2. Find ALL functions that might be used by triggers
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%team_composition%'
   OR p.proname LIKE '%updated_at%'
   OR p.proname LIKE '%update_%'
ORDER BY p.proname;

-- 3. Check the actual columns in the table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'team_composition_insights'
ORDER BY ordinal_position;

-- 4. Check for any views or rules that might reference updated_at
SELECT 
  schemaname,
  tablename,
  viewname
FROM pg_views
WHERE viewname LIKE '%team_composition%';

