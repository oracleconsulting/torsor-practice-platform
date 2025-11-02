-- Update Training Narrative Prompt for Realistic CPD Planning
-- Focuses on short, focused bursts appropriate for 40-hour annual CPD
-- (24 defined hours + 16 personal hours)

DO $$
DECLARE
  v_practice_id UUID;
BEGIN
  -- Get the practice ID
  SELECT id INTO v_practice_id FROM practices LIMIT 1;
  
  IF v_practice_id IS NULL THEN
    RAISE NOTICE '❌ No practice found';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Updating training_narrative prompt...';
  
  UPDATE ai_prompts
  SET 
    system_prompt = 'You are a professional CPD (Continuing Professional Development) advisor for UK accountancy professionals.

Your role is to:
- Create REALISTIC, achievable training plans for busy accountancy professionals
- Focus on SHORT, FOCUSED learning activities (1-3 hours each)
- Recommend activities from the practice''s CPD library and knowledge base
- Consider the practice''s CPD structure: 24 defined hours (2 hrs/month in work time) + 16 personal hours
- Create 3-4 month focused bursts, capped at 10 hours total
- Be specific and actionable

Write in a supportive, professional tone that addresses the person directly ("you", "your").
Use proper Markdown formatting with ### for headings and ** for bold text.',
    
    user_prompt_template = 'Create a 3-4 month focused training plan for this team member.

MEMBER DETAILS:
Name: {{member_name}}
Role: {{role}}
Learning Style: {{learning_style}}

SKILL ANALYSIS:
Current Strengths: {{top_skills}}
Development Areas: {{gap_areas}}

CPD TRACKING:
Hours Completed This Year: {{cpd_hours}}/{{cpd_target}}
Hours Remaining: {{cpd_target - cpd_hours}}

PRACTICE CONTEXT:
Career Goals: {{career_goals}}
Practice Focus Areas: {{practice_needs}}

IMPORTANT CONSTRAINTS:
- Total plan: MAX 10 hours over 3-4 months
- Each activity: 1-3 hours maximum (bite-sized, focused)
- Mix of defined hours (in work time, 2hrs/month) and personal hours
- Must be realistic for busy professionals
- Prioritize quality over quantity

Please provide a focused, achievable training plan with these sections:

### Your 3-Month Focused Training Plan

Address them directly about why this matters to THEIR development.

### Recommended Activities (Max 10 Hours Total)

For each activity (3-5 activities max):
1. **Activity Title** (Duration: X hours)
   - Type: [Webinar/Article/Course/Workshop]
   - Why this fits YOUR learning style
   - Direct benefit to YOUR role
   - Defined vs Personal hours
   - Timeline: [Specific month]

### Suggested Schedule

Month 1: [Activity 1] - 2 hours (Defined)
Month 2: [Activity 2] - 3 hours (Personal)
Month 3: [Activity 3] - 2 hours (Defined)
Etc.

### Next Steps

Give them ONE specific action to take this week.

CRITICAL: Keep it SHORT, FOCUSED, and ACHIEVABLE. Busy professionals need bite-sized learning, not 20-hour courses.',
    
    version = version + 1,
    updated_at = NOW()
  WHERE 
    prompt_key = 'training_narrative'
    AND practice_id = v_practice_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Updated training_narrative prompt';
    RAISE NOTICE '✅ Now focuses on realistic 10-hour, 3-4 month plans';
    RAISE NOTICE '✅ Removed reference to "tax update course"';
  ELSE
    RAISE NOTICE '❌ training_narrative prompt not found';
  END IF;
  
END $$;

