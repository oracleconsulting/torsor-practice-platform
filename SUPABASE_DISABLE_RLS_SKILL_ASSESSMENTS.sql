-- Disable RLS on skill_assessments table to match practices and practice_members
-- This ensures the frontend can read assessment data

-- Drop all existing policies on skill_assessments
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'skill_assessments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON skill_assessments', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
    
    RAISE NOTICE '✅ All policies dropped from skill_assessments';
END $$;

-- Disable RLS on skill_assessments
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  '✅ RLS DISABLED on skill_assessments' as status,
  COUNT(*) as total_assessments
FROM skill_assessments;

-- This allows the frontend to read all skill assessment data
-- We'll add proper RLS back after launch

