import { achievementEngine } from './achievement-engine';
import { milestoneTracker } from './milestone-tracker';
import { updateActivityStreak } from './leaderboard';

// =====================================================
// GAMIFICATION EVENT HOOKS
// These functions should be called from existing features
// to automatically trigger achievements and milestone progress
// =====================================================

/**
 * Call this when a member completes an assessment
 * @param memberId - The member who completed the assessment
 * @param assessmentType - Type of assessment (vark, ocean, belbin, etc.)
 */
export async function onAssessmentComplete(
  memberId: string,
  assessmentType: string
): Promise<void> {
  try {
    console.log(`[Gamification Hook] Assessment complete: ${assessmentType} for member ${memberId}`);

    // Update activity streak
    await updateActivityStreak(memberId);

    // Check achievements
    await achievementEngine.checkAndUnlockAchievements(
      memberId,
      'assessment_complete',
      { assessment_type: assessmentType }
    );

    // Update milestones
    await milestoneTracker.updateMilestoneProgress(
      memberId,
      'assessment_complete',
      1,
      { assessment_type: assessmentType }
    );
  } catch (error) {
    console.error('[Gamification Hook] Error in onAssessmentComplete:', error);
    // Don't throw - gamification failures shouldn't break the app
  }
}

/**
 * Call this when a member logs CPD activity
 * @param memberId - The member who logged CPD
 * @param hours - Number of CPD hours logged
 * @param activityId - ID of the CPD activity record
 */
export async function onCPDLog(
  memberId: string,
  hours: number,
  activityId?: string
): Promise<void> {
  try {
    console.log(`[Gamification Hook] CPD logged: ${hours} hours for member ${memberId}`);

    // Update activity streak
    await updateActivityStreak(memberId);

    // Check achievements
    await achievementEngine.checkAndUnlockAchievements(
      memberId,
      'cpd_hours',
      { hours, activity_id: activityId }
    );

    // Update milestones
    await milestoneTracker.updateMilestoneProgress(
      memberId,
      'cpd_log',
      hours,
      { activity_id: activityId }
    );
  } catch (error) {
    console.error('[Gamification Hook] Error in onCPDLog:', error);
  }
}

/**
 * Call this when a member updates their skills
 * @param memberId - The member who updated skills
 * @param skillsImproved - Number of skills that improved
 * @param skillsAtLevel4Plus - Number of skills at level 4 or higher
 */
export async function onSkillUpdate(
  memberId: string,
  skillsImproved: number = 1,
  skillsAtLevel4Plus?: number
): Promise<void> {
  try {
    console.log(`[Gamification Hook] Skills updated for member ${memberId}`);

    // Update activity streak
    await updateActivityStreak(memberId);

    // Check achievements
    await achievementEngine.checkAndUnlockAchievements(
      memberId,
      'skill_level',
      { skills_improved: skillsImproved, skills_at_level_4_plus: skillsAtLevel4Plus }
    );

    // Update milestones
    await milestoneTracker.updateMilestoneProgress(
      memberId,
      'skill_improve',
      skillsImproved,
      {}
    );
  } catch (error) {
    console.error('[Gamification Hook] Error in onSkillUpdate:', error);
  }
}

/**
 * Call this when a member logs in or performs any activity
 * @param memberId - The member who is active
 */
export async function onMemberActivity(memberId: string): Promise<void> {
  try {
    // Update activity streak
    await updateActivityStreak(memberId);
  } catch (error) {
    console.error('[Gamification Hook] Error in onMemberActivity:', error);
  }
}

/**
 * Call this to manually award points to a member (admin action)
 * @param memberId - The member to award points to
 * @param points - Number of points to award
 * @param reason - Reason for the award
 * @param awardedBy - ID of the admin who awarded the points
 */
export async function awardBonusPoints(
  memberId: string,
  points: number,
  reason: string,
  awardedBy?: string
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase/client');

    // Get existing points
    const { data: existing } = await supabase
      .from('member_points')
      .select('*')
      .eq('member_id', memberId)
      .single();

    if (existing) {
      // Update existing
      const newTotal = existing.total_points + points;
      const newBonusPoints = (existing.bonus_points || 0) + points;

      await supabase
        .from('member_points')
        .update({
          total_points: newTotal,
          bonus_points: newBonusPoints,
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
          bonus_points: points
        });
    }

    // Insert points history
    await supabase
      .from('points_history')
      .insert({
        member_id: memberId,
        points_change: points,
        points_type: 'bonus',
        reason,
        reference_type: 'manual',
        awarded_by: awardedBy
      });

    console.log(`[Gamification Hook] 💰 Awarded ${points} bonus points to member ${memberId}`);
  } catch (error) {
    console.error('[Gamification Hook] Error in awardBonusPoints:', error);
  }
}

// =====================================================
// INTEGRATION GUIDE
// =====================================================

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * Add these calls to existing features:
 * 
 * 1. VARK Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/VARKAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'vark');
 * 
 * 2. OCEAN Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/OCEANAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'ocean');
 * 
 * 3. Belbin Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/BelbinAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'belbin');
 * 
 * 4. Strengths Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/StrengthsAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'strengths');
 * 
 * 5. Motivations Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/MotivationsAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'motivations');
 * 
 * 6. EQ Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/EQAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'eq');
 * 
 * 7. Skills Assessment Complete:
 *    File: src/pages/accountancy/team/assessments/SkillsAssessmentPage.tsx
 *    Location: After successful submission
 *    Code: await onAssessmentComplete(memberId, 'skills');
 * 
 * 8. CPD Activity Logged:
 *    File: src/components/accountancy/team/CPDOverview.tsx
 *    Location: After logging CPD activity
 *    Code: await onCPDLog(memberId, hoursLogged, activityId);
 * 
 * 9. Skills Updated:
 *    File: Wherever skills are updated
 *    Location: After skill assessment update
 *    Code: await onSkillUpdate(memberId, 1);
 * 
 * 10. Member Login/Activity:
 *     File: Main app component or auth handler
 *     Location: After successful login
 *     Code: await onMemberActivity(memberId);
 */

