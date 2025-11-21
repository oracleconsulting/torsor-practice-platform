-- =====================================================
-- AI Settings & Profile Generation Schema
-- =====================================================

-- Table: ai_prompts
-- Stores all LLM prompts used in the application
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Prompt metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'assessment', 'recommendation', 'analysis', 'generation'
  prompt_key VARCHAR(100) NOT NULL UNIQUE, -- unique identifier for code reference
  
  -- Prompt content
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL, -- with {{placeholders}}
  
  -- Model configuration
  model_provider VARCHAR(50) NOT NULL DEFAULT 'openrouter', -- 'openrouter', 'openai', 'anthropic'
  model_name VARCHAR(255) NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id),
  updated_by UUID REFERENCES practice_members(id)
);

-- Table: ai_prompt_history
-- Version history for prompt changes
CREATE TABLE IF NOT EXISTS ai_prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES ai_prompts(id) ON DELETE CASCADE,
  
  -- Historical snapshot
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model_provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  version INTEGER NOT NULL,
  
  -- Change metadata
  change_note TEXT,
  changed_by UUID REFERENCES practice_members(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: generated_profiles
-- Stores AI-generated comprehensive professional profiles
CREATE TABLE IF NOT EXISTS generated_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Profile content
  narrative TEXT NOT NULL,
  professional_fingerprint JSONB NOT NULL, -- structured insights
  optimal_environment TEXT,
  unique_value_proposition TEXT,
  synergies TEXT[],
  creative_tensions TEXT[],
  growth_recommendations TEXT[],
  
  -- Source data snapshot
  working_preferences JSONB,
  belbin_roles JSONB,
  motivational_drivers JSONB,
  eq_levels JSONB,
  conflict_style JSONB,
  
  -- Generation metadata
  prompt_id UUID REFERENCES ai_prompts(id),
  model_used VARCHAR(255),
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  
  -- Status
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  -- Audit
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES practice_members(id)
);

-- Table: ai_api_keys
-- Securely stores API keys for AI services
CREATE TABLE IF NOT EXISTS ai_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- API key details
  provider VARCHAR(50) NOT NULL, -- 'openrouter', 'openai', 'anthropic'
  encrypted_key TEXT NOT NULL, -- encrypted API key
  key_name VARCHAR(255),
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_ai_prompts_practice ON ai_prompts(practice_id);
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_prompt_history_prompt ON ai_prompt_history(prompt_id);
CREATE INDEX idx_generated_profiles_member ON generated_profiles(practice_member_id);
CREATE INDEX idx_generated_profiles_current ON generated_profiles(is_current) WHERE is_current = true;
CREATE INDEX idx_ai_api_keys_practice ON ai_api_keys(practice_id);

-- =====================================================
-- Triggers
-- =====================================================

-- Update timestamp trigger for ai_prompts
CREATE OR REPLACE FUNCTION update_ai_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompts_updated_at();

-- Archive old prompt versions to history
CREATE OR REPLACE FUNCTION archive_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only archive if content actually changed
  IF (OLD.system_prompt != NEW.system_prompt OR 
      OLD.user_prompt_template != NEW.user_prompt_template OR
      OLD.model_provider != NEW.model_provider OR
      OLD.model_name != NEW.model_name) THEN
    
    INSERT INTO ai_prompt_history (
      prompt_id,
      system_prompt,
      user_prompt_template,
      model_provider,
      model_name,
      temperature,
      max_tokens,
      version,
      changed_by
    ) VALUES (
      OLD.id,
      OLD.system_prompt,
      OLD.user_prompt_template,
      OLD.model_provider,
      OLD.model_name,
      OLD.temperature,
      OLD.max_tokens,
      OLD.version,
      NEW.updated_by
    );
    
    -- Increment version
    NEW.version = OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_prompt_version
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION archive_prompt_version();

-- Mark old profiles as not current when new one is generated
CREATE OR REPLACE FUNCTION mark_old_profiles_not_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous profiles for this member as not current
  UPDATE generated_profiles
  SET is_current = false
  WHERE practice_member_id = NEW.practice_member_id
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_old_profiles_not_current
  AFTER INSERT ON generated_profiles
  FOR EACH ROW
  EXECUTE FUNCTION mark_old_profiles_not_current();

-- =====================================================
-- Seed Default Prompts
-- =====================================================

