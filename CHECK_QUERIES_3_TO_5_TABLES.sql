-- Check for service_line_interests table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_line_interests'
ORDER BY ordinal_position;

-- Check for service_lines table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_lines'
ORDER BY ordinal_position;

-- Check for role_assignments table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'role_assignments'
ORDER BY ordinal_position;

-- Check for mentoring tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%mentor%'
ORDER BY table_name;

-- Check for reporting_lines table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reporting_lines'
ORDER BY ordinal_position;

