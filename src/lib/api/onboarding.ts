/**
 * Onboarding System API
 * PROMPT 6 Implementation
 * 
 * Manages the 7-step onboarding flow for new team members
 */

import { supabase } from '@/lib/supabase/client';

// Types
export interface OnboardingProgress {
  id: string;
  member_id: string;
  practice_id: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'skipped';
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes: number;
  total_points: number;
  badges_earned: string[];
  completion_speed?: 'fast' | 'average' | 'slow';
  
  // Step completion flags
  step_1_profile_completed: boolean;
  step_2_skills_assessment_completed: boolean;
  step_3_vark_assessment_completed: boolean;
  step_4_cpd_review_completed: boolean;
  step_5_mentor_assignment_completed: boolean;
  step_6_dev_plan_completed: boolean;
  step_7_team_intro_completed: boolean;
  
  checkpoint_data: any;
  created_at: string;
  updated_at: string;
}

export interface OnboardingBadge {
  id: string;
  badge_code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria_type: string;
  points_value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface OnboardingAdminDashboard {
  practice_id: string;
  practice_name: string;
  total_members: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  completion_rate: number;
  avg_completion_percentage: number;
  avg_time_minutes: number;
  avg_points: number;
  step_1_completion_rate: number;
  step_2_completion_rate: number;
  step_3_completion_rate: number;
  step_4_completion_rate: number;
  step_5_completion_rate: number;
  step_6_completion_rate: number;
  step_7_completion_rate: number;
  most_stuck_step: string;
}

/**
 * Get or create onboarding progress for a member
 */
export async function getOnboardingProgress(
  memberId: string,
  practiceId: string
): Promise<OnboardingProgress | null> {
  try {
    let { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('member_id', memberId)
      .eq('practice_id', practiceId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No progress found, create new
      const { data: newProgress, error: createError } = await (supabase
        .from('onboarding_progress') as any)
        .insert({
          member_id: memberId,
          practice_id: practiceId,
          status: 'not_started',
          current_step: 1
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating onboarding progress:', createError);
        return null;
      }

      return newProgress as OnboardingProgress;
    }

    if (error) {
      console.error('Error fetching onboarding progress:', error);
      return null;
    }

    return data as OnboardingProgress;
  } catch (error) {
    console.error('Error in getOnboardingProgress:', error);
    return null;
  }
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingProgress(
  progressId: string,
  updates: Partial<OnboardingProgress>
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('onboarding_progress') as any)
      .update(updates)
      .eq('id', progressId);

    if (error) {
      console.error('Error updating onboarding progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOnboardingProgress:', error);
    return false;
  }
}

/**
 * Complete a specific step
 */
export async function completeOnboardingStep(
  progressId: string,
  stepNumber: number,
  timeSpentMinutes: number,
  points: number = 100,
  additionalData?: any
): Promise<boolean> {
  try {
    const updates: any = {
      [`step_${stepNumber}_completed`]: true,
      [`step_${stepNumber}_completed_at`]: new Date().toISOString(),
      [`step_${stepNumber}_time_minutes`]: timeSpentMinutes,
      [`step_${stepNumber}_points`]: points,
      current_step: Math.min(stepNumber + 1, 7)
    };

    // Add any additional step-specific data
    if (additionalData) {
      if (stepNumber === 5 && additionalData.mentorId) {
        updates.step_5_mentor_id = additionalData.mentorId;
      }
    }

    const { error } = await (supabase
      .from('onboarding_progress') as any)
      .update(updates)
      .eq('id', progressId);

    if (error) {
      console.error('Error completing step:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeOnboardingStep:', error);
    return false;
  }
}

/**
 * Save checkpoint data for resume capability
 */
export async function saveCheckpoint(
  progressId: string,
  checkpointData: any
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('onboarding_progress') as any)
      .update({
        checkpoint_data: checkpointData
      })
      .eq('id', progressId);

    if (error) {
      console.error('Error saving checkpoint:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveCheckpoint:', error);
    return false;
  }
}

/**
 * Skip a step (for experienced hires)
 */
export async function skipOnboardingStep(
  progressId: string,
  stepNumber: number,
  reason?: string
): Promise<boolean> {
  try {
    const updates: any = {
      [`step_${stepNumber}_completed`]: true,
      [`step_${stepNumber}_completed_at`]: new Date().toISOString(),
      [`step_${stepNumber}_time_minutes`]: 0,
      [`step_${stepNumber}_points`]: 50, // Half points for skipping
      current_step: Math.min(stepNumber + 1, 7)
    };

    const { error } = await (supabase
      .from('onboarding_progress') as any)
      .update(updates)
      .eq('id', progressId);

    if (error) {
      console.error('Error skipping step:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in skipOnboardingStep:', error);
    return false;
  }
}

/**
 * Get all badges
 */
export async function getAllBadges(): Promise<OnboardingBadge[]> {
  try {
    const { data, error } = await supabase
      .from('onboarding_badges')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false });

    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error in getAllBadges:', error);
    return [];
  }
}

/**
 * Get member's earned badges
 */
export async function getMemberBadges(memberId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('onboarding_member_badges')
      .select(`
        *,
        badge:onboarding_badges(*)
      `)
      .eq('member_id', memberId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching member badges:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMemberBadges:', error);
    return [];
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  practiceId: string,
  periodType: 'all_time' | 'monthly' | 'quarterly' = 'all_time'
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('onboarding_leaderboard')
      .select('*')
      .eq('practice_id', practiceId)
      .eq('period_type', periodType)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching leaderboard:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    return null;
  }
}

/**
 * Update leaderboard
 */
export async function updateLeaderboard(
  practiceId: string,
  periodType: 'all_time' | 'monthly' | 'quarterly' = 'all_time'
): Promise<boolean> {
  try {
    // Get all completed onboarding progress for this practice
    const { data: progressData, error: progressError } = await supabase
      .from('onboarding_progress')
      .select('*, member:practice_members(name)')
      .eq('practice_id', practiceId)
      .eq('status', 'completed')
      .order('total_points', { ascending: false })
      .limit(10);

    if (progressError) {
      console.error('Error fetching progress for leaderboard:', progressError);
      return false;
    }

    // Build rankings
    const rankings = (progressData || []).map((p: any, idx: number) => ({
      member_id: p.member_id,
      member_name: p.member?.name || 'Unknown',
      rank: idx + 1,
      points: p.total_points,
      completion_time_minutes: p.time_spent_minutes
    }));

    // Calculate stats
    const totalParticipants = rankings.length;
    const avgTime = rankings.length > 0
      ? rankings.reduce((sum: number, r: any) => sum + r.completion_time_minutes, 0) / rankings.length
      : 0;
    const fastestTime = rankings.length > 0
      ? Math.min(...rankings.map((r: any) => r.completion_time_minutes))
      : 0;

    // Upsert leaderboard
    const periodStart = periodType === 'all_time' ? null : new Date().toISOString().split('T')[0];
    const periodEnd = periodType === 'all_time' ? null : new Date().toISOString().split('T')[0];

    const { error: upsertError } = await (supabase
      .from('onboarding_leaderboard') as any)
      .upsert({
        practice_id: practiceId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        rankings,
        total_participants: totalParticipants,
        average_completion_time_minutes: Math.round(avgTime),
        fastest_completion_minutes: fastestTime
      }, {
        onConflict: 'practice_id,period_type,period_start'
      });

    if (upsertError) {
      console.error('Error updating leaderboard:', upsertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateLeaderboard:', error);
    return false;
  }
}

/**
 * Generate completion certificate
 */
export async function generateCertificate(
  memberId: string,
  progressId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  try {
    // Get progress data
    const { data: progress, error: progressError } = await supabase
      .from('onboarding_progress')
      .select('*, member:practice_members(name), practice:practices(name)')
      .eq('id', progressId)
      .single();

    if (progressError) {
      return { success: false, error: progressError.message };
    }

    const member: any = progress as any;
    
    // Generate certificate number
    const certificateNumber = `ONBOARD-${Date.now()}-${memberId.slice(0, 8).toUpperCase()}`;
    
    // Calculate completion time in hours
    const completionTimeHours = member.time_spent_minutes / 60;

    // Create certificate
    const { data: certificate, error: certError } = await (supabase
      .from('onboarding_completion_certificates') as any)
      .insert({
        member_id: memberId,
        onboarding_progress_id: progressId,
        certificate_number: certificateNumber,
        member_name: member.member?.name || 'Team Member',
        practice_name: member.practice?.name || 'Practice',
        completion_date: new Date().toISOString().split('T')[0],
        total_points: member.total_points,
        badges_earned: member.badges_earned,
        completion_time_hours: completionTimeHours.toFixed(2)
      })
      .select()
      .single();

    if (certError) {
      return { success: false, error: certError.message };
    }

    return { success: true, certificateId: certificate.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get admin dashboard data
 */
export async function getAdminDashboardData(
  practiceId: string
): Promise<OnboardingAdminDashboard | null> {
  try {
    const { data, error } = await supabase
      .from('onboarding_admin_dashboard')
      .select('*')
      .eq('practice_id', practiceId)
      .single();

    if (error) {
      console.error('Error fetching admin dashboard:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('Error in getAdminDashboardData:', error);
    return null;
  }
}

/**
 * Create reminder for inactive user
 */
export async function createReminder(
  memberId: string,
  progressId: string,
  reminderType: string,
  scheduledFor: Date
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('onboarding_reminders') as any)
      .insert({
        member_id: memberId,
        onboarding_progress_id: progressId,
        reminder_type: reminderType,
        scheduled_for: scheduledFor.toISOString(),
        subject: getReminderSubject(reminderType),
        message: getReminderMessage(reminderType),
        cta_text: 'Continue Onboarding',
        cta_link: '/team-portal/onboarding'
      });

    if (error) {
      console.error('Error creating reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createReminder:', error);
    return false;
  }
}

// Helper functions
function getReminderSubject(type: string): string {
  const subjects: Record<string, string> = {
    welcome: 'Welcome! Let\'s get you started 🎉',
    inactive_3_days: 'Continue your onboarding journey',
    inactive_7_days: 'We\'re here to help you complete onboarding',
    stuck_on_step: 'Need help with this step?',
    almost_done: 'You\'re almost there! 🏁',
    congratulations: 'Congratulations on completing onboarding! 🎊'
  };
  return subjects[type] || 'Onboarding Update';
}

function getReminderMessage(type: string): string {
  const messages: Record<string, string> = {
    welcome: 'Welcome to the team! Complete your onboarding to unlock all features and start earning badges.',
    inactive_3_days: 'We noticed you haven\'t completed your onboarding yet. It only takes about 30 minutes!',
    inactive_7_days: 'It\'s been a week since you started. Need any help? We\'re here to support you.',
    stuck_on_step: 'Having trouble with this step? Reach out to your team lead for assistance.',
    almost_done: 'Just one more step to complete your onboarding! You\'re doing great.',
    congratulations: 'Amazing work! You\'ve completed all onboarding steps. Your certificate is ready.'
  };
  return messages[type] || 'Check your onboarding progress.';
}

