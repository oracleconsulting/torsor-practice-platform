import { supabase } from '@/lib/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LeaderboardEntry {
  member_id: string;
  member_name: string;
  member_role: string;
  total_points: number;
  current_rank: number;
  previous_rank?: number;
  rank_change: number; // positive = moved up, negative = moved down
  assessment_points: number;
  cpd_points: number;
  skill_points: number;
  achievement_points: number;
  current_streak_days: number;
  longest_streak_days: number;
  achievements_unlocked: number;
  milestones_completed: number;
}

export interface StreakInfo {
  member_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
}

// =====================================================
// LEADERBOARD API
// =====================================================

/**
 * Get leaderboard for a practice
 */
export async function getLeaderboard(
  practiceId: string,
  limit: number = 50,
  period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
): Promise<LeaderboardEntry[]> {
  try {
    // Get all members in practice
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name, role, practice_id')
      .eq('practice_id', practiceId)
      .or('is_test_account.is.null,is_test_account.eq.false'); // Exclude test accounts

    if (membersError) throw membersError;

    const memberIds = members?.map(m => m.id) || [];
    if (memberIds.length === 0) return [];

    // Get points for all members
    const { data: pointsData, error: pointsError } = await supabase
      .from('member_points')
      .select('*')
      .in('member_id', memberIds)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (pointsError) throw pointsError;

    // Get achievement counts
    const { data: achievementCounts } = await supabase
      .from('member_achievements')
      .select('member_id')
      .in('member_id', memberIds);

    // Get milestone completion counts
    const { data: milestoneCounts } = await supabase
      .from('member_milestone_progress')
      .select('member_id')
      .in('member_id', memberIds)
      .eq('status', 'completed');

    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = pointsData?.map((points, index) => {
      const member = members.find(m => m.id === points.member_id);
      const achievementsCount = achievementCounts?.filter(a => a.member_id === points.member_id).length || 0;
      const milestonesCount = milestoneCounts?.filter(m => m.member_id === points.member_id).length || 0;

      const rankChange = points.previous_rank 
        ? points.previous_rank - (index + 1) 
        : 0;

      return {
        member_id: points.member_id,
        member_name: member?.name || 'Unknown',
        member_role: member?.role || 'Unknown',
        total_points: points.total_points,
        current_rank: index + 1,
        previous_rank: points.previous_rank,
        rank_change: rankChange,
        assessment_points: points.assessment_points || 0,
        cpd_points: points.cpd_points || 0,
        skill_points: points.skill_points || 0,
        achievement_points: points.achievement_points || 0,
        current_streak_days: points.current_streak_days || 0,
        longest_streak_days: points.longest_streak_days || 0,
        achievements_unlocked: achievementsCount,
        milestones_completed: milestonesCount
      };
    }) || [];

    return leaderboard;
  } catch (error) {
    console.error('[Leaderboard API] Error fetching leaderboard:', error);
    throw error;
  }
}

/**
 * Get member's leaderboard position
 */
