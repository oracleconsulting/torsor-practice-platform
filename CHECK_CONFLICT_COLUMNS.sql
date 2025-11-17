-- Check conflict style assessments structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conflict_style_assessments'
ORDER BY ordinal_position;

