-- =====================================================
-- Import Assessment Data from Invitations (V2 - Simplified)
-- =====================================================
-- Direct INSERT with better error handling
-- Date: October 11, 2025
-- =====================================================

-- Insert assessments for James Howard
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
  pm.id as team_member_id,
  (skill_item->>'skill_id')::UUID as skill_id,
  COALESCE((skill_item->>'current_level')::int, 0) as current_level,
  COALESCE((skill_item->>'interest_level')::int, 3) as interest_level,
  skill_item->>'notes' as notes,
  inv.accepted_at as assessed_at,
  pm.id as assessed_by,
  'self' as assessment_type,
  NOW() as created_at,
  NOW() as updated_at
FROM invitations inv
CROSS JOIN LATERAL jsonb_array_elements(inv.assessment_data) as skill_item
JOIN practice_members pm ON pm.email = inv.email
JOIN skills sk ON sk.id = (skill_item->>'skill_id')::UUID  -- Validate skill exists
WHERE inv.assessment_data IS NOT NULL
  AND inv.assessment_data != '[]'::jsonb
  AND jsonb_array_length(inv.assessment_data) > 0
  AND skill_item ? 'skill_id'
  AND skill_item ? 'current_level'
  -- Only insert if not already exists
  AND NOT EXISTS (
    SELECT 1 FROM skill_assessments sa2
    WHERE sa2.team_member_id = pm.id
      AND sa2.skill_id = (skill_item->>'skill_id')::UUID
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
JOIN skill_assessments sa ON sa.team_member_id = pm.id
GROUP BY pm.id, pm.name, pm.email
ORDER BY assessments DESC;

