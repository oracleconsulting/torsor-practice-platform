-- ==============================================================
-- DIAGNOSTIC: Why are these 3 members missing?
-- ==============================================================

-- Check invitations for the 3 missing members
SELECT 
  'Invitations Check' as query_type,
  i.email,
  i.name,
  i.status,
  CASE 
    WHEN i.assessment_data IS NULL THEN 'NO DATA'
    ELSE jsonb_array_length(i.assessment_data)::text || ' skills'
  END as assessment_status
FROM invitations i
WHERE i.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND (
    LOWER(i.email) LIKE '%janandeswaran%' OR
    LOWER(i.email) LIKE '%jhoward%' OR
    LOWER(i.email) LIKE '%ltyrrell%'
  )
ORDER BY i.email;

-- Check practice_members for these 3
SELECT 
  'Practice Members Check' as query_type,
  pm.id,
  pm.email,
  pm.name,
  pm.role
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.email IN (
    'JAnandeswaran@rpgcc.co.uk',
    'jhoward@rpgcc.co.uk',
    'Ltyrrell@rpgcc.co.uk'
  )
ORDER BY pm.email;

-- Try case-insensitive email matching
SELECT 
  'Case Insensitive Match' as query_type,
  pm.email as pm_email,
  i.email as inv_email,
  CASE 
    WHEN i.assessment_data IS NULL THEN 'NO DATA'
    ELSE jsonb_array_length(i.assessment_data)::text || ' skills'
  END as assessment_status
FROM practice_members pm
LEFT JOIN invitations i ON LOWER(pm.email) = LOWER(i.email) AND i.practice_id = pm.practice_id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.email IN (
    'JAnandeswaran@rpgcc.co.uk',
    'jhoward@rpgcc.co.uk',
    'Ltyrrell@rpgcc.co.uk'
  )
ORDER BY pm.email;

-- List ALL invitation emails to see what we have
SELECT 
  'All Invitations' as query_type,
  email,
  name,
  CASE 
    WHEN assessment_data IS NULL THEN 'NO DATA'
    ELSE jsonb_array_length(assessment_data)::text || ' skills'
  END as assessment_status
FROM invitations
WHERE practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
ORDER BY email;

