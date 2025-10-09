-- =====================================================
-- DISABLE RLS ON INVITATIONS TABLES
-- =====================================================
-- This script disables RLS on invitation-related tables
-- to resolve the loading issue on the Invitations Page
-- =====================================================

-- Drop all existing policies on invitations
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'invitations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitations', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Disable RLS on invitations
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on invitation_events
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'invitation_events'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitation_events', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Disable RLS on invitation_events (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'invitation_events'
    ) THEN
        ALTER TABLE public.invitation_events DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on invitation_events';
    ELSE
        RAISE NOTICE 'Table invitation_events does not exist, skipping';
    END IF;
END $$;

-- Drop all existing policies on invitation_batches
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'invitation_batches'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitation_batches', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Disable RLS on invitation_batches (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'invitation_batches'
    ) THEN
        ALTER TABLE public.invitation_batches DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on invitation_batches';
    ELSE
        RAISE NOTICE 'Table invitation_batches does not exist, skipping';
    END IF;
END $$;

-- Verify
SELECT 
    'invitations' as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'invitations' AND relnamespace = 'public'::regnamespace

UNION ALL

SELECT 
    'invitation_events' as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'invitation_events' AND relnamespace = 'public'::regnamespace

UNION ALL

SELECT 
    'invitation_batches' as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'invitation_batches' AND relnamespace = 'public'::regnamespace;

-- Expected result: All tables should show rls_enabled = false

