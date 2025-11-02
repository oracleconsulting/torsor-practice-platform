/**
 * CPD-Skills Integration Bridge API
 * PROMPT 5 Implementation
 * 
 * Connects CPD activities with skill improvements
 */

import { supabase } from '@/lib/supabase/client';

// Types
export interface CPDSkillMapping {
  id: string;
  cpd_activity_id: string;
  skill_id: string;
  member_id: string;
  skill_level_before: number;
  expected_level_after: number;
  actual_level_after?: number;
  improvement_achieved?: number;
  improvement_expected?: number;
  effectiveness_percentage?: number;
  pre_assessment_completed: boolean;
  post_assessment_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface SkillImprovementTracking {
  id: string;
  member_id: string;
  skill_id: string;
  level_before: number;
  level_after: number;
  change_amount: number;
  change_reason: string;
  cpd_activity_id?: string;
  mentoring_relationship_id?: string;
  investment_hours?: number;
  investment_cost?: number;
  roi_score?: number;
  evidence_notes?: string;
  changed_at: string;
}

export interface CPDRecommendation {
  id: string;
  member_id: string;
  skill_id: string;
  skill_name: string;
  current_skill_level: number;
  target_skill_level: number;
  skill_gap: number;
  interest_level: number;
  recommended_cpd_type: string;
  recommended_provider?: string;
  estimated_hours: number;
  estimated_cost: number;
  expected_improvement: number;
  priority_score: number;
  business_impact: string;
  urgency: string;
  status: string;
  historical_effectiveness?: number;
}

export interface ROIDashboardData {
  member_id: string;
  member_name: string;
  role: string;
  total_cpd_activities: number;
  total_cpd_hours: number;
  total_cpd_cost: number;
  skills_targeted: number;
  avg_improvement_achieved: number;
  avg_effectiveness_percentage: number;
  hours_per_skill_level: number;
  cost_per_skill_level: number;
  current_avg_skill_level: number;
}

/**
 * Link a CPD activity to skills it targets
 */
export async function createCPDSkillMapping(
  cpdActivityId: string,
  skillId: string,
  memberId: string,
  skillLevelBefore: number,
  expectedLevelAfter: number,
  notes?: string
): Promise<{ success: boolean; mappingId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('cpd_skill_mappings') as any)
      .insert({
        cpd_activity_id: cpdActivityId,
        skill_id: skillId,
        member_id: memberId,
        skill_level_before: skillLevelBefore,
        expected_level_after: expectedLevelAfter,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating CPD skill mapping:', error);
      return { success: false, error: error.message };
    }

    return { success: true, mappingId: data.id };
  } catch (error: any) {
    console.error('Error creating CPD skill mapping:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update actual skill level after CPD completion
 */
export async function updateActualSkillLevel(
  mappingId: string,
  actualLevelAfter: number
): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('cpd_skill_mappings') as any)
      .update({
        actual_level_after: actualLevelAfter,
        post_assessment_completed: true,
        post_assessment_date: new Date().toISOString()
      })
      .eq('id', mappingId);

    if (error) {
      console.error('Error updating actual skill level:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating actual skill level:', error);
    return false;
  }
}

/**
 * Get CPD skill mappings for an activity
 */
export async function getCPDSkillMappings(cpdActivityId: string): Promise<CPDSkillMapping[]> {
  try {
    const { data, error } = await supabase
      .from('cpd_skill_mappings')
      .select('*')
      .eq('cpd_activity_id', cpdActivityId);

    if (error) {
      console.error('Error fetching CPD skill mappings:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching CPD skill mappings:', error);
    return [];
  }
}

/**
 * Track a skill improvement
 */
export async function trackSkillImprovement(improvement: {
  memberId: string;
  skillId: string;
  levelBefore: number;
  levelAfter: number;
  changeReason: string;
  cpdActivityId?: string;
  mentoringRelationshipId?: string;
  investmentHours?: number;
  investmentCost?: number;
  evidenceNotes?: string;
}): Promise<{ success: boolean; trackingId?: string; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('skill_improvement_tracking') as any)
      .insert({
        member_id: improvement.memberId,
        skill_id: improvement.skillId,
        level_before: improvement.levelBefore,
        level_after: improvement.levelAfter,
        change_reason: improvement.changeReason,
        cpd_activity_id: improvement.cpdActivityId,
        mentoring_relationship_id: improvement.mentoringRelationshipId,
        investment_hours: improvement.investmentHours,
        investment_cost: improvement.investmentCost,
        evidence_notes: improvement.evidenceNotes
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking skill improvement:', error);
      return { success: false, error: error.message };
    }

    return { success: true, trackingId: data.id };
  } catch (error: any) {
    console.error('Error tracking skill improvement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get skill improvement history for a member
 */
export async function getSkillImprovementHistory(memberId: string): Promise<SkillImprovementTracking[]> {
  try {
    const { data, error } = await supabase
      .from('skill_improvement_tracking')
      .select('*')
      .eq('member_id', memberId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching skill improvement history:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching skill improvement history:', error);
    return [];
  }
}

/**
 * Get smart CPD recommendations for a member
 */
export async function getCPDRecommendations(memberId: string): Promise<CPDRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from('smart_cpd_suggestions')
      .select('*')
      .eq('member_id', memberId)
      .in('status', ['suggested', 'viewed', 'accepted'])
      .order('priority_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching CPD recommendations:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching CPD recommendations:', error);
    return [];
  }
}

/**
 * Generate CPD recommendations based on skill gaps
 */
export async function generateCPDRecommendations(
  memberId: string,
  skillGaps: Array<{ 
    skillId: string; 
    skillName?: string;
    category?: string;
    currentLevel: number; 
    targetLevel: number; 
    interestLevel: number; 
    businessImpact: string 
  }>
): Promise<boolean> {
  try {
    // First, delete existing recommendations for this member
    const { error: deleteError } = await supabase
      .from('cpd_recommendations')
      .delete()
      .eq('member_id', memberId);

    if (deleteError) {
      console.error('Error deleting old recommendations:', deleteError);
      // Continue anyway - might be first time generating
    }

    const recommendations = skillGaps.map(gap => {
      const skillGap = gap.targetLevel - gap.currentLevel;
      const skillName = gap.skillName || 'Unknown Skill';
      const category = gap.category || 'General';
      
      return {
        member_id: memberId,
        skill_id: gap.skillId,
        current_skill_level: gap.currentLevel,
        target_skill_level: gap.targetLevel,
        interest_level: gap.interestLevel,
        business_impact: gap.businessImpact,
        recommended_cpd_type: suggestCPDTypeForSkill(skillName, category, skillGap),
        estimated_hours: estimateHours(skillGap),
        estimated_cost: estimateCost(skillGap),
        expected_improvement: Math.min(gap.targetLevel - gap.currentLevel, 2), // Max 2 levels per activity
        priority_score: calculatePriorityScore(gap),
        urgency: determineUrgency(gap.businessImpact)
      };
    });

    // Insert new recommendations
    const { error } = await (supabase
      .from('cpd_recommendations') as any)
      .insert(recommendations);

    if (error) {
      console.error('Error generating CPD recommendations:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error generating CPD recommendations:', error);
    return false;
  }
}

/**
 * Auto-generate CPD recommendations based on member's skill assessments
 * Identifies skill gaps and creates recommendations for improvement
 */
export async function autoGenerateCPDRecommendations(memberId: string): Promise<boolean> {
  try {
    console.log('[CPD] Auto-generating recommendations for member:', memberId);
    console.log('[CPD] Member ID type:', typeof memberId, 'value:', memberId);

    // Get all skill assessments for this member with skill details
    // Note: target_level doesn't exist in schema, we'll calculate it as 4 (Proficient) or use required_level from skills
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select(`
        id,
        skill_id,
        current_level,
        interest_level,
        skill:skills (
          id,
          name,
          category,
          description,
          required_level
        )
      `)
      .eq('team_member_id', memberId);

    console.log('[CPD] Query response:', {
      assessments: assessments,
      count: assessments?.length || 0,
      error: assessError,
      memberId: memberId
    });

    if (assessError) {
      console.error('[CPD] Error fetching skill assessments:', assessError);
      return false;
    }

    console.log('[CPD] Query returned:', assessments?.length || 0, 'assessments');

    if (!assessments || assessments.length === 0) {
      console.log('[CPD] ❌ No skill assessments found');
      console.log('[CPD] ⚠️ USER ACTION REQUIRED: Please complete a Skills Assessment first!');
      console.log('[CPD] Navigate to: Complete Assessments > Start Skills Assessment');
      return false;
    }

    console.log(`[CPD] ✅ Found ${assessments.length} skill assessments`);

    // Identify skills that need improvement (level < 4)
    // Target level is skill's required_level or 4 (Proficient) as default
    const skillGaps = assessments
      .filter(assessment => {
        const currentLevel = (assessment as any).current_level || 0;
        return currentLevel < 4; // Skills below "Proficient"
      })
      .map(assessment => {
        const ass = assessment as any;
        const skill = ass.skill;
        const currentLevel = ass.current_level || 0;
        const targetLevel = skill?.required_level || 4; // Use skill's required level or default to 4
        const gap = targetLevel - currentLevel;
        
        // Determine business impact based on skill level gap
        let businessImpact = 'medium';
        if (gap >= 3) businessImpact = 'critical'; // Beginner → Proficient
        else if (gap === 2) businessImpact = 'high';
        else if (gap === 1) businessImpact = 'low';

        return {
          skillId: ass.skill_id,
          skillName: skill?.name || 'Unknown Skill',
          category: skill?.category || 'General',
          currentLevel,
          targetLevel,
          interestLevel: ass.interest_level || 3, // Use actual interest level or default
          businessImpact
        };
      });

    if (skillGaps.length === 0) {
      console.log('[CPD] No skill gaps found - member is proficient in all skills!');
      return true; // Success, but no recommendations needed
    }

    console.log(`[CPD] Identified ${skillGaps.length} skill gaps, generating recommendations...`);

    // Generate recommendations using existing function
    const success = await generateCPDRecommendations(memberId, skillGaps);

    if (success) {
      console.log(`[CPD] Successfully generated ${skillGaps.length} recommendations`);
    }

    return success;
  } catch (error) {
    console.error('[CPD] Error auto-generating recommendations:', error);
    return false;
  }
}

/**
 * Get ROI dashboard data
 */
export async function getROIDashboardData(practiceId?: string): Promise<ROIDashboardData[]> {
  try {
    let query = supabase.from('cpd_roi_dashboard').select('*');
    
    if (practiceId) {
      // Would need to join with practice_members if we have practice_id filter
      // For now, return all
    }

    const { data, error } = await query.order('cost_per_skill_level', { ascending: true, nullsLast: true });

    if (error) {
      console.error('Error fetching ROI dashboard data:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching ROI dashboard data:', error);
    return [];
  }
}

/**
 * Get ROI data for a specific member
 */
export async function getMemberROIData(memberId: string): Promise<ROIDashboardData | null> {
  try {
    const { data, error } = await supabase
      .from('cpd_roi_dashboard')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) {
      console.error('[CPD ROI] Error fetching member ROI data:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('[CPD ROI] Error fetching member ROI data:', error);
    return null;
  }
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  status: 'viewed' | 'accepted' | 'dismissed',
  dismissalReason?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      [`${status}_at`]: new Date().toISOString()
    };

    if (dismissalReason) {
      updates.dismissal_reason = dismissalReason;
    }

    const { error } = await (supabase
      .from('cpd_recommendations') as any)
      .update(updates)
      .eq('id', recommendationId);

    if (error) {
      console.error('Error updating recommendation status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return false;
  }
}

/**
 * Get pending assessment reminders for a member
 */
export async function getPendingAssessmentReminders(memberId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('skill_assessment_reminders')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching assessment reminders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching assessment reminders:', error);
    return [];
  }
}

/**
 * Complete an assessment reminder
 */
export async function completeAssessmentReminder(reminderId: string): Promise<boolean> {
  try {
    const { error } = await (supabase
      .from('skill_assessment_reminders') as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', reminderId);

    if (error) {
      console.error('Error completing assessment reminder:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing assessment reminder:', error);
    return false;
  }
}

/**
 * Calculate CPD effectiveness scores
 */
export async function calculateEffectivenessScores(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('calculate_cpd_effectiveness_scores');

    if (error) {
      console.error('Error calculating effectiveness scores:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calculating effectiveness scores:', error);
    return false;
  }
}

// Helper functions

function suggestCPDType(skillGap: number): string {
  if (skillGap <= 1) return 'Online Course';
  if (skillGap === 2) return 'Workshop';
  return 'Formal Training Program';
}

/**
 * Suggest specific CPD type based on skill name, category, and gap level
 */
function suggestCPDTypeForSkill(skillName: string, category: string, skillGap: number): string {
  const lowerSkill = skillName.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  // Technical/software skills - favor practical learning
  if (lowerSkill.includes('xero') || lowerSkill.includes('quickbooks') || 
      lowerSkill.includes('sage') || lowerSkill.includes('software') ||
      lowerCategory.includes('cloud') || lowerCategory.includes('digital')) {
    if (skillGap <= 1) return `${skillName} - Online Tutorial`;
    if (skillGap === 2) return `${skillName} - Hands-on Workshop`;
    return `${skillName} - Comprehensive Training Course`;
  }
  
  // Tax/compliance skills - formal structured learning
  if (lowerCategory.includes('tax') || lowerCategory.includes('compliance') ||
      lowerSkill.includes('tax') || lowerSkill.includes('hmrc')) {
    if (skillGap <= 1) return `${skillName} - CPD Webinar`;
    if (skillGap === 2) return `${skillName} - Professional Workshop`;
    return `${skillName} - Accredited Training Program`;
  }
  
  // Advisory/consulting skills - mentoring and practice
  if (lowerCategory.includes('advisory') || lowerCategory.includes('consulting') ||
      lowerSkill.includes('advisory') || lowerSkill.includes('forecasting')) {
    if (skillGap <= 1) return `${skillName} - Shadowing & Mentoring`;
    if (skillGap === 2) return `${skillName} - Case Study Workshop`;
    return `${skillName} - Advisory Skills Program`;
  }
  
  // Communication/soft skills - interactive learning
  if (lowerCategory.includes('communication') || lowerCategory.includes('soft skills') ||
      lowerCategory.includes('leadership') || lowerCategory.includes('client management')) {
    if (skillGap <= 1) return `${skillName} - Interactive Workshop`;
    if (skillGap === 2) return `${skillName} - Skills Development Program`;
    return `${skillName} - Professional Development Course`;
  }
  
  // Management/reporting skills - practical application
  if (lowerCategory.includes('management') || lowerCategory.includes('reporting')) {
    if (skillGap <= 1) return `${skillName} - Practical Workshop`;
    if (skillGap === 2) return `${skillName} - Applied Training Course`;
    return `${skillName} - Management Accounting Program`;
  }
  
  // Default recommendations with skill name
  if (skillGap <= 1) return `${skillName} - CPD Course`;
  if (skillGap === 2) return `${skillName} - Professional Workshop`;
  return `${skillName} - Training Program`;
}

function estimateHours(skillGap: number): number {
  return skillGap * 10; // 10 hours per skill level
}

function estimateCost(skillGap: number): number {
  return skillGap * 500; // £500 per skill level
}

function calculatePriorityScore(gap: {
  interestLevel: number;
  businessImpact: string;
}): number {
  const impactScores: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2
  };

  const impactScore = impactScores[gap.businessImpact] || 3;
  return (gap.interestLevel * 2 + impactScore * 3) / 5; // Weighted average
}

function determineUrgency(businessImpact: string): string {
  const urgencyMap: Record<string, string> = {
    critical: 'immediate',
    high: 'short_term',
    medium: 'medium_term',
    low: 'long_term'
  };

  return urgencyMap[businessImpact] || 'medium_term';
}

