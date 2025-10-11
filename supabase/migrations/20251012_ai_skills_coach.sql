-- =====================================================
-- AI Skills Coach System Migration
-- =====================================================
-- Creates tables and functions for the AI coaching system
-- Tracks conversations, messages, preferences, and analytics

-- =====================================================
-- 1. AI Coach Conversations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  title TEXT,
  context_type TEXT, -- 'skills', 'cpd', 'mentoring', 'career', 'general'
  context_id UUID, -- Reference to skill_id, cpd_id, etc.
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  satisfaction_score INTEGER, -- 1-5 rating
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_conversations_member ON ai_coach_conversations(member_id);
CREATE INDEX idx_coach_conversations_active ON ai_coach_conversations(is_active);
CREATE INDEX idx_coach_conversations_context ON ai_coach_conversations(context_type, context_id);

-- =====================================================
-- 2. AI Coach Messages Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_coach_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT DEFAULT 'gpt-4',
  helpful BOOLEAN, -- User feedback on message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_messages_conversation ON ai_coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_created ON ai_coach_messages(created_at);

-- =====================================================
-- 3. AI Coach User Preferences Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID UNIQUE NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  communication_style TEXT DEFAULT 'balanced', -- 'formal', 'casual', 'balanced', 'motivational'
  coaching_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  notification_enabled BOOLEAN DEFAULT true,
  voice_input_enabled BOOLEAN DEFAULT false,
  proactive_suggestions BOOLEAN DEFAULT true,
  topics_of_interest TEXT[], -- Array of topics user is interested in
  preferred_learning_format TEXT, -- From VARK assessment
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_preferences_member ON ai_coach_user_preferences(member_id);

-- =====================================================
-- 4. AI Coach Analytics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_coach_conversations(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL, -- 'question_asked', 'suggestion_followed', 'goal_achieved', 'skill_improved'
  metric_value JSONB, -- Flexible storage for different metrics
  impact_score DECIMAL(3,2), -- 0-1 score of effectiveness
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_analytics_member ON ai_coach_analytics(member_id);
CREATE INDEX idx_coach_analytics_type ON ai_coach_analytics(metric_type);
CREATE INDEX idx_coach_analytics_recorded ON ai_coach_analytics(recorded_at);

-- =====================================================
-- 5. AI Coach Rate Limits Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 100,
  UNIQUE(member_id, date)
);

CREATE INDEX idx_coach_rate_limits_member ON ai_coach_rate_limits(member_id, date);

-- =====================================================
-- 6. Coaching Templates Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL, -- 'skill_improvement', 'interview_prep', 'career_pathway', 'cpd_recommendation'
  template_name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB, -- Template variables
  use_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2), -- 0-1 score
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_templates_type ON ai_coach_templates(template_type);
CREATE INDEX idx_coach_templates_active ON ai_coach_templates(is_active);

-- =====================================================
-- 7. Functions
-- =====================================================

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_coach_conversations
  SET last_message_at = NEW.created_at,
      message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation
