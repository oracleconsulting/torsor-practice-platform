/**
 * AI Skills Coach Service
 * 
 * Integrates with OpenRouter for LLM access to provide personalized skills coaching
 * Includes rate limiting, content filtering, and context-aware responses
 */

import { supabase } from '@/lib/supabase/client';

// OpenRouter API types
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Coach context types
export type CoachContextType = 'skills' | 'cpd' | 'mentoring' | 'career' | 'general';

export interface CoachContext {
  type: CoachContextType;
  contextId?: string;
  userData?: {
    memberName: string;
    role?: string;
    learningStyle?: string;
    skillLevels?: Record<string, number>;
    cpdHours?: number;
    recentActivities?: string[];
  };
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface CoachResponse {
  message: string;
  conversationId: string;
  tokensUsed: number;
  rateLimitRemaining: number;
}

/**
 * System prompts for different contexts
 */
const SYSTEM_PROMPTS: Record<CoachContextType, string> = {
  skills: `You are an expert skills development coach for accounting professionals. 
Your role is to:
- Help users assess and improve their technical and soft skills
- Provide personalized learning paths based on their VARK learning style
- Suggest specific resources and activities
- Give constructive, encouraging feedback
- Break down complex skills into achievable milestones

Always be supportive, specific, and actionable in your advice. Tailor recommendations to the accounting profession.`,

  cpd: `You are a CPD (Continuing Professional Development) advisor for accounting professionals.
Your role is to:
- Help users plan and track their CPD activities
- Recommend relevant courses, events, and learning opportunities
- Ensure activities align with professional body requirements
- Track progress toward annual CPD targets
- Suggest activities that address identified skill gaps

Be practical and aware of time constraints professionals face.`,

  mentoring: `You are a mentoring relationship advisor for accounting teams.
Your role is to:
- Help users find appropriate mentors or mentees
- Provide guidance on effective mentoring sessions
- Suggest goal-setting frameworks
- Offer tips for giving and receiving feedback
- Support both mentors and mentees in their development

Be encouraging and focus on building strong professional relationships.`,

  career: `You are a career development advisor for accounting professionals.
Your role is to:
- Help users plan their career progression
- Identify skills needed for target roles
- Provide interview preparation guidance
- Suggest networking opportunities
- Advise on work-life balance and professional growth

Be realistic about career paths while being supportive of ambitions.`,

  general: `You are a friendly AI coach for accounting professionals.
Your role is to:
- Answer questions about professional development
- Provide motivation and encouragement
- Help with goal setting and accountability
- Give practical advice on workplace challenges
- Support overall career and skills development

Be approachable, positive, and genuinely helpful.`
};

/**
 * Build context-aware system prompt
 */
function buildSystemPrompt(context: CoachContext): string {
  const basePrompt = SYSTEM_PROMPTS[context.type];
  
  if (!context.userData) {
    return basePrompt;
  }

  const { memberName, role, learningStyle, skillLevels, cpdHours } = context.userData;
  
  let contextInfo = `\n\nUser Context:\n- Name: ${memberName}`;
  if (role) contextInfo += `\n- Role: ${role}`;
  if (learningStyle) contextInfo += `\n- Learning Style: ${learningStyle} (adapt your suggestions accordingly)`;
  if (skillLevels) {
    const topSkills = Object.entries(skillLevels)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill, level]) => `${skill}: ${level}/5`)
      .join(', ');
    contextInfo += `\n- Top Skills: ${topSkills}`;
  }
  if (cpdHours !== undefined) contextInfo += `\n- CPD Hours This Year: ${cpdHours}`;

  return basePrompt + contextInfo;
}

/**
 * Content safety filter
 */
