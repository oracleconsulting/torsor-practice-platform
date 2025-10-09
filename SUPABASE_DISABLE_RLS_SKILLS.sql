-- Disable RLS on skills table to allow frontend to read all skills
-- This ensures the Skills Matrix can load all 110 skills from the database

-- Drop all existing policies on skills
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'skills'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON skills', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
    
    RAISE NOTICE '✅ All policies dropped from skills';
END $$;

-- Disable RLS on skills table
ALTER TABLE skills DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  '✅ RLS DISABLED on skills' as status,
  COUNT(*) as total_skills
FROM skills;

-- This allows the frontend to read all skills
-- Should return 110 skills after running the 110-skill migration

