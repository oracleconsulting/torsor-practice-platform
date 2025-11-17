-- Check for service line related tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%service%' OR table_name LIKE '%role%' OR table_name LIKE '%mentor%' OR table_name LIKE '%reporting%')
ORDER BY table_name;

-- Check columns for service_line_interests if it exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_line_interests'
ORDER BY ordinal_position;

-- Check columns for role_definitions if it exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'role_definitions'
ORDER BY ordinal_position;

-- Check columns for role_assignments if it exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'role_assignments'
ORDER BY ordinal_position;

