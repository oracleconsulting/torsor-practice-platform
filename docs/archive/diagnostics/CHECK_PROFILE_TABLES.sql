-- Check what profile/insight tables actually exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%profile%'
    OR table_name LIKE '%insight%'
    OR table_name LIKE '%assessment%'
  )
ORDER BY table_name;

