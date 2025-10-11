/**
 * Achievement System
 * PROMPT 9: Gamification & Engagement Features
 * 
 * Manages achievements, points, streaks, and leaderboards
 */

import { supabase } from '@/lib/supabase/client';

// Types
export interface Achievement {
  id: string;
  achievement_code: string;
  name: string;
  description: string;
  category: 'assessment' | 'learning' | 'mentoring' | 'cpd' | 'mastery' | 'collaboration';
  icon: string;
  color: string;
  criteria_type: string;
  criteria_value: any;
  points_value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  display_order: number;
  is_active: boolean;
  is_hidden: boolean;
}

export interface UserAchievement {
  id: string;
  member_id: string;
  achievement_id: string;
  earned_at: string;
  points_awarded: number;
  earned_for_action: string;
  shared_publicly: boolean;
  achievement: Achievement;
}

export interface MemberStats {
  member_id: string;
  practice_id: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  total_achievements: number;
  current_assessment_streak: number;
  longest_assessment_streak: number;
  current_cpd_streak: number;
  longest_cpd_streak: number;
  assessments_completed: number;
  skills_improved: number;
  cpd_activities_completed: number;
  mentoring_sessions_completed: number;
  colleagues_helped: number;
  rank_in_practice: number | null;
}

export interface PointsTransaction {
  id: string;
  member_id: string;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'adjustment';
  points_amount: number;
  source_type: string;
  source_id?: string;
  description: string;
  base_points: number;
  multiplier: number;
  balance_after: number;
  created_at: string;
}

/**
 * Points calculation constants
 */
export const POINTS_VALUES = {
  SKILL_ASSESSMENT: 10,
  SKILL_LEVEL_INCREASE: 25,
  CPD_ACTIVITY_COMPLETED: 50,
  BECOME_MENTOR: 100,
  MENTORING_SESSION: 20,
  HELP_COLLEAGUE: 30,
};

/**
 * Streak bonus multipliers
 */
export const STREAK_MULTIPLIERS = {
  DAYS_3: 1.1,   // 10% bonus
  DAYS_7: 1.25,  // 25% bonus
  DAYS_14: 1.5,  // 50% bonus
  DAYS_30: 2.0,  // 100% bonus
};

/**
 * Get or create member stats
 */
export async function getMemberStats(memberId: string, practiceId: string): Promise<MemberStats | null> {
  try {
    let { data, error } = await supabase
      .from('member_stats')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create new stats
      const { data: newStats, error: createError } = await (supabase
        .from('member_stats') as any)
        .insert({
          member_id: memberId,
          practice_id: practiceId
        })
        .select()
        .single();

      if (createError) throw createError;
      return newStats as MemberStats;
    }

    if (error) throw error;
    return data as MemberStats;
  } catch (error) {
    console.error('Error getting member stats:', error);
    return null;
  }
}

/**
 * Award points to a member
 */
