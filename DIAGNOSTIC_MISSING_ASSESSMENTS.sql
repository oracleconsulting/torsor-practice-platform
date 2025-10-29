-- ==============================================================
-- DIAGNOSTIC: Find why 7 members have no skill_assessments
-- ==============================================================

-- Part 1: Check invitations table for the 7 missing members
SELECT 
  i.email,
  i.name,
  i.status,
  i.accepted_at,
  CASE 
    WHEN i.assessment_data IS NULL THEN 'NULL'
    WHEN jsonb_array_length(i.assessment_data) = 0 THEN 'EMPTY_ARRAY'
    ELSE jsonb_array_length(i.assessment_data)::text || ' skills'
  END as assessment_data_status,
  pm.id as practice_member_id,
  pm.email as pm_email
FROM invitations i
LEFT JOIN practice_members pm ON pm.email = i.email AND pm.practice_id = i.practice_id
WHERE i.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND i.email IN (
    'LZavros@rpgcc.co.uk',
    'JAttersall@rpgcc.co.uk',
    'rizwanp@rpgcc.co.uk',
    'AFarman@rpgcc.co.uk',
    'LAllagapen@rpgcc.co.uk',
    'MEdirisinghe@rpgcc.co.uk',
    'SBairdCaesar@rpgcc.co.uk'
  )
ORDER BY i.email;

-- Part 2: Check if practice_members exist for these emails
SELECT 
  pm.id,
  pm.email,
  pm.name,
  pm.role,
  pm.is_active,
  COUNT(sa.id) as assessment_count
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND pm.email IN (
    'LZavros@rpgcc.co.uk',
    'JAttersall@rpgcc.co.uk',
    'rizwanp@rpgcc.co.uk',
    'AFarman@rpgcc.co.uk',
    'LAllagapen@rpgcc.co.uk',
    'MEdirisinghe@rpgcc.co.uk',
    'SBairdCaesar@rpgcc.co.uk'
  )
GROUP BY pm.id, pm.email, pm.name, pm.role, pm.is_active
ORDER BY pm.email;

-- Part 3: Check for email case sensitivity issues
SELECT 
  pm.email as practice_member_email,
  i.email as invitation_email,
  pm.email = i.email as emails_match,
  CASE 
    WHEN i.assessment_data IS NULL THEN 'NO_DATA'
    ELSE jsonb_array_length(i.assessment_data)::text || ' skills'
  END as invitation_has_data
FROM practice_members pm
LEFT JOIN invitations i ON LOWER(pm.email) = LOWER(i.email) AND i.practice_id = pm.practice_id
WHERE pm.practice_id = (SELECT id FROM practices WHERE name = 'RPGCC')
  AND LOWER(pm.email) IN (
    LOWER('LZavros@rpgcc.co.uk'),
    LOWER('JAttersall@rpgcc.co.uk'),
    LOWER('rizwanp@rpgcc.co.uk'),
    LOWER('AFarman@rpgcc.co.uk'),
    LOWER('LAllagapen@rpgcc.co.uk'),
    LOWER('MEdirisinghe@rpgcc.co.uk'),
    LOWER('SBairdCaesar@rpgcc.co.uk')
  )
ORDER BY pm.email;

