-- Clean up any incomplete motivational drivers assessment data
-- Run this if you had a partial assessment saved with the old 'power'/'recognition' values

-- Delete any rows that might have invalid driver values
DELETE FROM motivational_drivers
WHERE 
  primary_driver NOT IN ('achievement', 'affiliation', 'power_influence', 'autonomy', 'security', 'variety')
  OR secondary_driver NOT IN ('achievement', 'affiliation', 'power_influence', 'autonomy', 'security', 'variety');

-- Show remaining rows
SELECT 
  pm.name,
  md.primary_driver,
  md.secondary_driver,
  md.assessed_at
FROM motivational_drivers md
JOIN practice_members pm ON md.practice_member_id = pm.id
ORDER BY md.assessed_at DESC;

