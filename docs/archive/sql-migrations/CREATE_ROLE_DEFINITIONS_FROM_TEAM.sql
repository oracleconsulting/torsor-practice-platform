-- =====================================================
-- AUTO-CREATE ROLE DEFINITIONS FROM ROLE MANAGEMENT
-- =====================================================
-- This creates Role Definitions matching your team's actual roles
-- and auto-assigns team members to their corresponding role
-- =====================================================

BEGIN;

-- Step 1: Delete old seeded roles
DELETE FROM role_definitions;

-- Step 2: Get your practice_id
-- (We'll use this to create practice-specific role definitions)
DO $$
DECLARE
  v_practice_id UUID;
BEGIN
  -- Get the practice_id from the first team member
  SELECT practice_id INTO v_practice_id
  FROM practice_members
  WHERE email = 'jhoward@rpgcc.co.uk'
  LIMIT 1;

  -- Create Role Definitions matching Role Management structure
  
  -- PARTNER
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Partner',
    'leadership',
    'Partner',
    'Leadership',
    'Senior leadership role with full practice management responsibilities',
    ARRAY[
      'Set strategic direction for the practice',
      'Manage client relationships at highest level',
      'Lead business development initiatives',
      'Oversee financial performance',
      'Mentor and develop senior staff',
      'Make key business decisions'
    ],
    '{"primary": "Coordinator", "secondary": "Shaper"}'::jsonb,
    75, -- Self-Awareness
    75, -- Self-Management
    80, -- Social Awareness
    80, -- Relationship Management
    80, -- Achievement
    60, -- Affiliation
    70, -- Autonomy
    75, -- Influence
    'sync',
    true,
    true
  );

  -- DIRECTOR
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Director',
    'leadership',
    'Director',
    'Leadership',
    'Senior management role with department oversight and team leadership',
    ARRAY[
      'Lead and manage department or service line',
      'Develop and mentor team members',
      'Manage key client relationships',
      'Drive revenue and profitability',
      'Contribute to strategic planning',
      'Ensure quality and compliance standards'
    ],
    '{"primary": "Coordinator", "secondary": "Implementer"}'::jsonb,
    70,
    70,
    75,
    75,
    75, -- Achievement
    55, -- Affiliation
    65, -- Autonomy
    70, -- Influence
    'sync',
    true,
    true
  );

  -- MANAGER
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Manager',
    'technical',
    'Manager',
    'Operations',
    'Experienced professional managing projects and mentoring junior staff',
    ARRAY[
      'Manage client engagements and deliverables',
      'Review and quality check team work',
      'Supervise and develop junior staff',
      'Manage budgets and timelines',
      'Build client relationships',
      'Identify business opportunities'
    ],
    '{"primary": "Coordinator", "secondary": "Monitor Evaluator"}'::jsonb,
    65,
    65,
    65,
    70,
    70, -- Achievement
    60, -- Affiliation
    60, -- Autonomy
    60, -- Influence
    'hybrid',
    true,
    true
  );

  -- ASSISTANT MANAGER
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Assistant Manager',
    'technical',
    'Assistant Manager',
    'Operations',
    'Senior professional leading work streams and supporting management',
    ARRAY[
      'Lead specific work streams or projects',
      'Review junior staff work',
      'Support client relationship management',
      'Contribute to team training and development',
      'Manage day-to-day client interactions',
      'Assist with business development'
    ],
    '{"primary": "Implementer", "secondary": "Team Worker"}'::jsonb,
    60,
    60,
    60,
    65,
    65, -- Achievement
    55, -- Affiliation
    55, -- Autonomy
    55, -- Influence
    'hybrid',
    true,
    true
  );

  -- SENIOR
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Senior',
    'technical',
    'Senior',
    'Operations',
    'Experienced practitioner with increased autonomy and client interaction',
    ARRAY[
      'Complete assignments with minimal supervision',
      'Handle routine client communications',
      'Support junior team members',
      'Identify and escalate issues',
      'Manage own time and workload',
      'Contribute to process improvements'
    ],
    '{"primary": "Implementer", "secondary": "Specialist"}'::jsonb,
    55,
    55,
    55,
    55,
    60, -- Achievement
    50, -- Affiliation
    50, -- Autonomy
    50, -- Influence
    'hybrid',
    false,
    true
  );

  -- JUNIOR
  INSERT INTO role_definitions (
    practice_id,
    role_title,
    role_category,
    seniority_level,
    department,
    description,
    key_responsibilities,
    required_belbin_roles,
    min_eq_self_awareness,
    min_eq_self_management,
    min_eq_social_awareness,
    min_eq_relationship_management,
    required_achievement,
    required_affiliation,
    required_autonomy,
    required_influence,
    preferred_communication_style,
    client_facing,
    is_active
  ) VALUES (
    v_practice_id,
    'Junior',
    'technical',
    'Junior',
    'Operations',
    'Entry-level professional learning and developing core skills',
    ARRAY[
      'Complete assigned tasks under supervision',
      'Learn technical and professional skills',
      'Follow established processes and procedures',
      'Ask questions and seek guidance',
      'Develop client service awareness',
      'Build foundational competencies'
    ],
    '{"primary": "Implementer", "secondary": "Team Worker"}'::jsonb,
    50,
    50,
    50,
    50,
    55, -- Achievement
    55, -- Affiliation
    40, -- Autonomy
    45, -- Influence
    'async',
    false,
    true
  );

  -- Step 3: Auto-assign team members to their corresponding role definition
  -- This matches their current role in practice_members to the new role definition
  
  INSERT INTO member_role_assignments (
    practice_member_id,
    role_definition_id,
    assigned_date,
    assignment_status
  )
  SELECT 
    pm.id,
    rd.id,
    NOW(),
    'active'
  FROM practice_members pm
  JOIN role_definitions rd ON rd.role_title = pm.role AND rd.practice_id = pm.practice_id
  WHERE pm.practice_id = v_practice_id
    AND pm.is_test_account IS NOT TRUE
    AND NOT EXISTS (
      -- Don't create duplicate assignments
      SELECT 1 FROM member_role_assignments mra
      WHERE mra.practice_member_id = pm.id
        AND mra.assignment_status = 'active'
    );

  RAISE NOTICE 'Successfully created role definitions and assigned % team members', 
    (SELECT COUNT(*) FROM practice_members WHERE practice_id = v_practice_id AND is_test_account IS NOT TRUE);

