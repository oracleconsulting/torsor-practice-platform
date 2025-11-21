-- Check column names in all assessment tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'personality_assessments',
    'belbin_assessments',
    'eq_assessments',
    'learning_preferences',
    'working_preferences',
    'conflict_style_assessments',
    'motivational_drivers'
  )
  AND column_name LIKE '%member%'
ORDER BY table_name, column_name;

