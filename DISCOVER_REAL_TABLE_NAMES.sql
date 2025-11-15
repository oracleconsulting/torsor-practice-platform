-- =====================================================
-- DISCOVER WHAT ASSESSMENT TABLES ACTUALLY EXIST
-- =====================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%assessment%'
ORDER BY table_name;

-- Also check for other related tables
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%belbin%'
    OR table_name LIKE '%ocean%'
    OR table_name LIKE '%personality%'
    OR table_name LIKE '%working%'
    OR table_name LIKE '%vark%'
    OR table_name LIKE '%eq%'
    OR table_name LIKE '%motivational%'
    OR table_name LIKE '%conflict%'
  )
ORDER BY table_name;

