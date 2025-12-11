-- ============================================================================
-- CLEANUP ALL ORPHANED DOCUMENTS
-- ============================================================================
-- Finds and deletes all client_context records where the client_id
-- doesn't match any practice_members record
-- ============================================================================

-- 1. First, see all orphaned documents
SELECT 
  'ORPHANED DOCUMENTS' as status,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.created_at
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.id IS NULL
ORDER BY cc.created_at DESC;

-- 2. Count orphaned documents
SELECT 
  'Total orphaned documents' as metric,
  COUNT(*) as count
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.id IS NULL;

-- ============================================================================
-- DELETE ALL ORPHANED DOCUMENTS
-- ============================================================================

DELETE FROM client_context
WHERE id IN (
  SELECT cc.id
  FROM client_context cc
  LEFT JOIN practice_members pm ON cc.client_id = pm.id
  WHERE pm.id IS NULL
);

-- 3. Verify cleanup
SELECT 
  'Remaining orphaned documents (should be 0)' as metric,
  COUNT(*) as count
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.id IS NULL;

-- 4. Show all documents now properly linked
SELECT 
  'Properly linked documents' as status,
  pm.email,
  pm.name,
  COUNT(cc.id) as doc_count
FROM client_context cc
JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.context_type = 'document'
GROUP BY pm.email, pm.name
ORDER BY doc_count DESC;