export async function getMemberLeaderboardPosition(
  memberId: string
): Promise<LeaderboardEntry | null> {
  try {
    // Get member's points
    const { data: points, error: pointsError } = await supabase
      .from('member_points')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (pointsError || !points) return null;

    // Get member info
    const { data: member, error: memberError } = await supabase
      .from('practice_members')
      .select('id, name, role, practice_id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) return null;

    // Calculate rank (count how many have more points)
    const { count: higherCount } = await supabase
      .from('member_points')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', points.total_points);

    const currentRank = (higherCount || 0) + 1;

    // Get achievement and milestone counts
    const { count: achievementsCount } = await supabase
      .from('member_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    const { count: milestonesCount } = await supabase
      .from('member_milestone_progress')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('status', 'completed');

    const rankChange = points.previous_rank 
      ? points.previous_rank - currentRank 
      : 0;

    return {
      member_id: memberId,
      member_name: member.name,
      member_role: member.role,
      total_points: points.total_points,
      current_rank: currentRank,
      previous_rank: points.previous_rank,
      rank_change: rankChange,
      assessment_points: points.assessment_points || 0,
      cpd_points: points.cpd_points || 0,
      skill_points: points.skill_points || 0,
      achievement_points: points.achievement_points || 0,
      current_streak_days: points.current_streak_days || 0,
      longest_streak_days: points.longest_streak_days || 0,
      achievements_unlocked: achievementsCount || 0,
      milestones_completed: milestonesCount || 0
    };
  } catch (error) {
    console.error('[Leaderboard API] Error fetching member position:', error);
    return null;
  }
}

/**
 * Update leaderboard rankings (run periodically)
 */
export async function updateLeaderboardRankings(practiceId?: string): Promise<void> {
  try {
    let memberQuery = supabase
      .from('practice_members')
      .select('id');

    if (practiceId) {
      memberQuery = memberQuery.eq('practice_id', practiceId);
    }

    const { data: members } = await memberQuery;
    const memberIds = members?.map(m => m.id) || [];

    // Get all points ordered by total
    const { data: pointsData } = await supabase
      .from('member_points')
      .select('*')
      .in('member_id', memberIds)
      .order('total_points', { ascending: false });

    // Update ranks
    for (let i = 0; i < (pointsData?.length || 0); i++) {
      const points = pointsData![i];
      await supabase
        .from('member_points')
        .update({
          previous_rank: points.current_rank,
          current_rank: i + 1,
          updated_at: new Date().toISOString()
        })
        .eq('member_id', points.member_id);
    }

    console.log(`[Leaderboard API] ♻️  Updated rankings for ${pointsData?.length || 0} members`);
  } catch (error) {
    console.error('[Leaderboard API] Error updating rankings:', error);
  }
}

// =====================================================
// STREAK TRACKER
// =====================================================

/**
 * Update member's activity streak
 */
export async function updateActivityStreak(memberId: string): Promise<void> {
  try {
    const { data: points, error: fetchError } = await supabase
      .from('member_points')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = points?.last_activity_date;

    let newStreakDays = 1;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change
        return;
      } else if (diffDays === 1) {
        // Consecutive day
        newStreakDays = (points.current_streak_days || 0) + 1;
      } else {
        // Streak broken
        newStreakDays = 1;
      }
    }

    const longestStreak = Math.max(
      points?.longest_streak_days || 0,
      newStreakDays
    );

    if (points) {
      // Update existing
      await supabase
        .from('member_points')
        .update({
          current_streak_days: newStreakDays,
          longest_streak_days: longestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('member_id', memberId);
    } else {
      // Insert new
      await supabase
        .from('member_points')
        .insert({
          member_id: memberId,
          total_points: 0,
          current_streak_days: newStreakDays,
          longest_streak_days: longestStreak,
          last_activity_date: today
        });
    }

    // Check for streak achievements
    const { achievementEngine } = await import('./achievement-engine');
    await achievementEngine.checkAndUnlockAchievements(
      memberId,
      'streak',
      { consecutive_days: newStreakDays }
    );

    console.log(`[Streak Tracker] ✅ Updated streak for member ${memberId}: ${newStreakDays} days`);
  } catch (error) {
    console.error('[Streak Tracker] Error updating streak:', error);
  }
}

/**
 * Get streak info for member
 */
export async function getStreakInfo(memberId: string): Promise<StreakInfo | null> {
  try {
    const { data, error } = await supabase
      .from('member_points')
      .select('member_id, current_streak_days, longest_streak_days, last_activity_date')
      .eq('member_id', memberId)
      .single();

    if (error || !data) return null;

    return data as StreakInfo;
  } catch (error) {
    console.error('[Streak Tracker] Error fetching streak info:', error);
    return null;
  }
}

/**
 * Get top streaks in practice
 */
export async function getTopStreaks(practiceId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get all members in practice
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name, role')
      .eq('practice_id', practiceId)
      .or('is_test_account.is.null,is_test_account.eq.false');

    if (membersError) throw membersError;

    const memberIds = members?.map(m => m.id) || [];

    // Get points ordered by current streak
    const { data: pointsData, error: pointsError } = await supabase
      .from('member_points')
      .select('*')
      .in('member_id', memberIds)
      .order('current_streak_days', { ascending: false })
      .limit(limit);

    if (pointsError) throw pointsError;

    // Build entries
    const streakLeaderboard: LeaderboardEntry[] = pointsData?.map((points, index) => {
      const member = members.find(m => m.id === points.member_id);
      return {
        member_id: points.member_id,
        member_name: member?.name || 'Unknown',
        member_role: member?.role || 'Unknown',
        total_points: points.total_points,
        current_rank: index + 1,
        rank_change: 0,
        assessment_points: points.assessment_points || 0,
        cpd_points: points.cpd_points || 0,
        skill_points: points.skill_points || 0,
        achievement_points: points.achievement_points || 0,
        current_streak_days: points.current_streak_days || 0,
        longest_streak_days: points.longest_streak_days || 0,
        achievements_unlocked: 0,
        milestones_completed: 0
      };
    }) || [];

    return streakLeaderboard;
  } catch (error) {
    console.error('[Leaderboard API] Error fetching top streaks:', error);
    throw error;
  }
}

