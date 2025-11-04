import { supabase } from '@/lib/supabase/client';
import { achievementEngine } from './achievement-engine';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Milestone {
  id: string;
  practice_id?: string;
  name: string;
  description: string;
  category: 'assessments' | 'cpd' | 'skills' | 'collaboration' | 'leadership' | 'general';
  goal_type: 'count' | 'percentage' | 'score' | 'streak';
  goal_target: number;
  goal_unit: string;
  time_period: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'lifetime';
  start_date?: string;
  end_date?: string;
  completion_points: number;
  completion_badge_id?: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface MemberMilestoneProgress {
  id: string;
  member_id: string;
  milestone_id: string;
  current_value: number;
  target_value: number;
  percentage_complete: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  started_at?: string;
  completed_at?: string;
  last_updated: string;
  milestone?: Milestone;
}

// =====================================================
// MILESTONE TRACKER
// =====================================================

export class MilestoneTracker {
  /**
   * Update milestone progress when events occur
   */
  async updateMilestoneProgress(
    memberId: string,
    eventType: string,
    incrementValue: number,
    eventData: any = {}
  ): Promise<void> {
    try {
      // Get all active milestones that match this event type
      const milestones = await this.getRelevantMilestones(eventType);

      for (const milestone of milestones) {
        await this.incrementProgress(memberId, milestone, incrementValue);
      }
    } catch (error) {
      console.error('[Milestone Tracker] Error updating milestone progress:', error);
    }
  }

  /**
   * Get milestones relevant to an event type
   */
  private async getRelevantMilestones(eventType: string): Promise<Milestone[]> {
    const categoryMap: Record<string, string[]> = {
      assessment_complete: ['assessments', 'general'],
      cpd_log: ['cpd', 'general'],
      skill_improve: ['skills', 'general'],
      streak: ['general']
    };

    const categories = categoryMap[eventType] || ['general'];

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .in('category', categories)
      .eq('is_active', true);

    if (error) {
      console.error('[Milestone Tracker] Error fetching milestones:', error);
      return [];
    }

    // Filter by time period (only include non-expired milestones)
    const now = new Date();
    return data.filter(m => {
      if (m.time_period === 'lifetime') return true;
      if (m.end_date && new Date(m.end_date) < now) return false;
      return true;
    });
  }

  /**
   * Increment progress for a milestone
   */
  private async incrementProgress(
    memberId: string,
    milestone: Milestone,
    incrementValue: number
  ): Promise<void> {
    try {
      // Get existing progress
      const { data: existing, error: fetchError } = await supabase
        .from('member_milestone_progress')
        .select('*')
        .eq('member_id', memberId)
        .eq('milestone_id', milestone.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const newValue = (existing?.current_value || 0) + incrementValue;
      const isComplete = newValue >= milestone.goal_target;
      const wasNotComplete = !existing || existing.status !== 'completed';

      if (existing) {
        // Update existing progress
        await supabase
          .from('member_milestone_progress')
          .update({
            current_value: newValue,
            status: isComplete ? 'completed' : 'in_progress',
            completed_at: isComplete && wasNotComplete ? new Date().toISOString() : existing.completed_at,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new progress
        await supabase
          .from('member_milestone_progress')
          .insert({
            member_id: memberId,
            milestone_id: milestone.id,
            current_value: newValue,
            target_value: milestone.goal_target,
            status: isComplete ? 'completed' : 'in_progress',
            started_at: new Date().toISOString(),
            completed_at: isComplete ? new Date().toISOString() : null
          });
      }

      // If just completed, award rewards
      if (isComplete && wasNotComplete) {
        await this.awardMilestoneCompletion(memberId, milestone);
        console.log(`[Milestone Tracker] ✅ Completed: ${milestone.name} for member ${memberId}`);
      }
    } catch (error) {
      console.error('[Milestone Tracker] Error incrementing progress:', error);
    }
  }

  /**
   * Award rewards for milestone completion
   */
  private async awardMilestoneCompletion(memberId: string, milestone: Milestone): Promise<void> {
    try {
      // Award completion points
      if (milestone.completion_points > 0) {
        await this.awardPoints(
          memberId,
          milestone.completion_points,
          'bonus',
          `Completed milestone: ${milestone.name}`,
          milestone.id
        );
      }

      // Unlock completion badge if specified
      if (milestone.completion_badge_id) {
        await achievementEngine.checkAndUnlockAchievements(
          memberId,
          'milestone_complete',
          { milestone_id: milestone.id }
        );
      }
    } catch (error) {
      console.error('[Milestone Tracker] Error awarding milestone completion:', error);
    }
  }

  /**
   * Award points (same as achievement engine)
   */
  private async awardPoints(
    memberId: string,
    points: number,
    pointsType: string,
    reason: string,
    referenceId?: string
  ): Promise<void> {
    try {
      // Upsert member_points
      const { data: existing } = await supabase
        .from('member_points')
        .select('*')
        .eq('member_id', memberId)
        .single();

      if (existing) {
        const newTotal = existing.total_points + points;
        const newTypePoints = (existing[`${pointsType}_points`] || 0) + points;

        await supabase
          .from('member_points')
          .update({
            total_points: newTotal,
            [`${pointsType}_points`]: newTypePoints,
            updated_at: new Date().toISOString()
          })
          .eq('member_id', memberId);
      } else {
        await supabase
          .from('member_points')
          .insert({
            member_id: memberId,
            total_points: points,
            [`${pointsType}_points`]: points
          });
      }

      // Insert points history
      await supabase
        .from('points_history')
        .insert({
          member_id: memberId,
          points_change: points,
          points_type: pointsType,
          reason,
          reference_type: 'milestone',
          reference_id: referenceId
        });
    } catch (error) {
      console.error('[Milestone Tracker] Error awarding points:', error);
    }
  }

  /**
   * Recalculate all milestone progress for a member (useful for manual refresh)
   */
  async recalculateMilestoneProgress(memberId: string): Promise<void> {
    try {
      // Get all active milestones
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const milestone of milestones || []) {
        const currentValue = await this.calculateCurrentValue(memberId, milestone);
        
        // Upsert progress
        const { data: existing } = await supabase
          .from('member_milestone_progress')
          .select('*')
          .eq('member_id', memberId)
          .eq('milestone_id', milestone.id)
          .single();

        const isComplete = currentValue >= milestone.goal_target;

        if (existing) {
          await supabase
            .from('member_milestone_progress')
            .update({
              current_value: currentValue,
              status: isComplete ? 'completed' : 'in_progress',
              last_updated: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('member_milestone_progress')
            .insert({
              member_id: memberId,
              milestone_id: milestone.id,
              current_value: currentValue,
              target_value: milestone.goal_target,
              status: isComplete ? 'completed' : 'in_progress',
              started_at: new Date().toISOString()
            });
        }
      }

      console.log(`[Milestone Tracker] ♻️  Recalculated all milestones for member ${memberId}`);
    } catch (error) {
      console.error('[Milestone Tracker] Error recalculating milestone progress:', error);
    }
  }

  /**
   * Calculate current value for a milestone
   */
  private async calculateCurrentValue(memberId: string, milestone: Milestone): Promise<number> {
    switch (milestone.category) {
      case 'assessments':
        return this.countCompletedAssessments(memberId);
      
      case 'cpd':
        return this.getCPDHours(memberId, milestone.time_period);
      
      case 'skills':
        return this.countSkillsAtLevel(memberId, 4); // Default to level 4+
      
      default:
        return 0;
    }
  }

  /**
   * Count completed assessments
   */
  private async countCompletedAssessments(memberId: string): Promise<number> {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('practice_member_id', memberId)
      .single();

    if (!invitation) return 0;

    const completedCount = [
      invitation.vark_results,
      invitation.ocean_results,
      invitation.belbin_primary,
      invitation.strengths_data,
      invitation.motivations_data,
      invitation.eq_results,
      invitation.assessment_data
    ].filter(val => val != null).length;

    return completedCount;
  }

  /**
   * Get CPD hours for period
   */
  private async getCPDHours(memberId: string, period: string): Promise<number> {
    if (period === 'lifetime') {
      const { data: member } = await supabase
        .from('practice_members')
        .select('cpd_completed_hours')
        .eq('id', memberId)
        .single();
      
      return member?.cpd_completed_hours || 0;
    }

    // Calculate for specific period
    const startDate = this.getPeriodStartDate(period);
    const { data: activities } = await supabase
      .from('cpd_activities')
      .select('hours_claimed')
      .eq('practice_member_id', memberId)
      .gte('activity_date', startDate);

    return activities?.reduce((sum, a) => sum + (a.hours_claimed || 0), 0) || 0;
  }

  /**
   * Count skills at specific level or higher
   */
  private async countSkillsAtLevel(memberId: string, level: number): Promise<number> {
    const { data: skills } = await supabase
      .from('skill_assessments')
      .select('current_level')
      .eq('team_member_id', memberId)
      .gte('current_level', level);

    return skills?.length || 0;
  }

  /**
   * Get period start date
   */
  private getPeriodStartDate(period: string): string {
    const now = new Date();
    
    switch (period) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return weekStart.toISOString();
      
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return monthStart.toISOString();
      
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return quarterStart.toISOString();
      
      case 'annual':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return yearStart.toISOString();
      
      default:
        return new Date(0).toISOString();
    }
  }
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const milestoneTracker = new MilestoneTracker();

/**
 * Get all milestones
 */
export async function getMilestones(practiceId?: string) {
  let query = supabase
    .from('milestones')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (practiceId) {
    query = query.eq('practice_id', practiceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Milestones API] Error fetching milestones:', error);
    throw error;
  }

  return data as Milestone[];
}

/**
 * Get member's milestone progress
 */
export async function getMemberMilestoneProgress(memberId: string) {
  const { data, error } = await supabase
    .from('member_milestone_progress')
    .select('*, milestone:milestones(*)')
    .eq('member_id', memberId)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('[Milestones API] Error fetching member milestone progress:', error);
    throw error;
  }

  return data as MemberMilestoneProgress[];
}

/**
 * Get member's active (in-progress) milestones
 */
export async function getActiveMilestones(memberId: string) {
  const { data, error } = await supabase
    .from('member_milestone_progress')
    .select('*, milestone:milestones(*)')
    .eq('member_id', memberId)
    .eq('status', 'in_progress')
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('[Milestones API] Error fetching active milestones:', error);
    throw error;
  }

  return data as MemberMilestoneProgress[];
}

/**
 * Get member's completed milestones
 */
export async function getCompletedMilestones(memberId: string) {
  const { data, error } = await supabase
    .from('member_milestone_progress')
    .select('*, milestone:milestones(*)')
    .eq('member_id', memberId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[Milestones API] Error fetching completed milestones:', error);
    throw error;
  }

  return data as MemberMilestoneProgress[];
}

