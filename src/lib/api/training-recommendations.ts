/**
 * Training Recommendations API
 * Handles caching and retrieval of AI-generated training recommendations
 */

import { supabase } from '@/lib/supabase/client';
import {
  generateTrainingRecommendations,
  identifyGroupTrainingOpportunities,
  generateLearningPath,
  type TeamMemberProfile,
  type RecommendationAnalysis,
  type LearningPath,
  type GroupTrainingOpportunity,
  type TrainingRecommendation
} from '@/services/ai/trainingRecommendations';

/**
 * Get cached recommendations or generate new ones
 */
export async function getTrainingRecommendations(
  profile: TeamMemberProfile
): Promise<RecommendationAnalysis> {
  try {
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('training_recommendations_cache')
      .select('*')
      .eq('team_member_id', profile.id)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      console.log('Using cached recommendations');
      const cachedData = cached as any;
      return {
        topRecommendations: cachedData.top_recommendations,
        quickWins: cachedData.quick_wins || [],
        strategicInvestments: cachedData.strategic_investments || [],
        groupOpportunities: [],
        totalEstimatedHours: cachedData.total_estimated_hours,
        totalEstimatedCost: parseFloat(cachedData.total_estimated_cost),
        averageSuccessProbability: cachedData.average_success_probability
      };
    }

    // Generate new recommendations
    console.log('Generating new recommendations');
    const analysis = await generateTrainingRecommendations(profile);

    // Cache the results
    await cacheRecommendations(profile, analysis);

    return analysis;
  } catch (error) {
    console.error('Error getting training recommendations:', error);
    throw error;
  }
}

/**
 * Cache recommendations for 7 days
 */
async function cacheRecommendations(
  profile: TeamMemberProfile,
  analysis: RecommendationAnalysis
): Promise<void> {
  const cacheData = {
    team_member_id: profile.id,
    profile_snapshot: {
      role: profile.role,
      department: profile.department,
      learningStyle: profile.learningStyle,
      skillGaps: profile.skillGaps.map(g => ({
        skillId: g.skillId,
        gap: g.gap,
        interestLevel: g.interestLevel
      }))
    },
    top_recommendations: analysis.topRecommendations,
    quick_wins: analysis.quickWins,
    strategic_investments: analysis.strategicInvestments,
    total_estimated_hours: analysis.totalEstimatedHours,
    total_estimated_cost: analysis.totalEstimatedCost,
    average_success_probability: analysis.averageSuccessProbability,
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    is_valid: true
  };

  const { error } = await (supabase
    .from('training_recommendations_cache') as any)
    .upsert(cacheData, { onConflict: 'team_member_id' });

  if (error) {
    console.error('Error caching recommendations:', error);
  }
}

/**
 * Get team-wide group training opportunities
 */
export async function getGroupTrainingOpportunities(
  practiceId: string,
  teamProfiles: TeamMemberProfile[]
): Promise<GroupTrainingOpportunity[]> {
  try {
    // Check cache first
    const { data: cached } = await supabase
      .from('group_training_opportunities')
      .select('*')
      .eq('practice_id', practiceId)
      .eq('status', 'identified')
      .gte('identified_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (cached && cached.length > 0) {
      return cached.map((c: any) => ({
        skillName: c.skill_name,
        members: [],
        memberCount: c.member_count,
        averageGap: parseFloat(c.average_gap),
        recommendation: c.recommendation,
        costSavings: parseFloat(c.cost_savings)
      }));
    }

    // Generate new opportunities
    const opportunities = identifyGroupTrainingOpportunities(teamProfiles);

    // Cache them
    for (const opp of opportunities) {
      await (supabase.from('group_training_opportunities') as any).insert({
        practice_id: practiceId,
        skill_name: opp.skillName,
        member_ids: teamProfiles
          .filter(p => opp.members.includes(p.name))
          .map(p => p.id),
        member_count: opp.memberCount,
        average_gap: opp.averageGap,
        recommendation: opp.recommendation,
        individual_cost: opp.memberCount * 500,
        group_cost: opp.recommendation.estimatedCost,
        cost_savings: opp.costSavings,
        status: 'identified'
      });
    }

    return opportunities;
  } catch (error) {
    console.error('Error getting group opportunities:', error);
    return [];
  }
}

