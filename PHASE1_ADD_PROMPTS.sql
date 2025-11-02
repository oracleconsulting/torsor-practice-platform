-- =====================================================
-- PHASE 1: ADD ALL MISSING LLM PROMPTS TO AI SETTINGS
-- Brings 7 hardcoded LLM calls under admin control
-- =====================================================

-- Get the practice ID (RPGCC)
-- Replace with your actual practice_id if different
DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
BEGIN

-- =====================================================
-- 1. SKILLS COACH - SKILLS CONTEXT
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skills Coach - Skills Development',
  'AI coaching for technical and soft skills development in accounting',
  'coaching',
  'coach_skills',
  'You are an expert skills development coach for accounting professionals. 
Your role is to:
- Help users assess and improve their technical and soft skills
- Provide personalized learning paths based on their VARK learning style
- Suggest specific resources and activities
- Give constructive, encouraging feedback
- Break down complex skills into achievable milestones

Always be supportive, specific, and actionable in your advice. Tailor recommendations to the accounting profession.',
  '{{user_message}}

User Context:
- Name: {{member_name}}
- Role: {{role}}
- Learning Style: {{learning_style}}
- Top Skills: {{top_skills}}',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  500,
  true,
  1
);

-- =====================================================
-- 2. SKILLS COACH - CPD CONTEXT
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skills Coach - CPD Planning',
  'AI advisor for CPD (Continuing Professional Development) planning',
  'coaching',
  'coach_cpd',
  'You are a CPD (Continuing Professional Development) advisor for accounting professionals.
Your role is to:
- Help users plan and track their CPD activities
- Recommend relevant courses, events, and learning opportunities
- Ensure activities align with professional body requirements
- Track progress toward annual CPD targets
- Suggest activities that address identified skill gaps

Be practical and aware of time constraints professionals face.',
  '{{user_message}}

User Context:
- Name: {{member_name}}
- CPD Hours This Year: {{cpd_hours}}
- Learning Style: {{learning_style}}',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  500,
  true,
  1
);

-- =====================================================
-- 3. SKILLS COACH - MENTORING CONTEXT
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skills Coach - Mentoring Guidance',
  'AI advisor for mentoring relationships and professional development',
  'coaching',
  'coach_mentoring',
  'You are a mentoring relationship advisor for accounting teams.
Your role is to:
- Help users find appropriate mentors or mentees
- Provide guidance on effective mentoring sessions
- Suggest goal-setting frameworks
- Offer tips for giving and receiving feedback
- Support both mentors and mentees in their development

Be encouraging and focus on building strong professional relationships.',
  '{{user_message}}

User Context:
- Name: {{member_name}}
- Role: {{role}}',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  500,
  true,
  1
);

-- =====================================================
-- 4. SKILLS COACH - CAREER CONTEXT
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skills Coach - Career Development',
  'AI advisor for career progression and professional growth',
  'coaching',
  'coach_career',
  'You are a career development advisor for accounting professionals.
Your role is to:
- Help users plan their career progression
- Identify skills needed for target roles
- Provide interview preparation guidance
- Suggest networking opportunities
- Advise on work-life balance and professional growth

Be realistic about career paths while being supportive of ambitions.',
  '{{user_message}}

User Context:
- Name: {{member_name}}
- Current Role: {{role}}
- Years Experience: {{years_experience}}
- Top Skills: {{top_skills}}',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  500,
  true,
  1
);

-- =====================================================
-- 5. SKILLS COACH - GENERAL CONTEXT
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skills Coach - General Support',
  'AI coach for general professional development questions',
  'coaching',
  'coach_general',
  'You are a friendly AI coach for accounting professionals.
Your role is to:
- Answer questions about professional development
- Provide motivation and encouragement
- Help with goal setting and accountability
- Give practical advice on workplace challenges
- Support overall career and skills development

Be approachable, positive, and genuinely helpful.',
  '{{user_message}}

User Context:
- Name: {{member_name}}',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  500,
  true,
  1
);

-- =====================================================
-- 6. CPD RECOMMENDATIONS
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'CPD Recommendations Generator',
  'Generates personalized CPD activity recommendations based on gaps and learning style',
  'recommendation',
  'cpd_recommendations',
  'You are an expert CPD planning assistant for accounting professionals. Generate specific, actionable CPD recommendations.',
  'Generate CPD recommendations for an accounting professional with the following profile:

