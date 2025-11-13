-- Check Wes Mason's assessment data

-- Find Wes's member ID
SELECT 
  id,
  name,
  email,
  role
FROM practice_members
WHERE name ILIKE '%wes%mason%' OR email ILIKE '%wmason%';

-- Check EQ assessment (using correct column names with _score suffix)
SELECT 
  'EQ Assessment' as assessment_type,
  practice_member_id,
  self_awareness_score,
  self_management_score,
  social_awareness_score,
  relationship_management_score,
  overall_eq,
  eq_level
FROM eq_assessments
WHERE practice_member_id IN (
  SELECT id FROM practice_members WHERE name ILIKE '%wes%mason%'
);

-- Check Motivational Drivers
SELECT 
  'Motivational Drivers' as assessment_type,
  practice_member_id,
  achievement_score,
  affiliation_score,
  autonomy_score,
  influence_score,
  dominant_driver
FROM motivational_drivers
WHERE practice_member_id IN (
  SELECT id FROM practice_members WHERE name ILIKE '%wes%mason%'
);

-- Check Belbin
SELECT 
  'Belbin' as assessment_type,
  practice_member_id,
  primary_role,
  secondary_role
FROM belbin_assessments
WHERE practice_member_id IN (
  SELECT id FROM practice_members WHERE name ILIKE '%wes%mason%'
);

-- Check Skills (count)
SELECT 
  'Skills' as assessment_type,
  COUNT(*) as skill_count,
  AVG(current_level) as avg_level
FROM skill_assessments
WHERE team_member_id IN (
  SELECT id FROM practice_members WHERE name ILIKE '%wes%mason%'
);
