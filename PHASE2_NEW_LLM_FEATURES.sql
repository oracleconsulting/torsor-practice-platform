-- =====================================================
-- PHASE 2: ADD 5 NEW LLM-POWERED FEATURES
-- High-value AI integrations for team management
-- =====================================================

-- Get the practice ID (RPGCC)
-- Replace with your actual practice_id if different
DO $$
DECLARE
  v_practice_id UUID := 'a1b2c3d4-5678-90ab-cdef-123456789abc';
  v_count INTEGER;
BEGIN

RAISE NOTICE 'Starting Phase 2 LLM features migration...';
RAISE NOTICE '';

-- =====================================================
-- 1. GAP ANALYSIS AI INSIGHTS
-- =====================================================
SELECT COUNT(*) INTO v_count FROM ai_prompts WHERE prompt_key = 'gap_analysis_insights' AND practice_id = v_practice_id;
IF v_count = 0 THEN
  INSERT INTO ai_prompts (
    practice_id, name, description, category, prompt_key,
    system_prompt, user_prompt_template, model_provider, model_name,
    temperature, max_tokens, is_active, version
  ) VALUES (
    v_practice_id,
    'Gap Analysis AI Insights',
    'Generates actionable insights from skill gap data across the team',
    'analysis',
    'gap_analysis_insights',
    'You are a workforce development strategist for accounting practices.
Your role is to:
- Analyze skill gap data across team members
- Identify critical gaps affecting service delivery
- Prioritize training investments for maximum impact
- Suggest team restructuring or hiring needs
- Recommend upskilling pathways

Provide strategic, data-driven recommendations that balance individual growth with practice needs.',
    'Analyze the following skill gap data for our accounting practice:

Total Team Members: {{team_size}}
Average Skill Level: {{avg_skill_level}}/5

TOP SKILL GAPS (by frequency):
{{gap_list}}

CRITICAL GAPS (affecting service delivery):
{{critical_gaps}}

SERVICE LINE COVERAGE:
{{service_line_coverage}}

Please provide:
1. Summary of the most critical gaps
2. Impact on service delivery and growth
3. Recommended training priorities (top 5)
4. Suggested team restructuring or hiring needs
5. Quick wins vs. long-term development areas
6. Estimated timeline and resource requirements

Be specific and actionable.',
    'openrouter', 'openai/gpt-4-turbo', 0.7, 1200, true, 1
  );
  RAISE NOTICE '✅ Created: gap_analysis_insights';
ELSE
  RAISE NOTICE '⏭️  Skipped: gap_analysis_insights (already exists)';
END IF;

-- =====================================================
-- 2. TEAM COMPOSITION ANALYSIS
-- =====================================================
SELECT COUNT(*) INTO v_count FROM ai_prompts WHERE prompt_key = 'team_composition_analysis' AND practice_id = v_practice_id;
IF v_count = 0 THEN
  INSERT INTO ai_prompts (
    practice_id, name, description, category, prompt_key,
    system_prompt, user_prompt_template, model_provider, model_name,
    temperature, max_tokens, is_active, version
  ) VALUES (
    v_practice_id,
    'Team Composition Analysis',
    'Analyzes team dynamics and suggests optimal team configurations',
    'analysis',
    'team_composition_analysis',
    'You are an organizational psychology expert specializing in accounting teams.
Your role is to:
- Analyze team composition using personality and working style data
- Identify complementary vs. conflicting dynamics
- Suggest optimal team configurations for projects
- Highlight potential collaboration friction points
- Recommend team-building interventions

Balance analytical rigor with practical, people-first recommendations.',
    'Analyze our accounting practice team composition:

Team Size: {{team_size}} members

PERSONALITY DISTRIBUTION (OCEAN):
{{personality_distribution}}

WORKING STYLES:
{{working_styles}}

COMMUNICATION PREFERENCES:
{{communication_preferences}}

LEARNING STYLES (VARK):
{{learning_styles}}

TEAM ROLES (Belbin):
{{belbin_roles}}

CONFLICT STYLES:
{{conflict_styles}}

Please provide:
1. Overall team dynamics assessment
2. Natural collaborators (high compatibility pairs/groups)
3. Potential friction points to manage
4. Gaps in team coverage (missing roles/styles)
5. Suggestions for optimal project team configurations
6. Team-building recommendations
7. Leadership distribution assessment

Consider both strengths and areas for intervention.',
    'openrouter', 'openai/gpt-4-turbo', 0.7, 1500, true, 1
  );
  RAISE NOTICE '✅ Created: team_composition_analysis';
