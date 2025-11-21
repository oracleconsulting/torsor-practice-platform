-- Check motivational drivers structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'motivational_drivers'
ORDER BY ordinal_position;

