/**
 * AI Skills Coach Service
 * 
 * Integrates with OpenRouter for LLM access to provide personalized skills coaching
 * Includes rate limiting, content filtering, and context-aware responses
 * NOW READS PROMPTS FROM DATABASE (ai_prompts table)
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

interface PromptConfig {
  id: string;
  system_prompt: string;
  user_prompt_template: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
}

// Coach context types
export type CoachContextType = 'skills' | 'cpd' | 'mentoring' | 'career' | 'general';

export interface CoachContext {
  type: CoachContextType;
  contextId?: string;
  practiceId?: string; // Added for database lookup
  userData?: {
    memberName: string;
    role?: string;
    learningStyle?: string;
    skillLevels?: Record<string, number>;
    cpdHours?: number;
    yearsExperience?: number;
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
 * Get prompt configuration from database
 */
async function getPromptConfig(
  promptKey: string,
  practiceId: string
): Promise<PromptConfig | null> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('prompt_key', promptKey)
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[SkillsCoach] Error fetching prompt config:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[SkillsCoach] Exception fetching prompt config:', error);
    return null;
  }
}

/**
 * Get OpenRouter API key from database
 */
async function getOpenRouterKey(practiceId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('encrypted_key')
      .eq('practice_id', practiceId)
      .eq('provider', 'openrouter')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[SkillsCoach] Error fetching API key:', error);
      // Fallback to environment variable
      return import.meta.env.VITE_OPENROUTER_API_KEY || null;
    }

    return data.encrypted_key;
  } catch (error) {
    console.error('[SkillsCoach] Exception fetching API key:', error);
    // Fallback to environment variable
    return import.meta.env.VITE_OPENROUTER_API_KEY || null;
  }
}

/**
 * Fill template with user data
 */
function fillTemplate(template: string, context: CoachContext, userMessage: string): string {
  const { userData } = context;
  
  let filled = template;
  
  // Replace {{user_message}}
  filled = filled.replace(/\{\{user_message\}\}/g, userMessage);
  
  if (userData) {
    filled = filled.replace(/\{\{member_name\}\}/g, userData.memberName || 'there');
    filled = filled.replace(/\{\{role\}\}/g, userData.role || 'Not specified');
    filled = filled.replace(/\{\{learning_style\}\}/g, userData.learningStyle || 'Not assessed');
    filled = filled.replace(/\{\{cpd_hours\}\}/g, String(userData.cpdHours || 0));
    filled = filled.replace(/\{\{years_experience\}\}/g, String(userData.yearsExperience || 0));
    
    if (userData.skillLevels) {
      const topSkills = Object.entries(userData.skillLevels)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([skill, level]) => `${skill}: ${level}/5`)
        .join(', ');
      filled = filled.replace(/\{\{top_skills\}\}/g, topSkills);
    } else {
      filled = filled.replace(/\{\{top_skills\}\}/g, 'Not assessed');
    }
  }
  
  return filled;
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
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
  maxTokens: number
): Promise<OpenRouterResponse> {
  const appName = import.meta.env.VITE_APP_NAME || 'Torsor Practice Platform';
  const appUrl = import.meta.env.VITE_APP_URL || 'https://torsor.co.uk';
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please set up API key in AI Settings.');
  }
  
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
      temperature,
      max_tokens: maxTokens,
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
  tokensUsed: number = 0,
  model: string = 'openai/gpt-4-turbo'
): Promise<void> {
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
  // Ensure practiceId is provided
  if (!context.practiceId) {
    throw new Error('Practice ID is required for database-driven coaching');
  }

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
  
  // Get prompt configuration from database
  const promptKey = `coach_${context.type}`;
  const promptConfig = await getPromptConfig(promptKey, context.practiceId);
  
  if (!promptConfig) {
    throw new Error(`Prompt configuration not found for ${promptKey}. Please contact your administrator.`);
  }
  
  // Get API key from database
  const apiKey = await getOpenRouterKey(context.practiceId);
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please contact your administrator.');
  }
  
  // Get or create conversation
  const convId = conversationId || await getOrCreateConversation(memberId, context);
  
  // Build message history
  const history = await getConversationHistory(convId, 8); // Last 8 messages for context
  
  // Fill user prompt template
  const userPrompt = fillTemplate(promptConfig.user_prompt_template, context, message);
  
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: promptConfig.system_prompt },
    ...history,
    { role: 'user', content: userPrompt }
  ];
  
  // Call OpenRouter with config from database
  const response = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    messages,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  const assistantMessage = response.choices[0].message.content;
  const tokensUsed = response.usage.total_tokens;
  
  // Save messages to database
  await saveMessage(convId, 'user', message, 0, promptConfig.model_name);
  await saveMessage(convId, 'assistant', assistantMessage, tokensUsed, promptConfig.model_name);
  
  // Update rate limit
  await incrementRateLimit(memberId, tokensUsed);
  
  console.log(`[SkillsCoach] Message sent using ${promptConfig.model_name}, ${tokensUsed} tokens`);
  
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

