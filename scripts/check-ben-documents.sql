-- ============================================================================
-- CHECK BEN'S DOCUMENTS AND PARSING STATUS
-- ============================================================================

-- 1. Check all client_context records for Ben (by email match)
SELECT 
  'By Ben client_id' as source,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.processed,
  cc.created_at,
  pm.email,
  pm.name
FROM client_context cc
JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.email = 'ben@atheriohq.com'
ORDER BY cc.created_at DESC;

-- 2. Check documents by the OLD client_id (1522309d-...) which might have Ben's docs
SELECT 
  'By OLD client_id' as source,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.processed,
  cc.created_at
FROM client_context cc
WHERE cc.client_id = '1522309d-3516-4694-8a8a-69f24ab22d28'
ORDER BY cc.created_at DESC;

-- 3. Check documents by Ben's CURRENT client_id
SELECT 
  'By CURRENT client_id' as source,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.processed,
  cc.created_at
FROM client_context cc
WHERE cc.client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
ORDER BY cc.created_at DESC;

-- 4. Check all documents for BOTH client_ids (current and old)
SELECT 
  'All docs for both IDs' as check_type,
  cc.id as context_id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.processed,
  cc.created_at
FROM client_context cc
WHERE cc.client_id IN (
  '34c94120-928b-402e-bb04-85edf9d6de42',  -- Ben's current ID
  '1522309d-3516-4694-8a8a-69f24ab22d28'   -- Old ID that might have his docs
)
ORDER BY cc.created_at DESC;

-- 5. Look for any documents with "Atherio" in the content or URL (Ben's company)
SELECT 
  'Atherio docs search' as source,
  cc.id,
  cc.client_id,
  cc.content,
  cc.source_file_url,
  cc.processed,
  pm.email,
  pm.name
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.content ILIKE '%atherio%' 
   OR cc.source_file_url ILIKE '%atherio%'
ORDER BY cc.created_at DESC;

-- 6. Check what practice_members records exist for Ben
SELECT 
  'Ben practice_members' as source,
  id,
  user_id,
  email,
  name,
  member_type,
  practice_id,
  created_at
FROM practice_members
WHERE email = 'ben@atheriohq.com'
ORDER BY created_at DESC;

-- 7. Summary of all documents in the practice
SELECT 
  'Practice documents summary' as check_type,
  pm.email,
  pm.name,
  COUNT(cc.id) as doc_count,
  COUNT(CASE WHEN cc.processed = true THEN 1 END) as processed_count
FROM client_context cc
JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568'
  AND cc.context_type = 'document'
GROUP BY pm.email, pm.name
ORDER BY doc_count DESC;
