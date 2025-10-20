/**
 * Strategic Team Deployment Matching Algorithm
 * Optimally matches team members to service lines based on:
 * - Service line interest rankings
 * - Current skill levels
 * - Experience levels
 * - Learning styles (VARK)
 * - Capacity/availability
 */

import { supabase } from '@/lib/supabase/client';
import { getServiceLineCoverage, type ServiceLineCoverage } from './service-line-interests';
import { getLearningStyleProfile } from './learning-preferences';

export interface TeamMemberProfile {
  memberId: string;
  memberName: string;
  role: string;
  learningStyle?: string;
  currentUtilization?: number; // 0-100%
}

export interface ServiceLineRequirement {
  serviceLine: string;
  targetHeadcount: number;
  requiredSkills: string[];
  minimumSkillLevel: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DeploymentMatch {
  memberId: string;
  memberName: string;
  serviceLine: string;
  matchScore: number;
  matchBreakdown: {
    interestScore: number;      // 0-100
    skillScore: number;          // 0-100
    experienceScore: number;     // 0-100
    capacityScore: number;       // 0-100
    learningStyleFit: number;    // 0-100
  };
  recommended: boolean;
  developmentNeeds: string[];
  estimatedReadiness: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface ServiceLineDeploymentPlan {
  serviceLine: string;
  requirement: ServiceLineRequirement;
  currentTeam: DeploymentMatch[];
  recommendedAdditions: DeploymentMatch[];
  skillGaps: {
    skillName: string;
    currentAvgLevel: number;
    requiredLevel: number;
    gap: number;
  }[];
  trainingPriorities: {
    memberId: string;
    memberName: string;
    skills: string[];
    estimatedHours: number;
  }[];
}

/**
 * Calculate match score for a member to a service line
 */
export function calculateMatchScore(
  coverage: ServiceLineCoverage,
  requirement: ServiceLineRequirement,
  currentUtilization: number = 50
): DeploymentMatch {
  // Interest Score (35% weight) - lower rank = higher score
  const interestScore = Math.max(0, 100 - (coverage.interest_rank * 12.5));
  
  // Skill Score (30% weight) - based on avg skill level in service line
  const skillScore = (coverage.avg_skill_level_in_service_line / 5) * 100;
  
  // Experience Score (20% weight)
  const experienceScore = (coverage.current_experience_level / 5) * 100;
  
  // Capacity Score (10% weight) - inverse of current utilization
  const capacityScore = Math.max(0, 100 - currentUtilization);
  
  // Learning Style Fit (5% weight) - bonus for matching learning style to service line
  const learningStyleFit = 50; // Default, can be enhanced with VARK data
  
  // Weighted total score
  const matchScore = 
    (interestScore * 0.35) +
    (skillScore * 0.30) +
    (experienceScore * 0.20) +
    (capacityScore * 0.10) +
    (learningStyleFit * 0.05);
  
  // Determine readiness based on skill and experience scores
  let estimatedReadiness: 'immediate' | 'short_term' | 'medium_term' | 'long_term' = 'medium_term';
  const avgReadinessScore = (skillScore + experienceScore) / 2;
  
  if (avgReadinessScore >= 75) estimatedReadiness = 'immediate';
  else if (avgReadinessScore >= 50) estimatedReadiness = 'short_term';
  else if (avgReadinessScore >= 25) estimatedReadiness = 'medium_term';
  else estimatedReadiness = 'long_term';
  
  // Identify development needs
  const developmentNeeds: string[] = [];
  if (skillScore < 60) developmentNeeds.push('Technical skills development');
  if (experienceScore < 40) developmentNeeds.push('Hands-on experience');
  if (interestScore < 50) developmentNeeds.push('Interest cultivation');
  
  return {
    memberId: coverage.member_id,
    memberName: coverage.member_name,
    serviceLine: coverage.service_line,
    matchScore: Math.round(matchScore),
    matchBreakdown: {
      interestScore: Math.round(interestScore),
      skillScore: Math.round(skillScore),
      experienceScore: Math.round(experienceScore),
      capacityScore: Math.round(capacityScore),
      learningStyleFit: Math.round(learningStyleFit)
    },
    recommended: matchScore >= 60, // Threshold for recommendation
    developmentNeeds,
    estimatedReadiness
  };
}

/**
 * Generate deployment plan for a service line
 */
export async function generateServiceLineDeploymentPlan(
  serviceLine: string,
  requirement: ServiceLineRequirement
): Promise<ServiceLineDeploymentPlan> {
  try {
    // Get all members interested in this service line
    const coverage = await getServiceLineCoverage();
    const serviceLineCoverage = coverage.filter(c => c.service_line === serviceLine);
    
    // Calculate match scores for all members
    const matches = serviceLineCoverage.map(cov => 
      calculateMatchScore(cov, requirement)
    ).sort((a, b) => b.matchScore - a.matchScore);
    
    // Separate current team (high match scores) from potential additions
    const currentTeam = matches.filter(m => m.matchScore >= 70);
    const recommendedAdditions = matches.filter(m => m.matchScore >= 60 && m.matchScore < 70);
    
    // Analyze skill gaps
    const skillGaps = await analyzeServiceLineSkillGaps(serviceLine, requirement);
    
    // Generate training priorities
    const trainingPriorities = generateTrainingPriorities(matches, skillGaps);
    
    return {
      serviceLine,
      requirement,
      currentTeam,
      recommendedAdditions,
      skillGaps,
      trainingPriorities
    };
  } catch (error) {
    console.error('[Strategic Matching] Error generating deployment plan:', error);
    throw error;
  }
}

/**
 * Analyze skill gaps for a service line
 */
async function analyzeServiceLineSkillGaps(
  serviceLine: string,
  requirement: ServiceLineRequirement
): Promise<{
  skillName: string;
  currentAvgLevel: number;
  requiredLevel: number;
  gap: number;
}[]> {
  try {
    // Get all skills for this service line
    const { data: skills } = await supabase
      .from('skills')
      .select('id, name')
      .eq('service_line', serviceLine);

    if (!skills || skills.length === 0) return [];

    // Get average skill levels across team
    const { data: assessments } = await supabase
      .from('skill_assessments')
      .select('skill_id, current_level, skills:skill_id(name)')
      .in('skill_id', skills.map(s => (s as any).id));

    if (!assessments) return [];

    // Calculate average levels
    const skillAverages = new Map<string, { name: string; total: number; count: number }>();
    
    assessments.forEach((assessment: any) => {
      const skillId = assessment.skill_id;
      const skillName = assessment.skills?.name || 'Unknown';
      const level = assessment.current_level || 0;
      
      if (!skillAverages.has(skillId)) {
        skillAverages.set(skillId, { name: skillName, total: 0, count: 0 });
      }
      
      const avg = skillAverages.get(skillId)!;
      avg.total += level;
      avg.count += 1;
    });
    
    // Calculate gaps
    const gaps = Array.from(skillAverages.values()).map(avg => ({
      skillName: avg.name,
      currentAvgLevel: avg.count > 0 ? avg.total / avg.count : 0,
      requiredLevel: requirement.minimumSkillLevel,
      gap: Math.max(0, requirement.minimumSkillLevel - (avg.total / avg.count))
    })).filter(g => g.gap > 0);
    
    return gaps.sort((a, b) => b.gap - a.gap);
  } catch (error) {
    console.error('[Strategic Matching] Error analyzing skill gaps:', error);
    return [];
  }
}

/**
 * Generate training priorities based on matches and gaps
 */
function generateTrainingPriorities(
  matches: DeploymentMatch[],
  skillGaps: { skillName: string; gap: number }[]
): {
  memberId: string;
  memberName: string;
  skills: string[];
  estimatedHours: number;
}[] {
  // Focus on members with high interest but lower skills
  const highPotentialMembers = matches.filter(m => 
    m.matchBreakdown.interestScore > 60 && 
    m.matchBreakdown.skillScore < 60
  );
  
  return highPotentialMembers.slice(0, 5).map(member => ({
    memberId: member.memberId,
    memberName: member.memberName,
    skills: skillGaps.slice(0, 3).map(g => g.skillName),
    estimatedHours: skillGaps.slice(0, 3).reduce((sum, g) => sum + (g.gap * 10), 0)
  }));
}

/**
 * Generate comprehensive strategic deployment plan for all service lines
 */
export async function generateComprehensiveDeploymentPlan(
  requirements: ServiceLineRequirement[]
): Promise<ServiceLineDeploymentPlan[]> {
  try {
    const plans = await Promise.all(
      requirements.map(req => generateServiceLineDeploymentPlan(req.serviceLine, req))
    );
    
    return plans.sort((a, b) => {
      // Sort by priority (critical first) and then by gap size
      const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityA = priorityMap[a.requirement.priority];
      const priorityB = priorityMap[b.requirement.priority];
      
      if (priorityA !== priorityB) return priorityB - priorityA;
      
      // If same priority, sort by total skill gap
      const gapA = a.skillGaps.reduce((sum, g) => sum + g.gap, 0);
      const gapB = b.skillGaps.reduce((sum, g) => sum + g.gap, 0);
      return gapB - gapA;
    });
  } catch (error) {
    console.error('[Strategic Matching] Error generating comprehensive plan:', error);
    return [];
  }
}

/**
 * Find best team members for urgent deployment
 */
export async function findBestCandidatesForServiceLine(
  serviceLine: string,
  count: number = 3
): Promise<DeploymentMatch[]> {
  try {
    const coverage = await getServiceLineCoverage();
    const serviceLineCoverage = coverage.filter(c => c.service_line === serviceLine);
    
    const requirement: ServiceLineRequirement = {
      serviceLine,
      targetHeadcount: count,
      requiredSkills: [],
      minimumSkillLevel: 3,
      priority: 'high'
    };
    
    const matches = serviceLineCoverage.map(cov => 
      calculateMatchScore(cov, requirement)
    ).sort((a, b) => b.matchScore - a.matchScore);
    
    return matches.slice(0, count);
  } catch (error) {
    console.error('[Strategic Matching] Error finding best candidates:', error);
    return [];
  }
}

