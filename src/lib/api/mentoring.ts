/**
 * Mentoring API Layer
 * PROMPT 4 Implementation
 * 
 * Handles all CRUD operations for the mentoring system
 */

import { supabase } from '@/lib/supabase/client';
import type { MentorMatch } from '@/services/mentoring/matchingAlgorithm';

// Types
export interface MentoringRelationship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  matched_skills: string[];
  match_score: number;
  vark_compatibility: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  agreement_signed: boolean;
  start_date?: string;
  end_date?: string;
  primary_goals?: string[];
  created_at: string;
}

export interface MentoringSession {
  id: string;
  relationship_id: string;
  session_number: number;
  scheduled_date: string;
  actual_date?: string;
  duration_minutes: number;
  format: 'in-person' | 'video-call' | 'phone' | 'async';
  agenda?: string;
  notes?: string;
  key_takeaways?: string[];
  action_items?: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  mentee_rating?: number;
  mentor_rating?: number;
  cpd_hours?: number;
  created_at: string;
}

export interface MentoringGoal {
  id: string;
  relationship_id: string;
  title: string;
  description?: string;
  skill_name?: string;
  current_level: number;
  target_level: number;
  target_date?: string;
  progress_percentage: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned' | 'achieved';
  milestones?: any;
  completed_milestones: number;
  total_milestones?: number;
  created_at: string;
}

/**
 * Create a new mentoring relationship
 */
