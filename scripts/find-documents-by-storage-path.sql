-- Find documents that have wrong client_id based on storage path
-- The storage path contains the original client_id when uploaded

-- Step 1: Find all documents and extract client_id from storage path
SELECT 
  cc.id,
  cc.client_id as current_client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  -- Extract client_id from storage path (format: .../practice_id/client_id/filename)
  (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.pdf'))[1] as storage_path_client_id,
  pm1.email as current_client_email,
  pm1.user_id as current_user_id,
  pm2.email as storage_path_client_email,
  pm2.user_id as storage_path_user_id,
  CASE 
    WHEN (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.pdf'))[1] != cc.client_id::text 
      AND pm2.id IS NOT NULL
      AND pm2.id != cc.client_id
    THEN '⚠️ MISMATCH - Storage path shows different client'
    WHEN (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.pdf'))[1] = '1522309d-3516-4694-8a0a-69f24ab22d28'
    THEN '⚠️ UPLOADED WITH WRONG CLIENT_ID (1522309d-3516-4694-8a0a-69f24ab22d28)'
    ELSE 'OK'
  END as status
FROM client_context cc
LEFT JOIN practice_members pm1 ON cc.client_id = pm1.id
LEFT JOIN practice_members pm2 ON pm2.id::text = (regexp_match(cc.source_file_url, '/([a-f00-9-]{36})/[^/]+\.pdf'))[1]
WHERE cc.context_type = 'document'
  AND cc.source_file_url IS NOT NULL
ORDER BY cc.created_at DESC;

-- Step 2: Specifically find documents with the problematic client_id in storage path
SELECT 
  cc.id,
  cc.client_id as current_client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  pm1.email as current_client_email,
  pm2.email as storage_path_client_email,
  'These documents were uploaded with wrong client_id and need to be reassigned' as issue
FROM client_context cc
LEFT JOIN practice_members pm1 ON cc.client_id = pm1.id
LEFT JOIN practice_members pm2 ON pm2.id::text = '1522309d-3516-4694-8a0a-69f24ab22d28'
WHERE cc.context_type = 'document'
  AND cc.source_file_url LIKE '%1522309d-3516-4694-8a0a-69f24ab22d28%'
ORDER BY cc.created_at DESC;

-- Step 3: Find who the wrong client_id (1522309d-3516-4694-8a0a-69f24ab22d28) belongs to
SELECT 
  id,
  name,
  email,
  user_id,
  member_type,
  created_at
FROM practice_members
WHERE id = '1522309d-3516-4694-8a0a-69f24ab22d28'
   OR id::text = '1522309d-3516-4694-8a0a-69f24ab22d28';

-- Step 4: Check if this client_id exists in any other tables
SELECT 'destination_discovery' as table_name, COUNT(*) as count
FROM destination_discovery
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
UNION ALL
SELECT 'client_assessments', COUNT(*)
FROM client_assessments
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
UNION ALL
SELECT 'client_service_lines', COUNT(*)
FROM client_service_lines
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
UNION ALL
SELECT 'client_roadmaps', COUNT(*)
FROM client_roadmaps
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
UNION ALL
SELECT 'client_context', COUNT(*)
FROM client_context
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28';
