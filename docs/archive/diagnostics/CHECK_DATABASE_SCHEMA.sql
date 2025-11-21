-- =====================================================
-- CHECK ACTUAL DATABASE SCHEMA
-- =====================================================
-- Let's see what columns ACTUALLY exist in the tables
-- =====================================================

-- 1. Check eq_assessments table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eq_assessments'
ORDER BY ordinal_position;

-- 2. Check what data is actually in eq_assessments
SELECT *
FROM eq_assessments
LIMIT 3;

-- 3. Check belbin_assessments structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'belbin_assessments'
ORDER BY ordinal_position;

-- 4. Check motivational_drivers structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'motivational_drivers'
ORDER BY ordinal_position;

-- 5. Check practice_members structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practice_members'
ORDER BY ordinal_position;

-- =====================================================
-- AFTER RUNNING THIS:
-- =====================================================
-- This will tell us:
-- 1. What columns actually exist
-- 2. Whether the code is querying the wrong columns
-- 3. Why profiles aren't being calculated correctly
-- =====================================================

