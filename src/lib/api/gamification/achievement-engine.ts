import { supabase } from '@/lib/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Achievement {
  id: string;
  practice_id?: string;
  category_id?: string;
  name: string;
  description: string;
  badge_icon: string;
  badge_color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  trigger_type: string;
  trigger_config: any;
  points_awarded: number;
  reward_message: string;
  is_secret: boolean;
  is_repeatable: boolean;
  is_active: boolean;
}

export interface MemberAchievement {
  id: string;
  member_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress_data: any;
  is_showcased: boolean;
  is_viewed: boolean;
  achievement?: Achievement;
}

export interface AchievementUnlockResult {
  success: boolean;
  achievement: Achievement;
  points_awarded: number;
  message: string;
}

// =====================================================
// ACHIEVEMENT ENGINE
// =====================================================

export class AchievementEngine {
  /**
   * Check and unlock achievements for a member based on an event
   */
  async checkAndUnlockAchievements(
    memberId: string,
    eventType: string,
    eventData: any = {}
  ): Promise<AchievementUnlockResult[]> {
    try {
      const unlockedAchievements: AchievementUnlockResult[] = [];

      // Get all active achievements for this event type
      const { data: achievements, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('trigger_type', eventType)
        .eq('is_active', true);

      if (error) {
        console.error('[Achievement Engine] Error fetching achievements:', error);
        return [];
      }

      if (!achievements || achievements.length === 0) {
        return [];
      }

      for (const achievement of achievements) {
        // Check if already unlocked (unless repeatable)
        if (!achievement.is_repeatable) {
          const alreadyUnlocked = await this.isUnlocked(memberId, achievement.id);
          if (alreadyUnlocked) continue;
        }

        // Check if trigger condition is met
        const conditionMet = await this.evaluateTrigger(
          memberId,
          achievement.trigger_type,
          achievement.trigger_config,
          eventData
        );

        if (conditionMet) {
          // Unlock achievement
          const unlockResult = await this.unlockAchievement(
            memberId,
            achievement.id,
            eventData
          );

          if (unlockResult.success) {
            unlockedAchievements.push(unlockResult);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('[Achievement Engine] Error in checkAndUnlockAchievements:', error);
      return [];
    }
  }

  /**
   * Check if a member has already unlocked an achievement
   */
  private async isUnlocked(memberId: string, achievementId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('member_achievements')
      .select('id')
      .eq('member_id', memberId)
      .eq('achievement_id', achievementId)
      .limit(1);

    if (error) {
      console.error('[Achievement Engine] Error checking unlock status:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Evaluate trigger condition
   */
  private async evaluateTrigger(
    memberId: string,
    triggerType: string,
    config: any,
    eventData: any
  ): Promise<boolean> {
    switch (triggerType) {
      case 'assessment_complete':
        return this.checkAssessmentComplete(memberId, config);

      case 'cpd_hours':
        return this.checkCPDHours(memberId, config);

      case 'skill_level':
        return this.checkSkillLevel(memberId, config);

      case 'streak':
        return this.checkStreak(memberId, config);

      case 'custom':
        return this.evaluateCustomSQL(memberId, config.sql_query);

      default:
        console.warn(`[Achievement Engine] Unknown trigger type: ${triggerType}`);
        return false;
    }
  }

  /**
   * Check assessment completion trigger
   */
  private async checkAssessmentComplete(memberId: string, config: any): Promise<boolean> {
    const { count = 1, assessment_type } = config;

    // Get member's invitation record
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('practice_member_id', memberId)
      .single();

    if (error || !invitation) {
      return false;
    }

    // If specific assessment type requested
    if (assessment_type) {
      const fieldMap: Record<string, string> = {
        vark: 'vark_results',
        ocean: 'ocean_results',
        belbin: 'belbin_primary',
        strengths: 'strengths_data',
        motivations: 'motivations_data',
        eq: 'eq_results',
        skills: 'assessment_data'
      };

      const field = fieldMap[assessment_type];
      return field && invitation[field] != null;
    }

    // Count total completed assessments
    const completedCount = [
      invitation.vark_results,
      invitation.ocean_results,
      invitation.belbin_primary,
      invitation.strengths_data,
      invitation.motivations_data,
      invitation.eq_results,
      invitation.assessment_data
    ].filter(val => val != null).length;

    return completedCount >= count;
  }

  /**
   * Check CPD hours trigger
   */
  private async checkCPDHours(memberId: string, config: any): Promise<boolean> {
    const { hours_target = 0, period } = config;

    // Get member's CPD hours
    const { data: member, error } = await supabase
      .from('practice_members')
      .select('cpd_completed_hours')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      return false;
    }

    // If period specified, calculate within period
    if (period) {
      const startDate = this.getPeriodStartDate(period);
      const { data: activities } = await supabase
        .from('cpd_activities')
        .select('hours_claimed, activity_date')
        .eq('practice_member_id', memberId)
        .gte('activity_date', startDate);

      const periodHours = activities?.reduce((sum, a) => sum + (a.hours_claimed || 0), 0) || 0;
      return periodHours >= hours_target;
    }

    return member.cpd_completed_hours >= hours_target;
  }

  /**
   * Check skill level trigger
   */
  private async checkSkillLevel(memberId: string, config: any): Promise<boolean> {
    const { skills_improved, min_improvement, skills_at_level, target_level } = config;

    const { data: skills, error } = await supabase
      .from('skill_assessments')
      .select('current_level')
      .eq('team_member_id', memberId);

    if (error || !skills) {
      return false;
    }

    // Check skills_improved condition
    if (skills_improved) {
      // Note: This requires baseline tracking - for now, check current levels
      const improvedSkills = skills.filter(s => s.current_level >= (min_improvement || 2));
      return improvedSkills.length >= skills_improved;
    }

    // Check skills_at_level condition
    if (skills_at_level && target_level) {
      const skilledCount = skills.filter(s => s.current_level >= target_level).length;
      return skilledCount >= skills_at_level;
    }

    return false;
  }

  /**
   * Check streak trigger
   */
  private async checkStreak(memberId: string, config: any): Promise<boolean> {
    const { consecutive_days = 0 } = config;

    const { data: points, error } = await supabase
      .from('member_points')
      .select('current_streak_days')
      .eq('member_id', memberId)
      .single();

    if (error || !points) {
      return false;
    }

    return points.current_streak_days >= consecutive_days;
  }

  /**
   * Evaluate custom SQL query
   */
  private async evaluateCustomSQL(memberId: string, sqlQuery: string): Promise<boolean> {
    // Security note: This should be used with caution and only for admin-defined queries
    // For MVP, we'll return false and implement specific logic as needed
    console.warn('[Achievement Engine] Custom SQL evaluation not yet implemented');
    return false;
  }

  /**
   * Unlock achievement for member
   */
  private async unlockAchievement(
    memberId: string,
    achievementId: string,
    eventData: any
  ): Promise<AchievementUnlockResult> {
    try {
      // Get achievement details
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (achievementError || !achievement) {
        throw new Error('Achievement not found');
      }

      // Insert member achievement
      const { error: insertError } = await supabase
        .from('member_achievements')
        .insert({
          member_id: memberId,
          achievement_id: achievementId,
          progress_data: eventData,
          is_viewed: false
        });

      if (insertError) {
        throw insertError;
      }

      // Award points
      if (achievement.points_awarded > 0) {
        await this.awardPoints(
          memberId,
          achievement.points_awarded,
          'achievement',
          `Unlocked: ${achievement.name}`,
          achievementId
        );
      }

      console.log(`[Achievement Engine] ✅ Unlocked: ${achievement.name} for member ${memberId}`);

      return {
        success: true,
        achievement,
        points_awarded: achievement.points_awarded,
        message: achievement.reward_message
      };
    } catch (error) {
      console.error('[Achievement Engine] Error unlocking achievement:', error);
      return {
        success: false,
        achievement: {} as Achievement,
        points_awarded: 0,
        message: 'Failed to unlock achievement'
      };
    }
  }

  /**
   * Award points to member
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
        // Update existing
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
        // Insert new
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
          reference_type: pointsType,
          reference_id: referenceId
        });

      console.log(`[Achievement Engine] 💰 Awarded ${points} points to member ${memberId}`);
    } catch (error) {
      console.error('[Achievement Engine] Error awarding points:', error);
    }
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
        return new Date(0).toISOString(); // Beginning of time
    }
  }
}

// =====================================================
// API FUNCTIONS
// =====================================================

export const achievementEngine = new AchievementEngine();

/**
 * Get all achievements
 */
export async function getAchievements(practiceId?: string) {
  let query = supabase
    .from('achievements')
    .select('*, category:achievement_categories(*)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (practiceId) {
    query = query.eq('practice_id', practiceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Achievements API] Error fetching achievements:', error);
    throw error;
  }

  return data;
}

/**
 * Get member's unlocked achievements
 */
export async function getMemberAchievements(memberId: string) {
  const { data, error } = await supabase
    .from('member_achievements')
    .select('*, achievement:achievements(*)')
    .eq('member_id', memberId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('[Achievements API] Error fetching member achievements:', error);
    throw error;
  }

  return data as MemberAchievement[];
}

/**
 * Get member's unviewed achievements
 */
export async function getUnviewedAchievements(memberId: string) {
  const { data, error } = await supabase
    .from('member_achievements')
    .select('*, achievement:achievements(*)')
    .eq('member_id', memberId)
    .eq('is_viewed', false)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('[Achievements API] Error fetching unviewed achievements:', error);
    throw error;
  }

  return data as MemberAchievement[];
}

/**
 * Mark achievements as viewed
 */
export async function markAchievementsAsViewed(memberAchievementIds: string[]) {
  const { error } = await supabase
    .from('member_achievements')
    .update({ is_viewed: true })
    .in('id', memberAchievementIds);

  if (error) {
    console.error('[Achievements API] Error marking achievements as viewed:', error);
    throw error;
  }
}

/**
 * Get member points
 */
export async function getMemberPoints(memberId: string) {
  const { data, error } = await supabase
    .from('member_points')
    .select('*')
    .eq('member_id', memberId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is ok
    console.error('[Achievements API] Error fetching member points:', error);
    throw error;
  }

  return data || {
    member_id: memberId,
    total_points: 0,
    assessment_points: 0,
    cpd_points: 0,
    skill_points: 0,
    achievement_points: 0,
    bonus_points: 0,
    current_streak_days: 0,
    longest_streak_days: 0
  };
}

/**
 * Get points history
 */
export async function getPointsHistory(memberId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('points_history')
    .select('*')
    .eq('member_id', memberId)
    .order('awarded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Achievements API] Error fetching points history:', error);
    throw error;
  }

  return data;
}

