-- ============================================================================
-- VERIFY SYSTEMS AUDIT RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor to check if RLS policies allow client access
-- ============================================================================

-- Check current policies on sa_engagements
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'sa_engagements'
ORDER BY policyname;

-- Check if policies allow client_id = auth.uid()
-- Look for policies that have: client_id = auth.uid() OR practice_id = current_setting(...)

-- Test query as a client (this will show if RLS is blocking)
-- Replace '1522309d-3516-4694-8a0a-69f24ab22d28' with your actual client_id
SELECT 
    id,
    client_id,
    practice_id,
    status,
    stage_1_completed_at,
    stage_2_completed_at
FROM sa_engagements
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28';

-- If the above query returns no rows but you know the engagement exists,
-- the RLS policies are blocking client access and the migration needs to be applied.

