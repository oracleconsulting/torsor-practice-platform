-- =====================================================
-- FIX WES'S ZERO SCORES - CORRECT COLUMN NAMES
-- =====================================================

-- First, let's find the actual column names in each table
-- Run these queries ONE AT A TIME to discover the schema

-- 1. Check EQ table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eq_assessments' 
ORDER BY ordinal_position;

-- 2. Check Motivational Drivers table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'motivational_drivers' 
ORDER BY ordinal_position;

-- 3. Check Belbin table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'belbin_assessments' 
ORDER BY ordinal_position;

-- 4. Check Working Preferences table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'working_preferences' 
ORDER BY ordinal_position;

-- 5. Now let's see Wes's actual data (using correct columns)
-- First find Wes's ID
SELECT id, name, email, role 
FROM practice_members 
WHERE name ILIKE '%wes%' OR email ILIKE '%wmason%';

-- Once we have his ID, check his actual assessment data:
-- (Replace 'WES_ID_HERE' with his actual ID from above)

-- EQ Assessment
SELECT 
  practice_member_id,
  self_awareness_score,
  self_management_score,
  social_awareness_score,
  relationship_management_score,
  overall_eq,
  eq_level
FROM eq_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- Motivational Drivers (check what columns actually exist)
SELECT * 
FROM motivational_drivers
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- Belbin
SELECT *
FROM belbin_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- Working Preferences
SELECT *
FROM working_preferences
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 6. Check individual profile data
SELECT 
  member_id,
  advisory_suitability,
  technical_suitability,
  leadership_readiness,
  role_fit_scores,
  created_at,
  updated_at
FROM individual_assessment_profiles
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 7. Force recalculate Wes's profile
DELETE FROM individual_assessment_profiles 
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

DELETE FROM role_competency_gaps
WHERE member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- Then go to the Individual Profiles page and click "Refresh All"
