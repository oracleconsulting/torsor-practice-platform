-- ==============================================================
-- CHECK: Do practice_member records exist for these 3?
-- ==============================================================

-- Check all practice members
SELECT 
  pm.id,
  pm.email,
  pm.name,
  pm.role,
  pm.is_active,
  pm.practice_id
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND (
    pm.email IN (
      'JAnandeswaran@rpgcc.co.uk',
      'jhoward@rpgcc.co.uk',
      'Ltyrrell@rpgcc.co.uk'
    )
    OR LOWER(pm.email) IN (
      LOWER('JAnandeswaran@rpgcc.co.uk'),
      LOWER('jhoward@rpgcc.co.uk'),
      LOWER('Ltyrrell@rpgcc.co.uk')
    )
  )
ORDER BY pm.email;

-- If no results, check if they exist with different emails
SELECT 
  pm.id,
  pm.email,
  pm.name,
  pm.role
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND (
    LOWER(pm.name) LIKE '%jaanu%' OR
    LOWER(pm.name) LIKE '%james%' OR
    LOWER(pm.name) LIKE '%luke%'
  )
ORDER BY pm.name;

-- List ALL practice members to see what we have
SELECT 
  pm.id,
  pm.email,
  pm.name,
  pm.role,
  pm.is_active
FROM practice_members pm
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
ORDER BY pm.name;

