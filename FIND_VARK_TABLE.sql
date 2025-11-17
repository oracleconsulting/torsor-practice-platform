-- Find all tables with columns that might store VARK data
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%vark%'
    OR column_name LIKE '%learning%'
    OR column_name LIKE '%primary_style%'
    OR column_name LIKE '%visual%'
    OR column_name LIKE '%auditory%'
    OR column_name LIKE '%kinesthetic%'
  )
ORDER BY table_name, column_name;

-- Also check what columns exist in vark_questions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vark_questions'
ORDER BY ordinal_position;