ELSE
  RAISE NOTICE '⏭️  Skipped: team_composition_analysis (already exists)';
END IF;

-- =====================================================
-- 3. SERVICE LINE DEPLOYMENT STRATEGY
-- =====================================================
SELECT COUNT(*) INTO v_count FROM ai_prompts WHERE prompt_key = 'service_line_deployment' AND practice_id = v_practice_id;
IF v_count = 0 THEN
  INSERT INTO ai_prompts (
    practice_id, name, description, category, prompt_key,
    system_prompt, user_prompt_template, model_provider, model_name,
    temperature, max_tokens, is_active, version
  ) VALUES (
    v_practice_id,
    'Service Line Deployment Strategy',
    'Generates deployment strategies for service lines based on team capacity and interest',
    'generation',
    'service_line_deployment',
    'You are a strategic advisor for accounting practice growth.
Your role is to:
- Analyze team capacity vs. service line demand
- Match team member interests and skills to service opportunities
- Identify service lines ready for market vs. needing development
- Recommend service line prioritization
- Suggest marketing and pricing strategies

Balance growth ambitions with realistic capacity and skill assessments.',
    'Create a service line deployment strategy for our practice:

TEAM CAPACITY:
Total Team: {{team_size}} members
Average Experience: {{avg_experience}} years
Combined CPD Hours This Year: {{total_cpd_hours}}

SERVICE LINE INTERESTS (by member ranking):
{{service_line_rankings}}

CURRENT SKILL LEVELS (relevant to each service):
{{service_skill_matrix}}

MARKET DEMAND (from client inquiries):
{{market_demand}}

Please provide:
1. Service lines ready to launch NOW (Green Light)
2. Service lines needing 3-6 months development (Amber)
3. Service lines for 12+ month roadmap (Red)
4. Recommended team assignments for each service line
5. Critical skill gaps to address before launch
6. Suggested pricing strategy for each service
7. Marketing messaging based on team strengths
8. Risk assessment and mitigation strategies

Prioritize revenue potential vs. development effort.',
    'openrouter', 'openai/gpt-4-turbo', 0.8, 1800, true, 1
  );
  RAISE NOTICE '✅ Created: service_line_deployment';
ELSE
  RAISE NOTICE '⏭️  Skipped: service_line_deployment (already exists)';
END IF;

-- =====================================================
-- 4. TRAINING RECOMMENDATIONS NARRATIVE
-- =====================================================
SELECT COUNT(*) INTO v_count FROM ai_prompts WHERE prompt_key = 'training_narrative' AND practice_id = v_practice_id;
IF v_count = 0 THEN
  INSERT INTO ai_prompts (
    practice_id, name, description, category, prompt_key,
    system_prompt, user_prompt_template, model_provider, model_name,
    temperature, max_tokens, is_active, version
  ) VALUES (
    v_practice_id,
    'Training Recommendations Narrative',
    'Generates personalized, narrative training recommendations instead of just lists',
    'recommendation',
    'training_narrative',
    'You are a personalized learning advisor for accounting professionals.
Your role is to:
- Create engaging, motivational training narratives
- Explain WHY each recommendation matters
- Connect training to career goals and practice needs
- Provide realistic timelines and commitment estimates
- Celebrate progress and maintain momentum

Write in a friendly, encouraging tone that inspires action.',
    'Create a personalized training plan narrative for this team member:

PROFILE:
Name: {{member_name}}
Role: {{role}}
Years Experience: {{years_experience}}
Learning Style: {{learning_style}}

CURRENT SKILLS:
Strengths: {{top_skills}}
Gap Areas: {{gap_areas}}

CAREER GOALS:
{{career_goals}}

PRACTICE NEEDS:
{{practice_needs}}

RECENT ACTIVITY:
CPD Hours This Year: {{cpd_hours}}/{{cpd_target}}
Last Assessment: {{last_assessment_date}}
Recent Completions: {{recent_completions}}

Generate a motivational training plan that:
1. Opens with acknowledgment of their strengths and progress
2. Explains WHY specific training areas matter to THEM
3. Recommends 5-7 specific training activities with:
   - Activity name and provider
   - Why it fits their learning style
   - How it advances their career goals
   - How it helps the practice
   - Estimated time commitment
   - Suggested timeline
4. Includes a mix of quick wins and deeper learning
5. Ends with encouragement and a clear first step

Make it personal, achievable, and inspiring!',
    'openrouter', 'openai/gpt-4-turbo', 0.8, 1500, true, 1
  );
  RAISE NOTICE '✅ Created: training_narrative';
