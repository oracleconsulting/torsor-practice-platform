-- Script to find and fix documents (client_context) with wrong client_id
-- This identifies documents that may have been uploaded with incorrect client_id

-- Step 1: Find all documents and verify they belong to the correct client
SELECT 
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  pm.email as client_email,
  pm.user_id,
  pm.id as practice_member_id,
  CASE 
    WHEN cc.client_id != pm.id THEN '⚠️ MISMATCH'
    ELSE 'OK'
  END as status
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.context_type = 'document'
ORDER BY cc.created_at DESC;

-- Step 2: Find documents where client_id doesn't match any practice_members
SELECT 
  cc.id,
  cc.client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  'ORPHANED - client_id does not exist' as issue
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.context_type = 'document'
  AND pm.id IS NULL;

-- Step 3: Find documents that might belong to a different client (by email matching in content)
-- This is a heuristic check - documents might mention client names/emails
SELECT 
  cc.id,
  cc.client_id,
  cc.content,
  cc.source_file_url,
  pm1.email as current_client_email,
  pm2.email as possible_correct_client_email,
  pm2.id as possible_correct_client_id
FROM client_context cc
JOIN practice_members pm1 ON cc.client_id = pm1.id
LEFT JOIN practice_members pm2 ON (
  cc.content ILIKE '%' || pm2.email || '%'
  OR cc.content ILIKE '%' || pm2.name || '%'
)
WHERE cc.context_type = 'document'
  AND pm2.id IS NOT NULL
  AND pm2.id != cc.client_id
  AND pm1.practice_id = pm2.practice_id; -- Only check within same practice

-- Step 4: For Ben specifically - check his documents
SELECT 
  cc.id,
  cc.client_id,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  pm.email,
  pm.user_id,
  CASE 
    WHEN pm.email = 'ben@atheriohq.com' THEN '✅ Correct'
    WHEN pm.email IS NULL THEN '❌ Orphaned'
    ELSE '⚠️ Wrong client'
  END as status
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.context_type = 'document'
  AND (
    cc.client_id IN (SELECT id FROM practice_members WHERE email = 'ben@atheriohq.com')
    OR cc.content ILIKE '%ben@atheriohq.com%'
    OR cc.content ILIKE '%ben stocken%'
  )
ORDER BY cc.created_at DESC;

-- ============================================================
-- FIX: Update documents with wrong client_id
-- ============================================================
-- WARNING: Review the results above before running this fix
-- This will update documents to use the correct client_id based on email matching

/*
BEGIN;

-- Example: Fix documents for Ben if they have wrong client_id
-- Replace with actual IDs from the diagnostic queries above

DO $$
DECLARE
  correct_client_id UUID;
  wrong_client_id UUID;
  doc_record RECORD;
BEGIN
  -- Get Ben's correct client_id
  SELECT id INTO correct_client_id
  FROM practice_members 
  WHERE email = 'ben@atheriohq.com'
    AND member_type = 'client'
  LIMIT 1;
  
  IF correct_client_id IS NULL THEN
    RAISE EXCEPTION 'Could not find Ben''s client_id';
  END IF;
  
  -- Find documents that might belong to Ben but have wrong client_id
  FOR doc_record IN 
    SELECT cc.id, cc.client_id, cc.content
    FROM client_context cc
    JOIN practice_members pm ON cc.client_id = pm.id
    WHERE cc.context_type = 'document'
      AND cc.client_id != correct_client_id
      AND (
        cc.content ILIKE '%ben@atheriohq.com%'
        OR cc.content ILIKE '%ben stocken%'
        OR pm.email != 'ben@atheriohq.com'
      )
      AND EXISTS (
        SELECT 1 FROM practice_members pm2 
        WHERE pm2.id = correct_client_id 
          AND pm2.practice_id = pm.practice_id
      )
  LOOP
    RAISE NOTICE 'Updating document % from client_id % to %', 
      doc_record.id, doc_record.client_id, correct_client_id;
    
    UPDATE client_context
    SET client_id = correct_client_id
    WHERE id = doc_record.id;
  END LOOP;
  
  RAISE NOTICE 'Document fix completed';
END $$;

COMMIT;
*/
