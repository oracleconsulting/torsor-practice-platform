-- =====================================================
-- Import Assessments Matching by Skill Order/Position
-- =====================================================
-- The skill UUIDs in assessment_data are old/invalid
-- We'll match by position in the array since assessments
-- were taken in the same order as skills were presented
-- Date: October 11, 2025
-- =====================================================

-- Get the current skills in the same order they were presented
WITH ordered_skills AS (
  SELECT 
    id as skill_id,
    name,
    category,
    ROW_NUMBER() OVER (ORDER BY category, name) as skill_position
  FROM skills
  ORDER BY category, name
),
-- Expand invitations assessment data with positions
assessment_items AS (
  SELECT 
    inv.email,
    inv.accepted_at,
    pm.id as member_id,
    (skill_item->>'current_level')::int as current_level,
    COALESCE((skill_item->>'interest_level')::int, 3) as interest_level,
    skill_item->>'notes' as notes,
    ROW_NUMBER() OVER (PARTITION BY inv.email ORDER BY ordinality) as item_position
  FROM invitations inv
  CROSS JOIN LATERAL jsonb_array_elements(inv.assessment_data) WITH ORDINALITY as skill_item(val, ordinality)
  JOIN practice_members pm ON pm.email = inv.email
  WHERE inv.assessment_data IS NOT NULL
    AND jsonb_array_length(inv.assessment_data) > 0
    AND skill_item.val ? 'current_level'
)
-- Insert matching by position
INSERT INTO skill_assessments (
  team_member_id,
  skill_id,
  current_level,
  interest_level,
  notes,
  assessed_at,
  assessed_by,
  assessment_type,
  created_at,
  updated_at
)
SELECT 
  ai.member_id,
  os.skill_id,
  ai.current_level,
  ai.interest_level,
  ai.notes,
  ai.accepted_at,
  ai.member_id,
  'self',
  NOW(),
  NOW()
FROM assessment_items ai
JOIN ordered_skills os ON os.skill_position = ai.item_position
WHERE NOT EXISTS (
  SELECT 1 FROM skill_assessments sa2
  WHERE sa2.team_member_id = ai.member_id
    AND sa2.skill_id = os.skill_id
);

-- Show results
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_assessments,
  COUNT(DISTINCT team_member_id) as team_members,
  ROUND(AVG(current_level), 1) as avg_level
FROM skill_assessments;

-- Show per-member breakdown
SELECT 
  pm.name,
  pm.email,
  COUNT(sa.*) as assessments,
  ROUND(AVG(sa.current_level), 1) as avg_current,
  ROUND(AVG(sa.interest_level), 1) as avg_interest
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
GROUP BY pm.id, pm.name, pm.email
ORDER BY assessments DESC;

