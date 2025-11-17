-- =====================================================
-- SETUP AI PROMPTS - FINAL FIX
-- Works with existing ai_prompts table structure
-- (No updated_at column)
-- =====================================================

-- Insert team composition prompt
INSERT INTO ai_prompts (
  prompt_key,
  model_name,
  system_prompt,
  user_prompt_template,
  temperature,
  max_tokens,
  is_active
)
VALUES (
  'team_composition_analysis',
  'openai/gpt-4-turbo',
  'You are an organizational psychology expert specializing in accounting teams. Analyze team composition, dynamics, and provide actionable insights for optimal performance.',
  'Analyze our accounting practice team composition:

Team Size: {{team_size}} members
Team Roles: {{team_roles}}

PERSONALITY DISTRIBUTION (OCEAN):
{{ocean_details}}

WORKING PREFERENCES:
{{working_prefs}}

BELBIN TEAM ROLES:
{{belbin_roles}}

VARK LEARNING STYLES:
{{vark_styles}}

EQ SCORES:
{{eq_scores}}

MOTIVATIONAL DRIVERS:
{{motivational_drivers}}

CONFLICT STYLES:
{{conflict_styles}}

TOP SKILLS BY CATEGORY:
{{top_skills}}

SERVICE LINE INTERESTS:
{{service_line_interests}}

Provide comprehensive analysis covering:
1. Overall team dynamics assessment
2. Natural collaborators (high compatibility pairs/groups)
3. Potential friction points to manage
4. Gaps in team coverage (missing roles/styles)
5. Suggestions for optimal project team configurations
6. Team-building recommendations
7. Leadership distribution assessment',
  0.7,
  2000,
  true
)
ON CONFLICT (prompt_key) 
DO UPDATE SET
  user_prompt_template = EXCLUDED.user_prompt_template;

-- Insert gap analysis prompt
INSERT INTO ai_prompts (
  prompt_key,
  model_name,
  system_prompt,
  user_prompt_template,
  temperature,
  max_tokens,
  is_active
)
VALUES (
  'gap_analysis_insights',
  'openai/gpt-4-turbo',
  'You are a skills development specialist for accounting practices. Analyze skill gaps and provide strategic recommendations for training and development.',
  'Analyze our team skill gaps:

Team Size: {{team_size}} members
Average Skill Level: {{avg_skill_level}}/5
Average EQ: {{avg_eq}}/100

CRITICAL SKILL GAPS:
{{skill_gaps}}

BELBIN ROLE GAPS:
{{belbin_gaps}}

DOMINANT MOTIVATIONAL DRIVER: {{dominant_driver}}

SERVICE LINE COVERAGE:
{{service_line_coverage}}

Provide analysis covering:
1. Summary of the most critical gaps
2. Impact on service delivery and growth
3. Recommended training priorities (top 5)
4. Suggested team restructuring or hiring needs
5. Quick wins vs. long-term development areas
6. Estimated timeline and resource requirements',
  0.7,
  2000,
  true
)
ON CONFLICT (prompt_key)
DO UPDATE SET
  user_prompt_template = EXCLUDED.user_prompt_template;

-- Verify
SELECT prompt_key, is_active, created_at
FROM ai_prompts
WHERE prompt_key IN ('team_composition_analysis', 'gap_analysis_insights');

SELECT '✅ AI prompts created/updated successfully!' as status;