ELSE
  RAISE NOTICE '⏭️  Skipped: training_narrative (already exists)';
END IF;

-- =====================================================
-- 5. ASSESSMENT RESULT SYNTHESIS
-- =====================================================
SELECT COUNT(*) INTO v_count FROM ai_prompts WHERE prompt_key = 'assessment_synthesis' AND practice_id = v_practice_id;
IF v_count = 0 THEN
  INSERT INTO ai_prompts (
    practice_id, name, description, category, prompt_key,
    system_prompt, user_prompt_template, model_provider, model_name,
    temperature, max_tokens, is_active, version
  ) VALUES (
    v_practice_id,
    'Assessment Result Synthesis',
    'Creates holistic insights from multiple assessment results',
    'generation',
    'assessment_synthesis',
    'You are a professional development coach specializing in holistic assessment interpretation.
Your role is to:
- Synthesize insights across multiple assessment types
- Identify patterns and themes
- Highlight potential contradictions or tensions
- Provide actionable self-awareness insights
- Suggest areas for personal development

Write in a supportive, insightful tone that helps people understand themselves better.',
    'Synthesize assessment results for this team member:

ASSESSMENT COMPLETION:
{{assessment_completion_status}}

VARK LEARNING STYLE:
Primary: {{vark_primary}}
Secondary: {{vark_secondary}}
{{vark_insights}}

OCEAN PERSONALITY:
{{ocean_profile}}
Work Style: {{ocean_work_style}}

WORKING PREFERENCES:
Environment: {{work_environment}}
Communication: {{communication_style}}
{{work_preferences_insights}}

BELBIN TEAM ROLE:
Primary: {{belbin_primary}}
Secondary: {{belbin_secondary}}

MOTIVATIONAL DRIVERS:
Top Drivers: {{motivational_drivers}}

EMOTIONAL INTELLIGENCE:
Overall Score: {{eq_score}}
{{eq_breakdown}}

CONFLICT STYLE:
{{conflict_style}}

SERVICE LINE INTERESTS:
{{service_line_interests}}

Please provide:
1. Holistic Profile Summary (2-3 paragraphs)
2. Key Themes and Patterns across assessments
3. Natural Strengths to leverage
4. Potential Internal Tensions or Contradictions
5. Optimal Working Conditions for this person
6. Development Areas for personal growth
7. How to work effectively WITH this person (for managers/colleagues)
8. Career Path Alignment insights

Make connections across assessments and provide deep insights.',
    'openrouter', 'openai/gpt-4-turbo', 0.7, 2000, true, 1
  );
  RAISE NOTICE '✅ Created: assessment_synthesis';
ELSE
  RAISE NOTICE '⏭️  Skipped: assessment_synthesis (already exists)';
END IF;

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'Phase 2 Migration Complete!';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE 'NEW FEATURES ADDED:';
RAISE NOTICE '✅ Gap Analysis AI Insights';
RAISE NOTICE '✅ Team Composition Analysis';
RAISE NOTICE '✅ Service Line Deployment Strategy';
RAISE NOTICE '✅ Training Recommendations Narrative';
RAISE NOTICE '✅ Assessment Result Synthesis';
RAISE NOTICE '';
RAISE NOTICE 'These prompts are now in AI Settings!';
RAISE NOTICE 'Next: Implement service layer functions to call them.';

END $$;