export async function awardPoints(
  memberId: string,
  practiceId: string,
  basePoints: number,
  sourceType: string,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  try {
    // Get current streak for multiplier
    const stats = await getMemberStats(memberId, practiceId);
    const streak = stats?.current_assessment_streak || 0;
    
    // Calculate multiplier based on streak
    let multiplier = 1.0;
    if (streak >= 30) multiplier = STREAK_MULTIPLIERS.DAYS_30;
    else if (streak >= 14) multiplier = STREAK_MULTIPLIERS.DAYS_14;
    else if (streak >= 7) multiplier = STREAK_MULTIPLIERS.DAYS_7;
    else if (streak >= 3) multiplier = STREAK_MULTIPLIERS.DAYS_3;
    
    const finalPoints = Math.round(basePoints * multiplier);

    // Create points transaction
    const { error } = await (supabase
      .from('points_ledger') as any)
      .insert({
        member_id: memberId,
        practice_id: practiceId,
        transaction_type: 'earned',
        points_amount: finalPoints,
        source_type: sourceType,
        source_id: sourceId,
        description: description || `Earned ${finalPoints} points`,
        base_points: basePoints,
        multiplier
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
}

/**
 * Record skill assessment completion
 */
export async function recordAssessmentCompletion(
  memberId: string,
  practiceId: string,
  assessmentId: string
): Promise<void> {
  try {
    // Award points
    await awardPoints(
      memberId,
      practiceId,
      POINTS_VALUES.SKILL_ASSESSMENT,
      'assessment',
      assessmentId,
      'Completed skill assessment'
    );

    // Update stats
    await (supabase
      .from('member_stats') as any)
      .update({
        assessments_completed: supabase.raw('assessments_completed + 1'),
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('member_id', memberId);

    // Update streak
    await updateStreak(memberId, 'assessment');
  } catch (error) {
    console.error('Error recording assessment completion:', error);
  }
}

/**
 * Record skill level increase
 */
export async function recordSkillImprovement(
  memberId: string,
  practiceId: string,
  skillId: string,
  oldLevel: number,
  newLevel: number
): Promise<void> {
  try {
    const levelsGained = newLevel - oldLevel;
    
    // Award points per level
    await awardPoints(
      memberId,
      practiceId,
      POINTS_VALUES.SKILL_LEVEL_INCREASE * levelsGained,
      'skill_improvement',
      skillId,
      `Improved skill by ${levelsGained} level(s)`
    );

    // Update stats
    await (supabase
      .from('member_stats') as any)
      .update({
        skills_improved: supabase.raw('skills_improved + 1'),
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('member_id', memberId);
  } catch (error) {
    console.error('Error recording skill improvement:', error);
  }
}

/**
 * Record CPD activity completion
 */
export async function recordCPDCompletion(
  memberId: string,
  practiceId: string,
  cpdActivityId: string
): Promise<void> {
  try {
    // Award points
    await awardPoints(
      memberId,
      practiceId,
      POINTS_VALUES.CPD_ACTIVITY_COMPLETED,
      'cpd_completion',
      cpdActivityId,
      'Completed CPD activity'
    );

    // Update stats
    await (supabase
      .from('member_stats') as any)
      .update({
        cpd_activities_completed: supabase.raw('cpd_activities_completed + 1'),
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('member_id', memberId);

    // Update CPD streak
    await updateStreak(memberId, 'cpd');
  } catch (error) {
    console.error('Error recording CPD completion:', error);
  }
}

/**
 * Record mentoring session completion
 */
export async function recordMentoringSession(
  memberId: string,
  practiceId: string,
  sessionId: string
): Promise<void> {
  try {
    // Award points
    await awardPoints(
      memberId,
      practiceId,
      POINTS_VALUES.MENTORING_SESSION,
      'mentoring',
      sessionId,
      'Completed mentoring session'
    );

    // Update stats
    await (supabase
      .from('member_stats') as any)
      .update({
        mentoring_sessions_completed: supabase.raw('mentoring_sessions_completed + 1'),
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('member_id', memberId);
  } catch (error) {
    console.error('Error recording mentoring session:', error);
  }
}

/**
 * Update streak for a member
 */
export async function updateStreak(
  memberId: string,
  activityType: 'assessment' | 'cpd' | 'mentoring'
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update or create streak history
    await (supabase
      .from('streak_history') as any)
      .upsert({
        member_id: memberId,
        activity_date: today,
        [`had_${activityType}`]: true
      }, {
        onConflict: 'member_id,activity_date'
      });

    // Calculate current streak
    const { data: history } = await supabase
      .from('streak_history')
      .select('*')
      .eq('member_id', memberId)
      .order('activity_date', { ascending: false })
      .limit(365);

    if (!history) return;

    // Count consecutive days
    let streak = 0;
    const today_date = new Date(today);
    
    for (let i = 0; i < history.length; i++) {
      const expectedDate = new Date(today_date);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
      if (history[i].activity_date === expectedStr) {
        if (activityType === 'assessment' && history[i].had_assessment) streak++;
        else if (activityType === 'cpd' && history[i].had_cpd_activity) streak++;
        else if (activityType === 'mentoring' && history[i].had_mentoring_session) streak++;
        else break;
      } else {
        break;
      }
    }

    // Update member stats
    const updateField = activityType === 'assessment' ? 'current_assessment_streak' : 'current_cpd_streak';
    const longestField = activityType === 'assessment' ? 'longest_assessment_streak' : 'longest_cpd_streak';
    
    await (supabase
      .from('member_stats') as any)
      .update({
        [updateField]: streak,
        [longestField]: supabase.raw(`GREATEST(${longestField}, ${streak})`)
      })
      .eq('member_id', memberId);
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return (data as any) || [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}

/**
 * Get member's earned achievements
 */
export async function getMemberAchievements(memberId: string): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('member_id', memberId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data as any || [];
  } catch (error) {
    console.error('Error getting member achievements:', error);
    return [];
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  practiceId: string,
  type: 'monthly_improvement' | 'department_competition' | 'mentor_of_month' | 'most_improved' | 'top_points',
  limit: number = 10
): Promise<any[]> {
  try {
    // Get from leaderboard_summary view
    let query = supabase
      .from('leaderboard_summary')
      .select('*')
      .eq('practice_id', practiceId);

    // Sort based on type
    if (type === 'top_points') {
      query = query.order('total_points', { ascending: false });
    } else if (type === 'monthly_improvement') {
      query = query.order('skills_improved', { ascending: false });
    } else if (type === 'mentor_of_month') {
      query = query.order('mentoring_sessions_completed', { ascending: false });
    } else if (type === 'most_improved') {
      query = query.order('skills_improved', { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get member's points history
 */
export async function getPointsHistory(
  memberId: string,
  limit: number = 50
): Promise<PointsTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as any || [];
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

/**
 * Create achievement notification
 */
export async function notifyAchievement(
  memberId: string,
  achievementId: string,
  notificationType: 'email' | 'slack' | 'in_app' | 'push'
): Promise<void> {
  try {
    // Get achievement details
    const { data: achievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (!achievement) return;

    // Create notification
    await (supabase
      .from('achievement_notifications') as any)
      .insert({
        member_id: memberId,
        achievement_id: achievementId,
        notification_type: notificationType,
        subject: `🎉 New Achievement: ${achievement.name}`,
        message: `Congratulations! You've earned the "${achievement.name}" achievement. ${achievement.description}`
      });
  } catch (error) {
    console.error('Error creating achievement notification:', error);
  }
}

