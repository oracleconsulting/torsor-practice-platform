-- =====================================================
-- DISCOVER ACTUAL TABLE SCHEMAS
-- Run this FIRST to find the real column names
-- =====================================================

-- 1. What columns exist in eq_assessments?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eq_assessments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. What columns exist in motivational_drivers?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'motivational_drivers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. What columns exist in belbin_assessments?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'belbin_assessments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. What columns exist in working_preferences?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'working_preferences' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. What columns exist in conflict_style_assessments?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conflict_style_assessments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- AFTER YOU RUN THE ABOVE, WE'LL KNOW THE REAL COLUMN NAMES
-- Then we can query Wes's actual data using the correct columns
-- =====================================================