/**
 * Create and save a learning path
 */
export async function createLearningPath(
  profile: TeamMemberProfile,
  recommendations: TrainingRecommendation[],
  userId: string
): Promise<LearningPath> {
  try {
    const path = await generateLearningPath(profile, recommendations);

    const { data, error } = await (supabase
      .from('learning_paths') as any)
      .insert({
        team_member_id: profile.id,
        duration_months: path.duration,
        total_hours: path.totalHours,
        total_cost: path.totalCost,
        success_probability: path.successProbability,
        recommendations: path.recommendations,
        milestones: path.milestones,
        status: 'draft',
        created_by: userId
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('No data returned');

    return {
      ...path,
      id: data.id
    };
  } catch (error) {
    console.error('Error creating learning path:', error);
    throw error;
  }
}

/**
 * Get learning path for a team member
 */
export async function getLearningPath(teamMemberId: string): Promise<LearningPath | null> {
  try {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .in('status', ['draft', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const pathData = data as any;
    return {
      id: pathData.id,
      memberId: pathData.team_member_id,
      memberName: '',
      createdAt: pathData.created_at,
      duration: pathData.duration_months,
      totalHours: pathData.total_hours,
      totalCost: parseFloat(pathData.total_cost),
      recommendations: pathData.recommendations,
      milestones: pathData.milestones,
      successProbability: pathData.success_probability
    };
  } catch (error) {
    console.error('Error getting learning path:', error);
    return null;
  }
}

/**
 * Update learning path status
 */
export async function updateLearningPathStatus(
  pathId: string,
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned',
  startDate?: string
): Promise<void> {
  const updates: any = { status };
  
  if (startDate) {
    updates.start_date = startDate;
    if (status === 'active') {
      const target = new Date(startDate);
      target.setMonth(target.getMonth() + 6);
      updates.target_completion_date = target.toISOString().split('T')[0];
    }
  }

  if (status === 'completed') {
    updates.actual_completion_date = new Date().toISOString().split('T')[0];
    updates.completion_percentage = 100;
  }

  await (supabase
    .from('learning_paths') as any)
    .update(updates)
    .eq('id', pathId);
}

/**
 * Submit recommendation feedback
 */
export async function submitRecommendationFeedback(
  teamMemberId: string,
  recommendationId: string,
  feedback: {
    rating: number;
    wasHelpful: boolean;
    wasCompleted: boolean;
    feedbackText?: string;
    actualHours?: number;
    actualCost?: number;
    skillImprovement?: number;
  }
): Promise<void> {
  await (supabase.from('recommendation_feedback') as any).insert({
    team_member_id: teamMemberId,
    recommendation_id: recommendationId,
    rating: feedback.rating,
    was_helpful: feedback.wasHelpful,
    was_completed: feedback.wasCompleted,
    feedback_text: feedback.feedbackText,
    actual_hours: feedback.actualHours,
    actual_cost: feedback.actualCost,
    skill_improvement: feedback.skillImprovement,
    completion_date: feedback.wasCompleted ? new Date().toISOString().split('T')[0] : null
  });
}

/**
 * Invalidate cache manually
 */
export async function invalidateRecommendationsCache(teamMemberId: string): Promise<void> {
  await (supabase
    .from('training_recommendations_cache') as any)
    .update({
      is_valid: false,
      invalidation_reason: 'Manual invalidation'
    })
    .eq('team_member_id', teamMemberId);
}

/**
 * Clean expired caches
 */
export async function cleanExpiredCaches(): Promise<number> {
  const { data, error } = await supabase.rpc('clean_expired_recommendation_caches');
  
  if (error) {
    console.error('Error cleaning expired caches:', error);
    return 0;
  }
  
  return data || 0;
}

