-- Find where VARK assessment data is stored
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%vark%'
    OR column_name LIKE '%learning%'
    OR column_name LIKE '%visual%'
    OR column_name LIKE '%auditory%'
    OR column_name LIKE '%kinesthetic%'
  )
ORDER BY table_name, column_name;

-- Also check learning_preferences table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'learning_preferences'
ORDER BY ordinal_position;

