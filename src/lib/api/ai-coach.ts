/**
 * API Layer for AI Skills Coach
 * 
 * Provides functions to interact with the AI coaching system
 */

import {
  sendCoachMessage,
  getUserPreferences,
  updateUserPreferences,
  getCoachingTemplate,
  applyTemplate,
  recordAnalytics,
  getCoachingAnalytics,
  rateConversation,
  closeConversation,
  type CoachResponse
} from '@/services/ai/skillsCoachService';
import type { CoachContext } from '@/services/ai/skillsCoachService';
import { supabase } from '@/lib/supabase/client';

export type { CoachContext };

/**
 * Send a message to the AI coach
 */
export async function sendMessage(
  memberId: string,
  message: string,
  context: CoachContext,
  conversationId?: string
): Promise<CoachResponse> {
  return sendCoachMessage(memberId, message, context, conversationId);
}

/**
 * Get user's conversation history
 */
export async function getConversations(memberId: string) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_conversations')
    .select(`
      id,
      title,
      context_type,
      started_at,
      last_message_at,
      message_count,
      is_active,
      satisfaction_score
    `)
    .eq('member_id', memberId)
    .order('last_message_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Get messages from a specific conversation
 */
export async function getConversationMessages(conversationId: string) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Get user preferences
 */
export async function getPreferences(memberId: string) {
  return getUserPreferences(memberId);
}

/**
 * Update user preferences
 */
export async function savePreferences(
  memberId: string,
  preferences: any
) {
  return updateUserPreferences(memberId, preferences);
}

/**
 * Generate skill improvement plan using template
 * Now reads from ai_prompts table via prompt_key: 'skill_improvement_plan'
 */
export async function generateSkillImprovementPlan(
  memberId: string,
  skillName: string,
  currentLevel: number,
  targetLevel: number,
  learningStyle: string
) {
  // Get practice ID for the member
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('id', memberId)
    .single();
  
  if (!memberData) {
    throw new Error('Member not found');
  }
  
  // Fetch prompt from database
  const { data: promptConfig, error: promptError } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('practice_id', memberData.practice_id)
    .eq('prompt_key', 'skill_improvement_plan')
    .eq('is_active', true)
    .single();
  
  if (promptError || !promptConfig) {
    throw new Error('Skill improvement plan prompt not configured');
  }
  
  // Apply template variables
  const prompt = applyTemplate(promptConfig.user_prompt_template, {
    skill_name: skillName,
    current_level: currentLevel,
    target_level: targetLevel,
    learning_style: learningStyle
  });
  
  const context: CoachContext = {
    type: 'skills',
    userData: {
      memberName: '', // Will be filled by service
      learningStyle
    }
  };
  
  const response = await sendMessage(memberId, prompt, context);
  
  // Record analytics
  await recordAnalytics(
    memberId,
    response.conversationId,
    'skill_plan_generated',
    { skill_name: skillName, current_level: currentLevel, target_level: targetLevel }
  );
  
  return response;
}

/**
 * Generate interview preparation guide
 * Now reads from ai_prompts table via prompt_key: 'interview_prep'
 */
export async function generateInterviewPrep(
  memberId: string,
  roleType: string,
  strengths: string[],
  gaps: string[]
) {
  // Get practice ID for the member
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('id', memberId)
    .single();
  
  if (!memberData) {
    throw new Error('Member not found');
  }
  
  // Fetch prompt from database
  const { data: promptConfig, error: promptError } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('practice_id', memberData.practice_id)
    .eq('prompt_key', 'interview_prep')
    .eq('is_active', true)
    .single();
  
  if (promptError || !promptConfig) {
    throw new Error('Interview prep prompt not configured');
  }
  
  // Apply template variables
  const prompt = applyTemplate(promptConfig.user_prompt_template, {
    role_type: roleType,
    strengths: strengths.join(', '),
    gaps: gaps.join(', ')
  });
  
  const context: CoachContext = {
    type: 'career',
    userData: {
      memberName: ''
    }
  };
  
  const response = await sendMessage(memberId, prompt, context);
  
  await recordAnalytics(
    memberId,
    response.conversationId,
    'interview_prep_generated',
    { role_type: roleType }
  );
  
  return response;
}

/**
 * Generate career pathway guidance
 * Now reads from ai_prompts table via prompt_key: 'career_pathway'
 */
export async function generateCareerPathway(
  memberId: string,
  currentRole: string,
  yearsExperience: number,
  targetRole: string,
  keySkills: Record<string, number>
) {
  // Get practice ID for the member
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('id', memberId)
    .single();
  
  if (!memberData) {
    throw new Error('Member not found');
  }
  
  // Fetch prompt from database
  const { data: promptConfig, error: promptError } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('practice_id', memberData.practice_id)
    .eq('prompt_key', 'career_pathway')
    .eq('is_active', true)
    .single();
  
  if (promptError || !promptConfig) {
    throw new Error('Career pathway prompt not configured');
  }
  
  // Format key skills as a readable string
  const skillsFormatted = Object.entries(keySkills)
    .map(([skill, level]) => `${skill}: ${level}/5`)
    .join(', ');
  
  // Apply template variables
  const prompt = applyTemplate(promptConfig.user_prompt_template, {
    current_role: currentRole,
    years_experience: yearsExperience,
    target_role: targetRole,
    key_skills: skillsFormatted
  });
  
  const context: CoachContext = {
    type: 'career',
    userData: {
      memberName: '',
      role: currentRole,
      skillLevels: keySkills
    }
  };
  
  const response = await sendMessage(memberId, prompt, context);
  
  await recordAnalytics(
    memberId,
    response.conversationId,
    'career_pathway_generated',
    { current_role: currentRole, target_role: targetRole }
  );
  
  return response;
}

/**
 * Generate CPD recommendations
 * Now reads from ai_prompts table via prompt_key: 'cpd_recommendations'
 */
export async function generateCPDRecommendations(
  memberId: string,
  cpdHours: number,
  cpdTarget: number,
  gapAreas: string[],
  learningStyle: string
) {
  // Get practice ID for the member
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('practice_id')
    .eq('id', memberId)
    .single();
  
  if (!memberData) {
    throw new Error('Member not found');
  }
  
  // Fetch prompt from database
  const { data: promptConfig, error: promptError } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('practice_id', memberData.practice_id)
    .eq('prompt_key', 'cpd_recommendations')
    .eq('is_active', true)
    .single();
  
  if (promptError || !promptConfig) {
    throw new Error('CPD recommendations prompt not configured');
  }
  
  // Apply template variables
  const prompt = applyTemplate(promptConfig.user_prompt_template, {
    cpd_hours: cpdHours,
    cpd_target: cpdTarget,
    gap_areas: gapAreas.join(', '),
    learning_style: learningStyle
  });
  
  const context: CoachContext = {
    type: 'cpd',
    userData: {
      memberName: '',
      learningStyle,
      cpdHours
    }
  };
  
  const response = await sendMessage(memberId, prompt, context);
  
  await recordAnalytics(
    memberId,
    response.conversationId,
    'cpd_recommendations_generated',
    { cpd_hours: cpdHours, gap_areas: gapAreas }
  );
  
  return response;
}

/**
 * Get analytics for coaching effectiveness
 */
export async function getAnalytics(memberId: string, startDate?: Date) {
  return getCoachingAnalytics(memberId, startDate);
}

/**
 * Rate a conversation
 */
export async function rateSatisfaction(
  conversationId: string,
  score: number
) {
  return rateConversation(conversationId, score);
}

/**
 * Close a conversation
 */
export async function endConversation(conversationId: string) {
  return closeConversation(conversationId);
}

/**
 * Mark message as helpful/not helpful
 */
export async function markMessageHelpful(
  messageId: string,
  helpful: boolean
) {
  const { error } = await (supabase as any)
    .from('ai_coach_messages')
    .update({ helpful })
    .eq('id', messageId);
  
  if (error) throw error;
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(memberId: string) {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_member_id: memberId
  });
  
  if (error) throw error;
  
  return {
    allowed: data.allowed,
    remaining: data.remaining,
    messageCount: data.message_count,
    dailyLimit: 100
  };
}