END $$;

COMMIT;

-- =====================================================
-- VERIFY THE RESULTS
-- =====================================================

-- Check created role definitions
SELECT 
  role_title,
  seniority_level,
  department,
  is_active
FROM role_definitions
ORDER BY 
  CASE seniority_level
    WHEN 'Partner' THEN 1
    WHEN 'Director' THEN 2
    WHEN 'Manager' THEN 3
    WHEN 'Assistant Manager' THEN 4
    WHEN 'Senior' THEN 5
    WHEN 'Junior' THEN 6
  END;

-- Check team member role assignments
SELECT 
  pm.name,
  pm.role as current_role,
  rd.role_title as assigned_role_definition,
  mra.assignment_status,
  mra.assignment_date
FROM practice_members pm
LEFT JOIN member_role_assignments mra ON mra.practice_member_id = pm.id AND mra.assignment_status = 'active'
LEFT JOIN role_definitions rd ON rd.id = mra.role_definition_id
WHERE pm.is_test_account IS NOT TRUE
ORDER BY pm.name;

-- =====================================================
-- AFTER RUNNING THIS:
-- =====================================================
-- 1. Role Definitions will show 6 roles matching your team structure
-- 2. All team members will be auto-assigned to their corresponding role
-- 3. Individual Profiles will show role fit scores based on their actual role
-- 4. You can edit each role definition to refine responsibilities and requirements
-- =====================================================