export async function createMentoringRelationship(
  match: MentorMatch,
  userId: string
): Promise<{ success: boolean; relationshipId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('mentoring_relationships') as any)
      .insert({
        mentor_id: match.mentorId,
        mentee_id: match.menteeId,
        matched_skills: match.matchedSkills,
        match_score: match.matchScore,
        vark_compatibility: match.varkCompatibility,
        status: 'pending',
        primary_goals: match.suggestedGoals,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mentoring relationship:', error);
      return { success: false, error: error.message };
    }

    return { success: true, relationshipId: data.id };
  } catch (error: any) {
    console.error('Error creating mentoring relationship:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all mentoring relationships for a user
 */
export async function getMentoringRelationships(
  userId: string,
  role?: 'mentor' | 'mentee'
): Promise<MentoringRelationship[]> {
  try {
    let query = supabase
      .from('mentoring_relationships')
      .select('*');

    if (role === 'mentor') {
      query = query.eq('mentor_id', userId);
    } else if (role === 'mentee') {
      query = query.eq('mentee_id', userId);
    } else {
      // Get both
      query = query.or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching relationships:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return [];
  }
}

/**
 * Update relationship status
 */
export async function updateRelationshipStatus(
  relationshipId: string,
  status: MentoringRelationship['status'],
  agreementSigned?: boolean
): Promise<boolean> {
  try {
    const updates: any = { status };
    
    if (agreementSigned !== undefined) {
      updates.agreement_signed = agreementSigned;
      if (agreementSigned) {
        updates.agreement_signed_at = new Date().toISOString();
        updates.start_date = new Date().toISOString().split('T')[0];
      }
    }

    if (status === 'active' && !updates.start_date) {
      updates.start_date = new Date().toISOString().split('T')[0];
    }

    if (status === 'completed' || status === 'cancelled') {
      updates.end_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await (supabase
      .from('mentoring_relationships') as any)
      .update(updates)
      .eq('id', relationshipId);

    if (error) {
      console.error('Error updating relationship:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating relationship:', error);
    return false;
  }
}

/**
 * Create a mentoring session
 */
export async function createMentoringSession(
  session: Partial<MentoringSession>
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('mentoring_sessions') as any)
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }

    return { success: true, sessionId: data.id };
  } catch (error: any) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get sessions for a relationship
 */
export async function getSessions(relationshipId: string): Promise<MentoringSession[]> {
  try {
    const { data, error } = await supabase
      .from('mentoring_sessions')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<MentoringSession>
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('mentoring_sessions') as any)
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
}

/**
 * Complete a session and add CPD hours
 */
export async function completeSession(
  sessionId: string,
  notes: string,
  keyTakeaways: string[],
  actionItems: string[],
  cpdHours: number
): Promise<boolean> {
  try {
    const updates: Partial<MentoringSession> = {
      status: 'completed',
      actual_date: new Date().toISOString(),
      notes,
      key_takeaways: keyTakeaways,
      action_items: actionItems,
      cpd_hours: cpdHours
    };

    return await updateSession(sessionId, updates);
  } catch (error) {
    console.error('Error completing session:', error);
    return false;
  }
}

/**
 * Create a mentoring goal
 */
export async function createMentoringGoal(
  goal: Partial<MentoringGoal>
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('mentoring_goals') as any)
      .insert(goal)
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return { success: false, error: error.message };
    }

    return { success: true, goalId: data.id };
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get goals for a relationship
 */
export async function getGoals(relationshipId: string): Promise<MentoringGoal[]> {
  try {
    const { data, error } = await supabase
      .from('mentoring_goals')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  progressPercentage: number,
  status?: MentoringGoal['status']
): Promise<boolean> {
  try {
    const updates: any = { progress_percentage: progressPercentage };
    
    if (status) {
      updates.status = status;
      if (status === 'achieved' || status === 'completed') {
        updates.completed_at = new Date().toISOString().split('T')[0];
      }
    }

    const { error } = await (supabase
      .from('mentoring_goals') as any)
      .update(updates)
      .eq('id', goalId);

    if (error) {
      console.error('Error updating goal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating goal:', error);
    return false;
  }
}

/**
 * Submit feedback after a session
 */
export async function submitFeedback(
  relationshipId: string,
  sessionId: string,
  providerRole: 'mentor' | 'mentee',
  providerId: string,
  feedback: {
    overallRating: number;
    communicationRating: number;
    helpfulnessRating: number;
    goalProgressRating: number;
    whatWentWell: string;
    areasForImprovement: string;
    suggestions?: string;
    wouldRecommend: boolean;
    wantsToContinue: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('mentoring_feedback') as any)
      .insert({
        relationship_id: relationshipId,
        session_id: sessionId,
        provider_role: providerRole,
        provider_id: providerId,
        overall_rating: feedback.overallRating,
        communication_rating: feedback.communicationRating,
        helpfulness_rating: feedback.helpfulnessRating,
        goal_progress_rating: feedback.goalProgressRating,
        what_went_well: feedback.whatWentWell,
        areas_for_improvement: feedback.areasForImprovement,
        suggestions: feedback.suggestions,
        would_recommend: feedback.wouldRecommend,
        wants_to_continue: feedback.wantsToContinue
      });

    if (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
}

/**
 * Get mentor statistics
 */
export async function getMentorStatistics(mentorId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('mentor_statistics')
      .select('*')
      .eq('mentor_id', mentorId)
      .single();

    if (error) {
      console.error('Error fetching mentor stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    return null;
  }
}

/**
 * Get active relationships view
 */
export async function getActiveRelationships(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('active_mentoring_relationships')
      .select('*')
      .or(`mentor_user_id.eq.${userId},mentee_user_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching active relationships:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching active relationships:', error);
    return [];
  }
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('mentoring_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(notificationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('mentoring_notifications') as any)
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification sent:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification sent:', error);
    return false;
  }
}

/**
 * Get agreement template
 */
export async function getAgreementTemplate(templateId?: string): Promise<any> {
  try {
    let query = supabase.from('mentoring_agreement_templates').select('*');
    
    if (templateId) {
      query = query.eq('id', templateId);
    } else {
      query = query.eq('is_default', true);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

/**
 * Generate agreement from template
 */
export function generateAgreement(
  template: any,
  variables: {
    mentorName: string;
    menteeName: string;
    skills: string;
    startDate: string;
    duration: string;
    goals: string;
    successCriteria: string;
  }
): string {
  let content = template.template_content;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key.replace(/([A-Z])/g, '_$1').toLowerCase()}}}`;
    content = content.replaceAll(placeholder, value);
  });

  return content;
}

