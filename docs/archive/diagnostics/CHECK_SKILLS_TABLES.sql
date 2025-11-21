-- Check what skill-related tables actually exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%skill%'
ORDER BY table_name;

-- Check skills table structure (if it exists)
SELECT 'skills' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'skills'
ORDER BY ordinal_position;

