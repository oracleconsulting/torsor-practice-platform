-- Update Assessment Synthesis Prompt to Address Employee Directly
-- And improve formatting structure

DO $$
DECLARE
  v_practice_id UUID;
BEGIN
  -- Get the practice ID (assumes single practice for now)
  SELECT id INTO v_practice_id FROM practices LIMIT 1;
  
  IF v_practice_id IS NULL THEN
    RAISE NOTICE '❌ No practice found. Please create a practice first.';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Updating assessment_synthesis prompt...';
  
  -- Update the prompt to address the employee directly
  UPDATE ai_prompts
  SET 
    system_prompt = 'You are a professional development coach specializing in holistic assessment interpretation.
Your role is to:
- Synthesize insights across multiple assessment types
- Identify patterns and themes
- Highlight potential contradictions or tensions
- Provide actionable self-awareness insights
- Suggest areas for personal development

Write in a supportive, insightful, direct tone that addresses the person reading it.
Use "you" and "your" throughout - this is FOR them, not ABOUT them.
Use proper Markdown formatting with # for major headings and ** for bold text.',
    
    user_prompt_template = 'Create a comprehensive personal development synthesis for the person reading this report.

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

Please provide a personal, direct synthesis with these sections:

# 1. Your Holistic Profile Summary
Write 2-3 paragraphs directly to the person, starting with "You exhibit..." or "Your profile reveals..."

# 2. Key Themes and Patterns Across Your Assessments
Identify and explain the key themes YOU should understand about yourself.

# 3. Your Natural Strengths to Leverage
List and describe YOUR top strengths with specific examples of how YOU can use them.

# 4. Potential Internal Tensions or Contradictions
Help YOU understand any internal conflicts or contradictions in YOUR preferences/traits.

# 5. Your Optimal Working Conditions
Describe the conditions where YOU thrive best.

# 6. Development Areas for Your Personal Growth
Suggest specific areas where YOU might focus YOUR development efforts.

# 7. How to Work Effectively WITH You (for Managers/Colleagues)
Provide guidance for others on how to work effectively with YOU.

# 8. Your Career Path Alignment Insights
Based on YOUR skills and interests, suggest career directions that align with YOUR profile.

Write in second person ("you", "your") throughout. Be supportive, insightful, and actionable.
Make meaningful connections across assessments and provide deep, personalized insights.',
    
    version = version + 1,
    updated_at = NOW()
  WHERE 
    prompt_key = 'assessment_synthesis'
    AND practice_id = v_practice_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Updated assessment_synthesis prompt to address employee directly';
    RAISE NOTICE '✅ Added proper Markdown formatting instructions';
  ELSE
    RAISE NOTICE '❌ assessment_synthesis prompt not found for practice';
  END IF;
  
END $$;