-- Insert default synthesis prompt for RPGCC practice
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_name,
  temperature
) VALUES (
  'a1b2c3d4-5678-90ab-cdef-123456789abc', -- RPGCC practice ID
  'Professional Profile Synthesis',
  'Generates a unified narrative from all five assessment results',
  'generation',
  'profile_synthesis',
  'You are an expert professional development consultant who creates deeply insightful, personalized career profiles. Your goal is to synthesize multiple assessment results into a cohesive narrative that helps professionals understand their unique strengths and optimal working conditions.

Your writing style:
- Warm and conversational, never clinical
- Uses "you" language to create recognition
- Celebrates uniqueness rather than comparing to norms
- Acknowledges complexity and contradictions
- Provides actionable insights
- Avoids jargon and corporate speak

Frame insights as identity-level recognition: "You''re someone who..." rather than "Your assessment shows..."',
  'Given this professional''s assessment profile:

**Working Preferences:**
- Communication Style: {{communication_style}}
- Work Style: {{work_style}}
- Environment: {{environment}}
- Time Management: {{time_management}}
- Feedback Preference: {{feedback_preference}}
- Collaboration: {{collaboration_preference}}

**Belbin Team Roles:**
- Primary Role: {{primary_role}}
- Secondary Role: {{secondary_role}}
- Tertiary Role: {{tertiary_role}}

**Motivational Drivers:**
- Primary Driver: {{primary_driver}}
- Secondary Driver: {{secondary_driver}}
- Driver Scores: {{driver_scores}}

**Emotional Intelligence:**
- Self-Awareness: {{self_awareness_score}}/100
- Self-Management: {{self_management_score}}/100
- Social Awareness: {{social_awareness_score}}/100
- Relationship Management: {{relationship_management_score}}/100
- Overall EQ: {{overall_eq}}/100 ({{eq_level}})

**Conflict Style:**
- Primary Style: {{primary_style}}
- Secondary Style: {{secondary_style}}

Create a unified narrative that:
1. Identifies the unique pattern that emerges from this combination
2. Highlights potential synergies between different aspects
3. Acknowledges creative tensions that might need managing
4. Suggests optimal working conditions and roles
5. Provides specific strategies for leveraging strengths
6. Offers growth recommendations that honour their natural style

Structure your response as:

# Your Professional Fingerprint

[A compelling 2-3 paragraph narrative that synthesizes all five dimensions into their unique professional identity]

## You Thrive When...

[3-4 specific environmental and situational conditions where they excel]

## Others Value You For...

[3-4 specific contributions they uniquely bring to teams]

## Your Superpowers in Action

[2-3 examples of how their combination of traits creates distinctive value]

## Creative Tensions to Navigate

[2-3 areas where different aspects of their profile might pull in different directions, framed as dynamic range rather than conflict]

## Growth Opportunities

[3-4 development suggestions that honour their natural style rather than trying to change them]

## Your Optimal Role Profile

[Description of the types of roles, teams, and projects where they''d be most fulfilled and effective]

Keep the tone warm, insightful, and celebratory. Make them feel truly seen.',
  'anthropic/claude-3.5-sonnet',
  0.7
);

-- Add recommendation generation prompt
INSERT INTO ai_prompts (
  practice_id,
  name,
  description,
  category,
  prompt_key,
  system_prompt,
  user_prompt_template,
  model_name,
  temperature
) VALUES (
  'a1b2c3d4-5678-90ab-cdef-123456789abc',
  'CPD Recommendation Generator',
  'Generates personalized CPD recommendations based on skills gaps and learning style',
  'recommendation',
  'cpd_recommendations',
  'You are a professional development specialist who creates highly personalized CPD recommendations. You understand that effective development happens when recommendations align with both skill needs and learning preferences.',
  'Generate 5 CPD recommendations for this team member:

**Skill Gaps:**
{{skill_gaps}}

**Learning Style (VARK):**
{{vark_profile}}

**Work Preferences:**
{{work_preferences}}

**Current Role:** {{role}}

For each recommendation, provide:
1. Activity title
2. Specific learning outcomes
3. Why it fits their learning style
4. Estimated time investment
5. Resource links (if applicable)

Make recommendations practical and immediately actionable.',
  'anthropic/claude-3.5-sonnet',
  0.8
);

COMMENT ON TABLE ai_prompts IS 'Stores all LLM prompts used throughout the application with version control';
COMMENT ON TABLE generated_profiles IS 'AI-generated comprehensive professional profiles for team members';
COMMENT ON TABLE ai_api_keys IS 'Encrypted storage for AI service API keys';