/**
 * Get most asked questions across all users
 */
export async function getMostAskedQuestions(limit: number = 10) {
  const { data, error } = await (supabase as any)
    .from('ai_coach_analytics')
    .select('metric_value')
    .eq('metric_type', 'question_asked')
    .order('recorded_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  // Group and count similar questions
  const questionCounts = new Map<string, number>();
  data.forEach((item: any) => {
    const question = item.metric_value?.question || '';
    questionCounts.set(question, (questionCounts.get(question) || 0) + 1);
  });
  
  return Array.from(questionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([question, count]) => ({ question, count }));
}

/**
 * Check if user should receive proactive coaching
 */
export async function shouldSendProactiveCoaching(memberId: string): Promise<boolean> {
  const preferences = await getPreferences(memberId);
  
  if (!preferences?.proactive_suggestions) {
    return false;
  }
  
  // Check last message time
  const { data } = await (supabase as any)
    .from('ai_coach_conversations')
    .select('last_message_at')
    .eq('member_id', memberId)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!data) return true; // Never messaged, send first proactive message
  
  const lastMessageDate = new Date(data.last_message_at);
  const daysSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Check frequency preference
  const frequencyDays: Record<string, number> = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30
  };
  
  const threshold = frequencyDays[preferences.coaching_frequency] || 7;
  
  return daysSinceLastMessage >= threshold;
}

/**
 * Generate proactive coaching message
 */
export async function generateProactiveMessage(
  memberId: string,
  context: {
    overdueAssessments?: number;
    recentSkillImprovements?: Array<{ skill: string; improvement: number }>;
    cpdProgress?: { current: number; target: number };
  }
) {
  let prompt = "Check in with the user about their professional development progress. ";
  
  if (context.overdueAssessments && context.overdueAssessments > 0) {
    prompt += `Remind them they have ${context.overdueAssessments} overdue skill assessment(s). `;
  }
  
  if (context.recentSkillImprovements && context.recentSkillImprovements.length > 0) {
    prompt += `Celebrate their recent improvements in: ${context.recentSkillImprovements.map(s => s.skill).join(', ')}. `;
  }
  
  if (context.cpdProgress) {
    const percentage = (context.cpdProgress.current / context.cpdProgress.target) * 100;
    prompt += `Note their CPD progress: ${context.cpdProgress.current}/${context.cpdProgress.target} hours (${percentage.toFixed(0)}%). `;
  }
  
  prompt += "Keep the message friendly, encouraging, and action-oriented.";
  
  const coachContext: CoachContext = {
    type: 'general',
    userData: {
      memberName: '',
      cpdHours: context.cpdProgress?.current
    }
  };
  
  return sendMessage(memberId, prompt, coachContext);
}

