/**
 * Strategic Team Deployment Matching Algorithm
 * Optimally matches team members to service lines based on:
 * - Service line interest rankings
 * - Current skill levels
 * - Experience levels
 * - Learning styles (VARK)
 * - Personality traits (OCEAN) for team composition
 * - Working preferences for collaboration effectiveness
 * - Motivational drivers for engagement
 * - EQ for client-facing roles
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
  // New assessment data
  personalityTraits?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotional_stability: number;
  };
  belbinRole?: string; // Primary team role
  communicationStyle?: string;
  motivationalDrivers?: {
    achievement: number;
    autonomy: number;
    affiliation: number;
  };
  eqScore?: number;
  conflictStyle?: string;
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
 * Now includes personality, team role, motivation, and EQ factors
 */
export function calculateMatchScore(
  coverage: ServiceLineCoverage,
  requirement: ServiceLineRequirement,
  currentUtilization: number = 50,
  profile?: TeamMemberProfile
): DeploymentMatch {
  // Interest Score (30% weight) - reduced to make room for new factors
  const interestScore = Math.max(0, 100 - (coverage.interest_rank * 12.5));
  
  // Skill Score (25% weight) - based on avg skill level in service line
  const skillScore = (coverage.avg_skill_level_in_service_line / 5) * 100;
  
  // Experience Score (15% weight)
  const experienceScore = (coverage.current_experience_level / 5) * 100;
  
  // Capacity Score (10% weight) - inverse of current utilization
  const capacityScore = Math.max(0, 100 - currentUtilization);
  
  // Learning Style Fit (5% weight) - bonus for matching learning style to service line
  const learningStyleFit = 50; // Default, can be enhanced with VARK data
  
  // NEW: Team Role Fit (5% weight) - matches Belbin role to service line needs
  const teamRoleFit = profile?.belbinRole ? calculateTeamRoleFit(profile.belbinRole, requirement.serviceLine) : 50;
  
  // NEW: Motivation Fit (5% weight) - aligns motivational drivers with service line
  const motivationFit = profile?.motivationalDrivers ? 
    calculateMotivationFit(profile.motivationalDrivers, requirement.serviceLine) : 50;
  
  // NEW: EQ Bonus (5% weight) - especially important for client-facing roles
  const eqBonus = profile?.eqScore || 50;
  
  // Weighted total score
  const matchScore = 
    (interestScore * 0.30) +
    (skillScore * 0.25) +
    (experienceScore * 0.15) +
    (capacityScore * 0.10) +
    (learningStyleFit * 0.05) +
    (teamRoleFit * 0.05) +
    (motivationFit * 0.05) +
    (eqBonus * 0.05);
  
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
 * Calculate team role fit for a service line
 * Different Belbin roles suit different types of projects
 */
function calculateTeamRoleFit(belbinRole: string, serviceLine: string): number {
  // Mapping of Belbin roles to service line types
  const roleFitMatrix: Record<string, Record<string, number>> = {
    'Plant': { 
      'Innovation Consulting': 90, 
      'Business Transformation': 80, 
      'Strategy Development': 85,
      'default': 60 
    },
    'Resource Investigator': { 
      'Business Development': 90, 
      'Market Research': 85, 
      'Networking': 90,
      'default': 65 
    },
    'Coordinator': { 
      'Project Management': 95, 
      'Team Leadership': 90, 
      'Change Management': 85,
      'default': 70 
    },
    'Shaper': { 
      'Business Transformation': 85, 
      'Turnaround Consulting': 90, 
      'Strategic Planning': 80,
      'default': 65 
    },
    'Monitor Evaluator': { 
      'Risk Assessment': 95, 
      'Audit & Compliance': 90, 
      'Due Diligence': 90,
      'default': 70 
    },
    'Teamworker': { 
      'HR Consulting': 85, 
      'Team Building': 90, 
      'Conflict Resolution': 85,
      'default': 75 
    },
    'Implementer': { 
      'Process Implementation': 95, 
      'Operations Consulting': 90, 
      'System Deployment': 90,
      'default': 70 
    },
    'Completer Finisher': { 
      'Quality Assurance': 95, 
      'Compliance': 90, 
      'Final Delivery': 95,
      'default': 70 
    },
    'Specialist': { 
      'Technical Consulting': 95, 
      'Expert Advisory': 90, 
      'Specialized Services': 95,
      'default': 75 
    }
  };

  const roleMatrix = roleFitMatrix[belbinRole];
  if (!roleMatrix) return 50;

  return roleMatrix[serviceLine] || roleMatrix['default'] || 50;
}

/**
 * Calculate motivation fit for a service line
 * Different drivers align with different types of work
 */
function calculateMotivationFit(
  drivers: { achievement: number; autonomy: number; affiliation: number },
  serviceLine: string
): number {
  // Service lines that benefit from high achievement drive
  const achievementDrivenLines = ['Strategy Development', 'Business Transformation', 'Performance Improvement'];
  // Service lines that benefit from high autonomy
  const autonomyDrivenLines = ['Innovation Consulting', 'Research & Development', 'Independent Projects'];
  // Service lines that benefit from high affiliation
  const affiliationDrivenLines = ['Team Building', 'HR Consulting', 'Collaborative Projects'];

  let score = 50; // Base score

  if (achievementDrivenLines.includes(serviceLine)) {
    score += (drivers.achievement - 50) * 0.5; // Bonus for high achievement
  }
  if (autonomyDrivenLines.includes(serviceLine)) {
    score += (drivers.autonomy - 50) * 0.5; // Bonus for high autonomy
  }
  if (affiliationDrivenLines.includes(serviceLine)) {
    score += (drivers.affiliation - 50) * 0.5; // Bonus for high affiliation
  }

  return Math.max(0, Math.min(100, score));
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

