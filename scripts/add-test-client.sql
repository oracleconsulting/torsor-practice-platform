-- Check if user exists in auth
-- If not, they'll be created when they first sign in via magic link

-- Add to practice_members as a CLIENT (not team)
-- This ensures they can ONLY access the client portal

INSERT INTO practice_members (
  practice_id,
  name,
  email,
  role,
  member_type,
  client_company,
  client_industry,
  client_stage,
  program_status,
  program_enrolled_at,
  is_active
)
SELECT 
  p.id,
  'Tom Sherwin',
  'tom@rowgear.com',
  'Client',
  'client',           -- KEY: This restricts to client portal only
  'Rowgear',
  'Consulting',
  'growth',
  'active',
  NOW(),
  true
FROM practices p
WHERE p.name ILIKE '%torsor%' OR p.id = (SELECT practice_id FROM practice_members LIMIT 1)
LIMIT 1
ON CONFLICT (email, practice_id) 
DO UPDATE SET 
  member_type = 'client',
  program_status = 'active',
  is_active = true;

-- Verify
SELECT id, name, email, member_type, program_status, client_company 
FROM practice_members 
WHERE email = 'tom@rowgear.com';
