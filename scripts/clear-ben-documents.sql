-- ============================================================================
-- CLEAR ALL BEN'S DOCUMENTS
-- ============================================================================
-- This will delete all client_context records for Ben so we can start fresh
-- ============================================================================

-- First, let's see what we're deleting
SELECT 
  'Documents to delete' as action,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url,
  cc.processed,
  cc.created_at
FROM client_context cc
WHERE cc.client_id = '34c94120-928b-402e-bb04-85edf9d6de42'  -- Ben's current client_id
ORDER BY cc.created_at DESC;

-- Also check for any documents under the OLD client_id
SELECT 
  'Documents under OLD client_id' as action,
  cc.id,
  cc.client_id,
  cc.context_type,
  cc.content,
  cc.source_file_url
FROM client_context cc
WHERE cc.client_id = '1522309d-3516-4694-8a8a-69f24ab22d28';  -- Old client_id

-- ============================================================================
-- DELETE SECTION - Run this after reviewing the above
-- ============================================================================

-- Delete documents for Ben's CURRENT client_id
DELETE FROM client_context
WHERE client_id = '34c94120-928b-402e-bb04-85edf9d6de42';

-- Delete any documents under the OLD client_id (if any remain)
DELETE FROM client_context
WHERE client_id = '1522309d-3516-4694-8a8a-69f24ab22d28';

-- Verify deletion
SELECT 
  'Verification - should be empty' as check,
  COUNT(*) as remaining_docs
FROM client_context
WHERE client_id IN (
  '34c94120-928b-402e-bb04-85edf9d6de42',
  '1522309d-3516-4694-8a8a-69f24ab22d28'
);

-- Note: The files still exist in Supabase Storage but won't be linked to any client
-- You may want to clean up storage separately if needed