DROP TRIGGER IF EXISTS trigger_update_conversation ON ai_coach_messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON ai_coach_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_member_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_limit RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_limit
  FROM ai_coach_rate_limits
  WHERE member_id = p_member_id AND date = p_date;
  
  IF NOT FOUND THEN
    INSERT INTO ai_coach_rate_limits (member_id, date, message_count, tokens_used)
    VALUES (p_member_id, p_date, 0, 0);
    
    v_result := jsonb_build_object(
      'allowed', true,
      'remaining', 100,
      'message_count', 0
    );
  ELSE
    v_result := jsonb_build_object(
      'allowed', v_limit.message_count < v_limit.daily_limit,
      'remaining', v_limit.daily_limit - v_limit.message_count,
      'message_count', v_limit.message_count
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment rate limit
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_member_id UUID,
  p_tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_coach_rate_limits (member_id, date, message_count, tokens_used)
  VALUES (p_member_id, CURRENT_DATE, 1, p_tokens)
  ON CONFLICT (member_id, date)
  DO UPDATE SET
    message_count = ai_coach_rate_limits.message_count + 1,
    tokens_used = ai_coach_rate_limits.tokens_used + p_tokens;
END;
$$ LANGUAGE plpgsql;

-- Function to get coaching analytics
CREATE OR REPLACE FUNCTION get_coaching_analytics(
  p_member_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_conversation_count INTEGER;
  v_message_count INTEGER;
  v_avg_satisfaction DECIMAL;
  v_top_topics JSONB;
BEGIN
  SELECT COUNT(DISTINCT id) INTO v_conversation_count
  FROM ai_coach_conversations
  WHERE member_id = p_member_id AND started_at >= p_start_date;
  
  SELECT COUNT(*) INTO v_message_count
  FROM ai_coach_messages m
  JOIN ai_coach_conversations c ON m.conversation_id = c.id
  WHERE c.member_id = p_member_id AND m.created_at >= p_start_date;
  
  SELECT AVG(satisfaction_score) INTO v_avg_satisfaction
  FROM ai_coach_conversations
  WHERE member_id = p_member_id 
    AND started_at >= p_start_date 
    AND satisfaction_score IS NOT NULL;
  
  SELECT jsonb_agg(jsonb_build_object('type', context_type, 'count', cnt))
  INTO v_top_topics
  FROM (
    SELECT context_type, COUNT(*) as cnt
    FROM ai_coach_conversations
    WHERE member_id = p_member_id AND started_at >= p_start_date
    GROUP BY context_type
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;
  
  v_result := jsonb_build_object(
    'conversation_count', v_conversation_count,
    'message_count', v_message_count,
    'avg_satisfaction', COALESCE(v_avg_satisfaction, 0),
    'top_topics', COALESCE(v_top_topics, '[]'::jsonb)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Insert Default Coaching Templates
-- =====================================================

INSERT INTO ai_coach_templates (template_type, template_name, prompt_template, variables) VALUES
(
  'skill_improvement',
  'General Skill Development Plan',
  'You are an expert skills development coach for accounting professionals. The user wants to improve their {{skill_name}} skill from level {{current_level}} to level {{target_level}}. Their learning style is {{learning_style}}. Create a personalized 3-month development plan with specific, actionable steps.',
  '{"skill_name": "string", "current_level": "number", "target_level": "number", "learning_style": "string"}'::jsonb
),
(
  'interview_prep',
  'Interview Preparation Coach',
  'You are a career coach helping an accounting professional prepare for a {{role_type}} interview. Based on their skills profile showing strengths in {{strengths}} and gaps in {{gaps}}, provide tailored interview preparation advice, likely questions, and how to position their experience.',
  '{"role_type": "string", "strengths": "array", "gaps": "array"}'::jsonb
),
(
  'career_pathway',
  'Career Progression Guide',
  'You are a career development advisor for accounting professionals. The user is currently a {{current_role}} with {{years_experience}} years of experience. They are interested in progressing to {{target_role}}. Based on their skill levels in {{key_skills}}, provide a clear career pathway with milestone goals.',
  '{"current_role": "string", "years_experience": "number", "target_role": "string", "key_skills": "object"}'::jsonb
),
(
  'cpd_recommendation',
  'CPD Activity Recommender',
  'You are a CPD advisor for accounting professionals. The user has {{cpd_hours}} CPD hours completed this year (target: {{cpd_target}}) and skill gaps in {{gap_areas}}. Their preferred learning style is {{learning_style}}. Recommend specific CPD activities that will help them meet their target and address skill gaps.',
  '{"cpd_hours": "number", "cpd_target": "number", "gap_areas": "array", "learning_style": "string"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE ai_coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY coach_conversations_policy ON ai_coach_conversations
  FOR ALL USING (member_id = auth.uid());

-- Users can only see their own messages
CREATE POLICY coach_messages_policy ON ai_coach_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM ai_coach_conversations WHERE member_id = auth.uid()
    )
  );

-- Users can only see/update their own preferences
CREATE POLICY coach_preferences_policy ON ai_coach_user_preferences
  FOR ALL USING (member_id = auth.uid());

-- Users can only see their own analytics
CREATE POLICY coach_analytics_policy ON ai_coach_analytics
  FOR ALL USING (member_id = auth.uid());

-- Users can only see their own rate limits
CREATE POLICY coach_rate_limits_policy ON ai_coach_rate_limits
  FOR ALL USING (member_id = auth.uid());

-- Templates are readable by all authenticated users
CREATE POLICY coach_templates_read_policy ON ai_coach_templates
  FOR SELECT USING (is_active = true);

-- =====================================================
-- Migration Complete
-- =====================================================

