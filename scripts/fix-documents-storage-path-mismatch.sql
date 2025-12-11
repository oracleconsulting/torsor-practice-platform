-- Fix documents that have wrong client_id in storage path
-- These documents were uploaded with wrong client_id and need to be reassigned

-- Step 1: Find documents with storage path containing wrong client_id
SELECT 
  cc.id,
  cc.client_id as current_client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] as storage_path_client_id,
  pm1.email as current_client_email,
  pm2.email as storage_path_client_email,
  pm2.id as correct_client_id_from_storage,
  CASE 
    WHEN (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] != cc.client_id::text
      AND pm2.id IS NOT NULL
    THEN '⚠️ NEEDS FIX - Storage path shows different client'
    ELSE 'OK'
  END as status
FROM client_context cc
LEFT JOIN practice_members pm1 ON cc.client_id = pm1.id
LEFT JOIN practice_members pm2 ON pm2.id::text = (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1]
WHERE cc.context_type = 'document'
  AND cc.source_file_url IS NOT NULL
  AND (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] != cc.client_id::text
ORDER BY cc.created_at DESC;

-- Step 2: Specifically find documents with the problematic client_id (1522309d-3516-4694-8a0a-69f24ab22d28) in storage path
SELECT 
  cc.id,
  cc.client_id as current_client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  pm1.email as current_client_email,
  pm1.user_id as current_user_id,
  pm2.email as storage_path_client_email,
  pm2.user_id as storage_path_user_id,
  pm2.id as correct_client_id,
  'These documents were uploaded with wrong client_id and need to be reassigned' as issue
FROM client_context cc
LEFT JOIN practice_members pm1 ON cc.client_id = pm1.id
LEFT JOIN practice_members pm2 ON pm2.id::text = '1522309d-3516-4694-8a0a-69f24ab22d28'
WHERE cc.context_type = 'document'
  AND cc.source_file_url LIKE '%1522309d-3516-4694-8a0a-69f24ab22d28%'
ORDER BY cc.created_at DESC;

-- ============================================================
-- FIX: Reassign documents to correct client based on storage path
-- ============================================================
-- WARNING: Review the results above before running this fix
-- This will update documents to use the client_id from their storage path

BEGIN;

DO $$
DECLARE
  doc_record RECORD;
  correct_client_id UUID;
  storage_path_client_id TEXT;
BEGIN
  -- Find all documents where storage path client_id doesn't match database client_id
  FOR doc_record IN 
    SELECT 
      cc.id,
      cc.client_id as current_client_id,
      cc.source_file_url,
      (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] as storage_client_id
    FROM client_context cc
    WHERE cc.context_type = 'document'
      AND cc.source_file_url IS NOT NULL
      AND (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] IS NOT NULL
      AND (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] != cc.client_id::text
  LOOP
    storage_path_client_id := doc_record.storage_client_id;
    
    -- Check if the storage path client_id exists in practice_members
    SELECT id INTO correct_client_id
    FROM practice_members
    WHERE id::text = storage_path_client_id
      AND member_type = 'client'
    LIMIT 1;
    
    IF correct_client_id IS NOT NULL THEN
      RAISE NOTICE 'Updating document % from client_id % to % (from storage path)', 
        doc_record.id, doc_record.current_client_id, correct_client_id;
      
      UPDATE client_context
      SET client_id = correct_client_id
      WHERE id = doc_record.id;
    ELSE
      RAISE WARNING 'Storage path client_id % does not exist in practice_members for document %', 
        storage_path_client_id, doc_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Document reassignment completed';
END $$;

COMMIT;

-- Verify the fix
SELECT 
  'Verification' as check_type,
  cc.id,
  cc.client_id,
  (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] as storage_path_client_id,
  pm.email,
  CASE 
    WHEN (regexp_match(cc.source_file_url, '/([a-f0-9-]{36})/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)'))[1] = cc.client_id::text 
    THEN '✅ Fixed'
    ELSE '⚠️ Still mismatched'
  END as status
FROM client_context cc
JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.context_type = 'document'
  AND cc.source_file_url IS NOT NULL
ORDER BY cc.created_at DESC;