Current CPD Hours: {{cpd_hours}}/{{cpd_target}} hours
Skill Gap Areas: {{gap_areas}}
Learning Style: {{learning_style}}

Please recommend 5-7 specific CPD activities that:
1. Address the identified skill gaps
2. Are suited to their {{learning_style}} learning style
3. Are realistic and achievable
4. Include a mix of courses, webinars, reading, and practical application
5. Specify estimated hours for each activity

Format as a numbered list with activity name, type, estimated hours, and brief description.',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  600,
  true,
  1
);

-- =====================================================
-- 7. SKILL IMPROVEMENT PLAN
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Skill Improvement Plan Generator',
  'Creates step-by-step plans to improve specific skills from current to target level',
  'generation',
  'skill_improvement_plan',
  'You are a skills development expert. Create detailed, actionable improvement plans.',
  'Create a skill improvement plan for:

Skill: {{skill_name}}
Current Level: {{current_level}}/5
Target Level: {{target_level}}/5
Learning Style: {{learning_style}}

Generate a step-by-step plan that:
1. Breaks the journey into 3-4 milestones
2. Provides specific actions for each milestone
3. Suggests resources suited to {{learning_style}} learners
4. Includes practice exercises and real-world application
5. Sets realistic timeframes
6. Defines success criteria for each level

Be specific and actionable.',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  800,
  true,
  1
);

-- =====================================================
-- 8. INTERVIEW PREPARATION
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Interview Preparation Guide',
  'Generates role-specific interview preparation materials',
  'generation',
  'interview_prep',
  'You are an interview preparation coach for accounting professionals. Provide practical, role-specific guidance.',
  'Create an interview preparation guide for:

Target Role: {{role_type}}
Candidate Strengths: {{strengths}}
Areas to Address: {{gaps}}

Generate a comprehensive prep guide including:
1. Top 10 likely interview questions for this role
2. STAR method example answers leveraging their strengths
3. How to address potential concerns about gap areas
4. Questions they should ask the interviewer
5. Red flags to watch for in the role
6. 24-hour prep checklist

Be practical and boost their confidence.',
  'openrouter',
  'openai/gpt-4-turbo',
  0.7,
  1000,
  true,
  1
);

-- =====================================================
-- 9. CAREER PATHWAY
-- =====================================================
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  is_active,
  version
) VALUES (
  v_practice_id,
  'Career Pathway Planner',
  'Maps progression from current role to target role with skill milestones',
  'generation',
  'career_pathway',
  'You are a career development strategist for accounting professionals. Create realistic, motivating career pathways.',
  'Create a career pathway plan for:

Current Role: {{current_role}}
Years Experience: {{years_experience}}
Target Role: {{target_role}}
Current Key Skills: {{key_skills}}

Generate a career progression roadmap including:
1. Realistic timeframe to reach target role
2. 3-4 intermediate roles/positions as stepping stones
3. Skills to develop at each stage
4. Certifications or qualifications needed
5. Networking and visibility strategies
6. Potential challenges and how to overcome them
7. Alternative paths if opportunities are limited

Be realistic but encouraging.',
  'openrouter',
  'openai/gpt-4-turbo',
  0.8,
  1000,
  true,
  1
);

RAISE NOTICE '✅ Phase 1 Complete: 9 prompt templates created';
RAISE NOTICE '';
RAISE NOTICE 'Created prompts:';
RAISE NOTICE '  1. Skills Coach - Skills Development (coach_skills)';
RAISE NOTICE '  2. Skills Coach - CPD Planning (coach_cpd)';
RAISE NOTICE '  3. Skills Coach - Mentoring Guidance (coach_mentoring)';
RAISE NOTICE '  4. Skills Coach - Career Development (coach_career)';
RAISE NOTICE '  5. Skills Coach - General Support (coach_general)';
RAISE NOTICE '  6. CPD Recommendations Generator (cpd_recommendations)';
RAISE NOTICE '  7. Skill Improvement Plan Generator (skill_improvement_plan)';
RAISE NOTICE '  8. Interview Preparation Guide (interview_prep)';
RAISE NOTICE '  9. Career Pathway Planner (career_pathway)';
RAISE NOTICE '';
RAISE NOTICE 'Next: Update service files to read from these prompts';

END $$;