function filterContent(content: string): { safe: boolean; reason?: string } {
  const lowerContent = content.toLowerCase();
  
  // Block inappropriate content
  const blockedPatterns = [
    /\b(hack|exploit|cheat)\b/,
    /\b(illegal|fraud|embezzle)\b/,
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        safe: false,
        reason: 'Content violates safety guidelines'
      };
    }
  }
  
  return { safe: true };
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(memberId: string): Promise<{
  allowed: boolean;
  remaining: number;
  messageCount: number;
}> {
  try {
    const { data, error } = await supabase
      .rpc('check_rate_limit', { p_member_id: memberId });
    
    if (error) throw error;
    
    return {
      allowed: data.allowed,
      remaining: data.remaining,
      messageCount: data.message_count
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Default to allowing if check fails
    return { allowed: true, remaining: 100, messageCount: 0 };
  }
}

/**
 * Increment rate limit after successful message
 */
async function incrementRateLimit(memberId: string, tokens: number): Promise<void> {
  try {
    await supabase.rpc('increment_rate_limit', {
      p_member_id: memberId,
      p_tokens: tokens
    });
  } catch (error) {
    console.error('Rate limit increment error:', error);
  }
}

/**
 * Call OpenRouter LLM API
 */
async function callOpenRouter(messages: OpenRouterMessage[]): Promise<OpenRouterResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const appName = import.meta.env.VITE_APP_NAME || 'Torsor Practice Platform';
  const appUrl = import.meta.env.VITE_APP_URL || 'https://torsor.app';
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
  }
  
  // Default to GPT-4 Turbo, but allow override via env var
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4-turbo';
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': appUrl,
      'X-Title': appName
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
  }
  
  return response.json();
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(
  memberId: string,
  context: CoachContext
): Promise<string> {
  // Try to find active conversation with same context
  const { data: existingConversation } = await (supabase as any)
    .from('ai_coach_conversations')
    .select('id')
    .eq('member_id', memberId)
    .eq('is_active', true)
    .eq('context_type', context.type)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();
  
  if (existingConversation) {
    return existingConversation.id;
  }
  
  // Create new conversation
  const { data: newConversation, error } = await (supabase as any)
    .from('ai_coach_conversations')
    .insert({
      member_id: memberId,
      context_type: context.type,
      context_id: context.contextId,
      title: `${context.type.charAt(0).toUpperCase() + context.type.slice(1)} Coaching`
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  return newConversation.id;
}

/**
 * Get conversation history
 */
async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<OpenAIMessage[]> {
  const { data: messages } = await (supabase as any)
    .from('ai_coach_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  return messages || [];
}

/**
 * Save message to database
 */
async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed: number = 0
): Promise<void> {
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4-turbo';
  
  await (supabase as any)
    .from('ai_coach_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tokens_used: tokensUsed,
      model
    });
}

/**
 * Main function: Send message to AI coach
 */
export async function sendCoachMessage(
  memberId: string,
  message: string,
  context: CoachContext,
  conversationId?: string
): Promise<CoachResponse> {
  // Content safety check
  const safetyCheck = filterContent(message);
  if (!safetyCheck.safe) {
    throw new Error(safetyCheck.reason || 'Message blocked by content filter');
  }
  
  // Rate limit check
  const rateLimit = await checkRateLimit(memberId);
  if (!rateLimit.allowed) {
    throw new Error('Daily message limit reached (100 messages/day). Please try again tomorrow.');
  }
  
  // Get or create conversation
  const convId = conversationId || await getOrCreateConversation(memberId, context);
  
  // Build message history
  const history = await getConversationHistory(convId, 8); // Last 8 messages for context
  const systemPrompt = buildSystemPrompt(context);
  
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ];
  
  // Call OpenRouter
  const response = await callOpenRouter(messages);
  const assistantMessage = response.choices[0].message.content;
  const tokensUsed = response.usage.total_tokens;
  
  // Save messages to database
  await saveMessage(convId, 'user', message);
  await saveMessage(convId, 'assistant', assistantMessage, tokensUsed);
  
  // Update rate limit
  await incrementRateLimit(memberId, tokensUsed);
  
  return {
    message: assistantMessage,
    conversationId: convId,
    tokensUsed,
    rateLimitRemaining: rateLimit.remaining - 1
  };
}

/**
 * Get user preferences
 */
export async function getUserPreferences(memberId: string) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_user_preferences')
    .select('*')
    .eq('member_id', memberId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Not found error
    throw error;
  }
  
  return data || null;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  memberId: string,
  preferences: Partial<{
    communication_style: string;
    coaching_frequency: string;
    notification_enabled: boolean;
    voice_input_enabled: boolean;
    proactive_suggestions: boolean;
    topics_of_interest: string[];
  }>
) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_user_preferences')
    .upsert({
      member_id: memberId,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get coaching template
 */
export async function getCoachingTemplate(templateType: string) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_active', true)
    .order('effectiveness_score', { ascending: false })
    .limit(1)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Apply template with variables
 */
export function applyTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = Array.isArray(value) 
      ? value.join(', ') 
      : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
    
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return result;
}

/**
 * Record coaching analytics
 */
export async function recordAnalytics(
  memberId: string,
  conversationId: string,
  metricType: string,
  metricValue: any,
  impactScore?: number
) {
  await (supabase as any)
    .from('ai_coach_analytics')
    .insert({
      member_id: memberId,
      conversation_id: conversationId,
      metric_type: metricType,
      metric_value: metricValue,
      impact_score: impactScore
    });
}

/**
 * Get coaching analytics
 */
export async function getCoachingAnalytics(
  memberId: string,
  startDate?: Date
) {
  const { data, error } = await supabase.rpc('get_coaching_analytics', {
    p_member_id: memberId,
    p_start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  if (error) throw error;
  return data;
}

/**
 * Rate conversation satisfaction
 */
export async function rateConversation(
  conversationId: string,
  satisfactionScore: number
) {
  const { error } = await (supabase as any)
    .from('ai_coach_conversations')
    .update({ satisfaction_score: satisfactionScore })
    .eq('id', conversationId);
  
  if (error) throw error;
}

/**
 * Close conversation
 */
export async function closeConversation(conversationId: string) {
  const { error } = await (supabase as any)
    .from('ai_coach_conversations')
    .update({ is_active: false })
    .eq('id', conversationId);
  
  if (error) throw error;
}

