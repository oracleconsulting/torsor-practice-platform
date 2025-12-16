-- ============================================================================
-- Add RLS policy to allow clients to view their own shared context
-- ============================================================================
-- This allows clients to see context that has been marked as is_shared = true
-- This is needed for Management Accounts insights and other shared reports
-- ============================================================================

-- Add is_shared column if it doesn't exist
ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Add data_source_type column if it doesn't exist
ALTER TABLE client_context 
ADD COLUMN IF NOT EXISTS data_source_type TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_context_is_shared 
ON client_context(client_id, is_shared, context_type) 
WHERE is_shared = true;

-- Add RLS policy: Clients can view their own shared context
DROP POLICY IF EXISTS "Clients can view their own shared context" ON client_context;

CREATE POLICY "Clients can view their own shared context" 
ON client_context
FOR SELECT
USING (
  -- Client can view their own context if it's marked as shared
  EXISTS (
    SELECT 1 FROM practice_members pm
    WHERE pm.id = client_context.client_id
    AND pm.user_id = auth.uid()
    AND client_context.is_shared = true
  )
);

COMMENT ON POLICY "Clients can view their own shared context" ON client_context IS 
'Allows clients to view context that has been explicitly shared with them (is_shared = true)';

