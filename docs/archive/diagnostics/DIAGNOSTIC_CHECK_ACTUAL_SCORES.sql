-- =====================================================
-- DIAGNOSTIC: Check Actual Assessment Scores
-- =====================================================
-- Run this to see what's actually in your database
-- vs what the profiles are calculating
-- =====================================================

-- 1. Check James Howard's actual EQ scores
SELECT 
  pm.name,
  eq.self_awareness_score,
  eq.self_management_score,
  eq.social_awareness_score,
  eq.relationship_management_score,
  eq.overall_eq
FROM practice_members pm
LEFT JOIN eq_assessments eq ON eq.practice_member_id = pm.id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- 2. Check James Howard's Belbin roles
SELECT 
  pm.name,
  b.primary_role,
  b.secondary_role,
  b.tertiary_role
FROM practice_members pm
LEFT JOIN belbin_assessments b ON b.practice_member_id = pm.id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- 3. Check James Howard's motivational drivers
SELECT 
  pm.name,
  md.achievement_score,
  md.affiliation_score,
  md.autonomy_score,
  md.influence_score
FROM practice_members pm
LEFT JOIN motivational_drivers md ON md.practice_member_id = pm.id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- 4. Check what's in the calculated profile
SELECT 
  pm.name,
  iap.advisory_score,
  iap.technical_score,
  iap.leadership_score,
  iap.top_strengths,
  iap.development_areas,
  iap.last_calculated
FROM practice_members pm
LEFT JOIN individual_assessment_profiles iap ON iap.practice_member_id = pm.id
WHERE pm.email = 'jhoward@rpgcc.co.uk';

-- 5. Check ALL team members' EQ scores (to see if everyone is getting defaults)
SELECT 
  pm.name,
  pm.role,
  COALESCE(eq.self_awareness_score, 0) as self_awareness,
  COALESCE(eq.self_management_score, 0) as self_management,
  COALESCE(eq.social_awareness_score, 0) as social_awareness,
  COALESCE(eq.relationship_management_score, 0) as relationship_management,
  COALESCE(eq.overall_eq, 0) as overall_eq
FROM practice_members pm
LEFT JOIN eq_assessments eq ON eq.practice_member_id = pm.id
WHERE pm.is_test_account IS NOT TRUE
ORDER BY pm.name;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- If you see NULL or 0 values -> Data is missing from assessments
-- If you see actual scores (e.g., 77, 82, etc.) -> Data exists but profile calc is wrong
-- =====================================================

