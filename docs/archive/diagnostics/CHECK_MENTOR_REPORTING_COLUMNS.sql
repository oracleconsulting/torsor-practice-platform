-- Check mentoring_relationships columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'mentoring_relationships'
ORDER BY ordinal_position;

-- Check reporting_lines columns  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reporting_lines'
ORDER BY ordinal_position;


