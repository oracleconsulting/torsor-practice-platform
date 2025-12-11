-- ============================================================================
-- FIX ORPHANED DOCUMENT
-- ============================================================================

-- 1. Check this specific orphaned document
SELECT 
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.created_at,
  pm.email as linked_email,
  pm.name as linked_name
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE cc.id = 'd7b4c0e5-947f-48fe-b5e9-0811d4c84e38';

-- 2. Check what client_id this document has
SELECT 
  cc.client_id,
  cc.source_file_url
FROM client_context cc
WHERE cc.id = 'd7b4c0e5-947f-48fe-b5e9-0811d4c84e38';

-- 3. Check all client_context records that don't have valid practice_members
SELECT 
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.id IS NULL;

-- ============================================================================
-- FIX: Delete orphaned document or reassign to correct client
-- ============================================================================

-- Option A: Delete the orphaned document
DELETE FROM client_context
WHERE id = 'd7b4c0e5-947f-48fe-b5e9-0811d4c84e38';

-- Option B: If you want to reassign to Ben instead, use this:
-- UPDATE client_context
-- SET client_id = '34c94120-928b-402e-bb04-85edf9d6de42'
-- WHERE id = 'd7b4c0e5-947f-48fe-b5e9-0811d4c84e38';

-- Verify
SELECT 
  'Verification' as check,
  COUNT(*) as orphaned_docs
FROM client_context cc
LEFT JOIN practice_members pm ON cc.client_id = pm.id
WHERE pm.id IS NULL;
