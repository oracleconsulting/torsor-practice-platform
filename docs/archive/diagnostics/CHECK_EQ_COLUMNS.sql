-- Check EQ assessments structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'eq_assessments'
ORDER BY ordinal_position;

