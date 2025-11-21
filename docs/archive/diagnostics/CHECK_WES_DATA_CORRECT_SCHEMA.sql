-- =====================================================
-- CHECK WES'S ACTUAL DATA (Using Correct Schema)
-- =====================================================

-- Wes's ID: 2b5f8f65-97bb-4c44-9d6b-56788ab593b9

-- 1. EQ Assessment (this should work - schema is correct)
SELECT 
  'EQ Assessment' as assessment,
  practice_member_id,
  self_awareness_score,
  self_management_score,
  social_awareness_score,
  relationship_management_score,
  overall_eq,
  eq_level
FROM eq_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 2. Motivational Drivers (scores are in JSONB field)
SELECT 
  'Motivational Drivers' as assessment,
  practice_member_id,
  primary_driver,
  secondary_driver,
  driver_scores, -- This is JSONB containing all the scores
  motivation_intensity
FROM motivational_drivers
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 3. Belbin (scores are in JSONB field)
SELECT 
  'Belbin Roles' as assessment,
  practice_member_id,
  primary_role,
  secondary_role,
  role_scores, -- This is JSONB containing all role scores
  domain_scores -- This is JSONB containing domain scores
FROM belbin_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 4. Working Preferences (different column names)
SELECT 
  'Working Preferences' as assessment,
  practice_member_id,
  communication_style, -- NOT communication_preference
  work_style,
  environment, -- NOT work_environment
  feedback_preference,
  collaboration_preference,
  time_management,
  preferences_data -- This is JSONB containing additional data
FROM working_preferences
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- 5. Conflict Style
SELECT 
  'Conflict Style' as assessment,
  practice_member_id,
  primary_style,
  secondary_style,
  assertiveness_level,
  cooperativeness_level
FROM conflict_style_assessments
WHERE practice_member_id = '2b5f8f65-97bb-4c44-9d6b-56788ab593b9';

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- If Wes completed all assessments, each query should return 1 row
-- The JSONB fields (driver_scores, role_scores) will show the actual scores
-- 
-- Example driver_scores might look like:
-- {"achievement": 85, "affiliation": 60, "autonomy": 70, "influence": 80}
-- =====================================================

