/**
 * Analytics calculations for cross-assessment correlations and predictive insights
 * Based on the Assessment System Analysis document requirements
 */

import type { 
  PracticeMember, 
  VarkAssessment, 
  PersonalityAssessment, 
  BelbinAssessment,
  EQAssessment,
  MotivationalDriver,
  ConflictStyleAssessment,
  WorkingPreferences,
  SkillAssessment 
} from './types';

// ==================== CROSS-ASSESSMENT CORRELATIONS ====================

export interface PersonalityPerformanceCorrelation {
  memberId: string;
  memberName: string;
  conscientiousness: number;
  openness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  skillAcquisitionRate: number; // skills per month
  averageSkillLevel: number;
  performancePrediction: 'high' | 'medium' | 'low';
}

export interface LearningStyleEffectiveness {
  memberId: string;
  memberName: string;
  learningStyle: string;
  skillDevelopmentVelocity: number; // how fast they learn
  optimalTrainingMethods: string[];
  cpdEffectiveness: number | null; // 0-100 or null when no CPD data
}

export interface EQConflictSynergy {
  memberId: string;
  memberName: string;
  eqScore: number;
  conflictStyle: string;
  mediationPotential: number; // 0-100
  teamHarmonyContribution: number;
  idealTeamRoles: string[];
}

export interface BelbinMotivationPattern {
  memberId: string;
  memberName: string;
  primaryBelbinRole: string;
  primaryMotivator: string;
  alignmentScore: number; // how well Belbin matches motivation
  roleEffectiveness: number;
  flaggedMisalignment?: string;
}

/**
 * Calculate personality × performance correlations
 */
export function calculatePersonalityPerformance(
  member: PracticeMember,
  personality: PersonalityAssessment,
  skills: SkillAssessment[]
): PersonalityPerformanceCorrelation {
  const averageSkillLevel = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.current_level, 0) / skills.length
    : 0;

  // High conscientiousness + high openness = faster skill acquisition (guard against undefined/NaN)
  const skillAcquisitionRate =
    ((personality.conscientiousness || 0) * 0.4 + (personality.openness || 0) * 0.4 + (personality.extraversion || 0) * 0.2) / 100;

  const performancePrediction = 
    personality.conscientiousness > 70 && averageSkillLevel > 3.5 ? 'high' :
    personality.conscientiousness > 50 && averageSkillLevel > 2.5 ? 'medium' : 'low';

  return {
    memberId: member.id,
    memberName: member.name,
    conscientiousness: personality.conscientiousness,
    openness: personality.openness,
    extraversion: personality.extraversion,
    agreeableness: personality.agreeableness,
    neuroticism: personality.neuroticism,
    skillAcquisitionRate,
    averageSkillLevel,
    performancePrediction
  };
}

/**
 * Calculate learning style × skill development effectiveness
 */
export function calculateLearningEffectiveness(
  member: PracticeMember,
  vark: VarkAssessment,
  skills: SkillAssessment[]
): LearningStyleEffectiveness {
  const learningStyle = vark.learning_type || 'multimodal';
  
  // Calculate skill development velocity (placeholder - needs historical data)
  const skillDevelopmentVelocity = skills.length / 12; // skills per month estimate

  const optimalTrainingMethods = (
    {
      visual: ['Video tutorials', 'Diagrams', 'Infographics', 'Screen sharing'],
      auditory: ['Podcasts', 'Webinars', 'Discussions', 'Verbal coaching'],
      reading_writing: ['Documentation', 'Written guides', 'Note-taking', 'Reports'],
      kinesthetic: ['Hands-on practice', 'Simulations', 'Live projects', 'Pair programming'],
      multimodal: ['Blended learning', 'Mixed media', 'Interactive workshops', 'Project-based']
    } as Record<string, string[]>
  )[learningStyle] || ['Blended learning'];

  return {
    memberId: member.id,
    memberName: member.name,
    learningStyle,
    skillDevelopmentVelocity,
    optimalTrainingMethods,
    cpdEffectiveness: null // No CPD data in this context; UI can hide or show "—"
  };
}

/**
 * Calculate EQ × Conflict Style synergies
 */
export function calculateEQConflictSynergy(
  member: PracticeMember,
  eq: EQAssessment,
  conflict: ConflictStyleAssessment
): EQConflictSynergy {
  const eqScore = (
    (eq.self_awareness || 0) + 
    (eq.self_management || 0) + 
    // 0 (motivation not in EQ schema) +
    (eq.social_awareness || 0) + 
    (eq.relationship_management || 0)
  ) / 4; // Divided by 4 since we only have 4 components

  // High relationship management + collaborative style = ideal mediator
  const mediationPotential = 
    conflict.primary_style === 'collaborating' && eq.relationship_management > 70 ? 90 :
    conflict.primary_style === 'compromising' && eq.social_awareness > 65 ? 75 :
    50;

  const teamHarmonyContribution = (eq.social_awareness + eq.relationship_management) / 2;

  const idealTeamRoles = [];
  if (mediationPotential > 70) idealTeamRoles.push('Team Mediator', 'Client Relations');
  // if (eq.motivation > 70) idealTeamRoles.push('Project Leader'); // motivation not in schema
  if (eq.self_awareness > 75) idealTeamRoles.push('Mentor', 'Coach');

  return {
    memberId: member.id,
    memberName: member.name,
    eqScore,
    conflictStyle: conflict.primary_style,
    mediationPotential,
    teamHarmonyContribution,
    idealTeamRoles
  };
}

/**
 * Calculate Belbin × Motivation alignment
 */
export function calculateBelbinMotivationAlignment(
  member: PracticeMember,
  belbin: BelbinAssessment,
  motivation: MotivationalDriver
): BelbinMotivationPattern {
  const primaryBelbinRole = belbin.primary_role;
  const primaryMotivator = motivation.primary_driver;

  // Check for natural combinations
  const alignments: Record<string, string[]> = {
    'Shaper': ['achievement', 'power', 'autonomy'],
    'Implementer': ['security', 'structure', 'affiliation'],
    'Completer Finisher': ['achievement', 'recognition'],
    'Coordinator': ['power', 'influence', 'affiliation'],
    'Team Worker': ['affiliation', 'security'],
    'Resource Investigator': ['influence', 'autonomy', 'variety'],
    'Plant': ['autonomy', 'creativity', 'achievement'],
    'Monitor Evaluator': ['achievement', 'structure'],
    'Specialist': ['expertise', 'achievement', 'autonomy']
  };

  const expectedMotivators = alignments[primaryBelbinRole] || [];
  const isAligned = expectedMotivators.includes(primaryMotivator);
  const alignmentScore = isAligned ? 85 : 50;

  const flaggedMisalignment = !isAligned 
    ? `${primaryBelbinRole} typically aligns with ${expectedMotivators.join('/')} motivation, but shows ${primaryMotivator}. May indicate role-motivation mismatch.`
    : undefined;

  return {
    memberId: member.id,
    memberName: member.name,
    primaryBelbinRole,
    primaryMotivator,
    alignmentScore,
    roleEffectiveness: alignmentScore,
    flaggedMisalignment
  };
}

// ==================== PREDICTIVE ANALYTICS ====================

export interface RetentionRiskProfile {
  memberId: string;
  memberName: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  factors: {
    motivationMismatch: number;
    roleFitScore: number;
    autonomyLevel: number;
    developmentOpportunities: number;
    workloadBalance: number;
  };
  predictions: string[];
  recommendations: string[];
}

export interface BurnoutRiskProfile {
  memberId: string;
  memberName: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  factors: {
    neuroticismScore: number;
    workloadIntensity: number;
    workLifeBalance: number;
    supportNetwork: number;
    controlLevel: number;
  };
  earlyWarningSign: string[];
  interventions: string[];
}

export interface PromotionReadiness {
  memberId: string;
  memberName: string;
  readinessScore: number; // 0-100
  successProbability: 'high' | 'medium' | 'low';
  targetRole: string;
  strengths: string[];
  gaps: string[];
  developmentPlan: string[];
  timeToReady: string; // "Ready now" | "3-6 months" | "6-12 months"
}

/**
 * Calculate retention risk
 */
export function calculateRetentionRisk(
  member: PracticeMember,
  motivation: MotivationalDriver,
  skills: SkillAssessment[],
  workingPrefs: WorkingPreferences,
  skillProfile?: { developmentInterests: Array<{ interestLevel: number }> }
): RetentionRiskProfile {
  const motivationMismatch = motivation.primary_driver === 'achievement' && 
    (member.role === 'Junior' || member.role === 'Admin') ? 80 : 30;

  const roleFitScore = skills.length > 0
    ? (skills.filter(s => s.current_level >= 3).length / skills.length) * 100
    : 50;
  const autonomyLevel = workingPrefs.autonomy_preference ?? 50;
  const developmentOpportunities = skillProfile?.developmentInterests?.length
    ? (skillProfile.developmentInterests.length > 5 ? 80 : 50)
    : (skills.filter(s => (s.interest_level || 0) >= 4).length > 5 ? 80 : 50);
  const workloadBalance =
    member.role === 'Partner' || member.role === 'Director' ? 50 :
    member.role === 'Manager' ? 60 : 70;

  const riskScore = (
    motivationMismatch * 0.3 +
    (100 - roleFitScore) * 0.25 +
    (100 - autonomyLevel) * 0.2 +
    (100 - developmentOpportunities) * 0.15 +
    (100 - workloadBalance) * 0.1
  );

  const riskLevel = 
    riskScore > 70 ? 'high' :
    riskScore > 40 ? 'medium' : 'low';

  const predictions = [];
  if (riskScore > 60) predictions.push('May seek external opportunities within 6-12 months');
  if (motivationMismatch > 70) predictions.push('Role does not align with career aspirations');
  if (autonomyLevel < 40) predictions.push('Seeking more autonomy and decision-making authority');

  const recommendations = [];
  if (motivationMismatch > 60) recommendations.push('Discuss career progression and role expansion');
  if (autonomyLevel < 50) recommendations.push('Provide more ownership over projects');
  if (developmentOpportunities < 60) recommendations.push('Create personalized development plan');

  return {
    memberId: member.id,
    memberName: member.name,
    riskLevel,
    riskScore,
    factors: {
      motivationMismatch,
      roleFitScore,
      autonomyLevel,
      developmentOpportunities,
      workloadBalance
    },
    predictions,
    recommendations
  };
}

/**
 * Calculate burnout risk
 */
export function calculateBurnoutRisk(
  member: PracticeMember,
  personality: PersonalityAssessment,
  workingPrefs: WorkingPreferences
): BurnoutRiskProfile {
  const neuroticismScore = personality.neuroticism;
  const workloadIntensity =
    member.role === 'Partner' ? 75 :
    member.role === 'Director' ? 70 :
    member.role === 'Manager' ? 65 :
    member.role === 'Senior' ? 55 : 45;
  const workLifeBalance = workingPrefs.work_life_balance_priority || 50;
  const supportNetwork = personality.extraversion > 60 ? 70 : 50; // Extraverts typically have more support
  const controlLevel = workingPrefs.autonomy_preference || 50;

  // High neuroticism + high workload + low control = high burnout risk
  const riskScore = (
    neuroticismScore * 0.35 +
    workloadIntensity * 0.25 +
    (100 - workLifeBalance) * 0.2 +
    (100 - supportNetwork) * 0.1 +
    (100 - controlLevel) * 0.1
  );

  const riskLevel = 
    riskScore > 65 ? 'high' :
    riskScore > 40 ? 'medium' : 'low';

  const earlyWarningSign = [];
  if (neuroticismScore > 70) earlyWarningSign.push('High stress sensitivity');
  if (workLifeBalance < 40) earlyWarningSign.push('Work-life balance concerns');
  if (workloadIntensity > 70) earlyWarningSign.push('High current workload');

  const interventions = [];
  if (riskScore > 60) interventions.push('Schedule regular check-ins');
  if (workloadIntensity > 65) interventions.push('Review and redistribute workload');
  if (workLifeBalance < 50) interventions.push('Encourage flexible working arrangements');
  if (controlLevel < 50) interventions.push('Increase autonomy and decision-making authority');

  return {
    memberId: member.id,
    memberName: member.name,
    riskLevel,
    riskScore,
    factors: {
      neuroticismScore,
      workloadIntensity,
      workLifeBalance,
      supportNetwork,
      controlLevel
    },
    earlyWarningSign,
    interventions
  };
}

/**
 * Calculate promotion readiness
 */
export function calculatePromotionReadiness(
  member: PracticeMember,
  personality: PersonalityAssessment,
  eq: EQAssessment,
  skills: SkillAssessment[],
  targetRole: string
): PromotionReadiness {
  const averageSkillLevel = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.current_level, 0) / skills.length
    : 0;

  const leadershipScore = (eq.relationship_management + personality.extraversion) / 2; // motivation not in schema
  const technicalReadiness = averageSkillLevel >= 3.5 ? 80 : averageSkillLevel * 20;
  const emotionalReadiness = (eq.self_awareness + eq.self_management + eq.social_awareness) / 3;

  const readinessScore = (
    technicalReadiness * 0.4 +
    leadershipScore * 0.35 +
    emotionalReadiness * 0.25
  );

  const successProbability = 
    readinessScore > 75 ? 'high' :
    readinessScore > 55 ? 'medium' : 'low';

  const strengths = [];
  if (technicalReadiness > 75) strengths.push('Strong technical skills');
  if (leadershipScore > 70) strengths.push('Leadership potential');
  if (emotionalReadiness > 70) strengths.push('Emotional intelligence');
  if (personality.conscientiousness > 70) strengths.push('Reliability and thoroughness');

  const gaps = [];
  if (technicalReadiness < 70) gaps.push('Develop technical expertise');
  if (leadershipScore < 60) gaps.push('Build leadership skills');
  if (emotionalReadiness < 60) gaps.push('Enhance emotional intelligence');

  const developmentPlan = gaps.map(gap => `Focus on: ${gap}`);

  const timeToReady = 
    readinessScore > 75 ? 'Ready now' :
    readinessScore > 60 ? '3-6 months' : '6-12 months';

  return {
    memberId: member.id,
    memberName: member.name,
    readinessScore,
    successProbability,
    targetRole,
    strengths,
    gaps,
    developmentPlan,
    timeToReady
  };
}

// ==================== SKILL & SERVICE ANALYTICS ====================

export interface SkillProfile {
  memberId: string;
  memberName: string;
  totalSkillsAssessed: number;
  averageLevel: number;
  strongestCategory: { name: string; avgLevel: number };
  weakestCategory: { name: string; avgLevel: number };
  topSkills: Array<{ name: string; level: number; category: string }>;
  developmentInterests: Array<{ name: string; interestLevel: number; currentLevel: number; gap: number }>;
  categoryBreakdown: Array<{ category: string; avgLevel: number; skillCount: number; belowTarget: number }>;
}

export function calculateSkillProfile(
  member: PracticeMember,
  assessments: SkillAssessment[],
  skillDefinitions: Array<{ id: string; name: string; category: string; required_level: number }>
): SkillProfile {
  const memberAssessments = assessments.filter(a => a.member_id === member.id);
  type Enriched = SkillAssessment & { skillName: string; category: string; required_level: number };
  const enriched: Enriched[] = memberAssessments.map(a => {
    const skill = skillDefinitions.find(s => s.id === a.skill_id);
    return {
      ...a,
      skillName: skill?.name ?? 'Unknown',
      category: skill?.category ?? 'Unknown',
      required_level: skill?.required_level ?? 3
    } as Enriched;
  });

  const averageLevel = enriched.length > 0
    ? enriched.reduce((sum, s) => sum + s.current_level, 0) / enriched.length
    : 0;

  const byCategory = new Map<string, Enriched[]>();
  enriched.forEach(s => {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  });

  const categoryBreakdown = Array.from(byCategory.entries()).map(([category, skills]) => ({
    category,
    avgLevel: skills.reduce((sum, s) => sum + s.current_level, 0) / skills.length,
    skillCount: skills.length,
    belowTarget: skills.filter(s => s.current_level < s.required_level).length
  })).sort((a, b) => b.avgLevel - a.avgLevel);

  const strongestCategory = categoryBreakdown[0] ?? { category: 'N/A', avgLevel: 0, skillCount: 0, belowTarget: 0 };
  const weakestCategory = categoryBreakdown[categoryBreakdown.length - 1] ?? { category: 'N/A', avgLevel: 0, skillCount: 0, belowTarget: 0 };

  const topSkills = [...enriched]
    .sort((a, b) => b.current_level - a.current_level)
    .slice(0, 5)
    .map(s => ({ name: s.skillName, level: s.current_level, category: s.category }));

  const developmentInterests = enriched
    .filter(s => (s.interest_level ?? 0) >= 4 && s.current_level <= 3)
    .sort((a, b) => (b.interest_level ?? 0) - (a.interest_level ?? 0))
    .slice(0, 5)
    .map(s => ({
      name: s.skillName,
      interestLevel: s.interest_level ?? 0,
      currentLevel: s.current_level,
      gap: (s.interest_level ?? 0) - s.current_level
    }));

  return {
    memberId: member.id,
    memberName: member.name,
    totalSkillsAssessed: enriched.length,
    averageLevel,
    strongestCategory: { name: strongestCategory.category, avgLevel: strongestCategory.avgLevel },
    weakestCategory: { name: weakestCategory.category, avgLevel: weakestCategory.avgLevel },
    topSkills,
    developmentInterests,
    categoryBreakdown
  };
}

export interface ServiceCapability {
  memberId: string;
  memberName: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    skillsCovered: number;
    totalRequired: number;
    coveragePercent: number;
    criticalSkillsMet: number;
    totalCriticalSkills: number;
    canDeliver: boolean;
    interestRank?: number;
    desiredInvolvement?: number;
    capabilityVsInterest: 'aligned' | 'interested_not_ready' | 'capable_not_interested' | 'neither';
  }>;
  primaryServiceFit: string;
  servicesCanDeliver: number;
  servicesInterestedIn: number;
}

type ServiceLineLike = { id: string; name: string; requiredSkills: Array<{ skillName: string; minimumLevel: number; criticalToDelivery: boolean }> };
type ServiceInterestLike = { practice_member_id: string; service_line: string; interest_rank: number; desired_involvement_pct?: number };

export function calculateServiceCapability(
  member: PracticeMember,
  assessments: SkillAssessment[],
  skillDefinitions: Array<{ id: string; name: string; category: string; required_level: number }>,
  advisoryServices: ServiceLineLike[],
  serviceInterests: ServiceInterestLike[]
): ServiceCapability {
  const memberAssessments = assessments.filter(a => a.member_id === member.id);
  const memberInterests = serviceInterests.filter(i => i.practice_member_id === member.id);

  const services = advisoryServices.map(service => {
    let skillsCovered = 0;
    let criticalSkillsMet = 0;
    const totalRequired = service.requiredSkills.length;
    const totalCriticalSkills = service.requiredSkills.filter(s => s.criticalToDelivery).length;

    service.requiredSkills.forEach(req => {
      const skill = skillDefinitions.find(s => s.name.toLowerCase() === req.skillName.toLowerCase());
      if (!skill) return;
      const assessment = memberAssessments.find(a => a.skill_id === skill.id);
      if (assessment && assessment.current_level >= req.minimumLevel) {
        skillsCovered++;
        if (req.criticalToDelivery) criticalSkillsMet++;
      }
    });

    const coveragePercent = totalRequired > 0 ? (skillsCovered / totalRequired) * 100 : 0;
    const canDeliver = totalCriticalSkills > 0 ? criticalSkillsMet === totalCriticalSkills && coveragePercent >= 70 : coveragePercent >= 70;

    const interest = memberInterests.find(i =>
      i.service_line.toLowerCase().includes(service.id.toLowerCase()) ||
      i.service_line.toLowerCase().includes(service.name.toLowerCase()) ||
      service.name.toLowerCase().includes(i.service_line.toLowerCase())
    );
    const isInterested = interest && interest.interest_rank <= 3;

    const capabilityVsInterest: 'aligned' | 'interested_not_ready' | 'capable_not_interested' | 'neither' =
      canDeliver && isInterested ? 'aligned' :
      !canDeliver && isInterested ? 'interested_not_ready' :
      canDeliver && !isInterested ? 'capable_not_interested' :
      'neither';

    return {
      serviceId: service.id,
      serviceName: service.name,
      skillsCovered,
      totalRequired,
      coveragePercent,
      criticalSkillsMet,
      totalCriticalSkills,
      canDeliver,
      interestRank: interest?.interest_rank,
      desiredInvolvement: interest?.desired_involvement_pct,
      capabilityVsInterest
    };
  });

  const sorted = [...services].sort((a, b) => {
    const scoreA = a.coveragePercent + (a.interestRank != null ? (10 - a.interestRank) * 10 : 0);
    const scoreB = b.coveragePercent + (b.interestRank != null ? (10 - b.interestRank) * 10 : 0);
    return scoreB - scoreA;
  });

  return {
    memberId: member.id,
    memberName: member.name,
    services: sorted,
    primaryServiceFit: sorted[0]?.serviceName ?? 'None',
    servicesCanDeliver: services.filter(s => s.canDeliver).length,
    servicesInterestedIn: services.filter(s => s.interestRank != null && s.interestRank <= 3).length
  };
}

export interface DevelopmentPriority {
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'critical' | 'high' | 'medium';
  reason: string;
  serviceLines: string[];
}

export function calculateDevelopmentPriorities(
  member: PracticeMember,
  assessments: SkillAssessment[],
  skillDefinitions: Array<{ id: string; name: string; category: string; required_level: number }>,
  advisoryServices: ServiceLineLike[],
  serviceInterests: ServiceInterestLike[]
): DevelopmentPriority[] {
  const memberAssessments = assessments.filter(a => a.member_id === member.id);
  const memberInterests = serviceInterests.filter(i => i.practice_member_id === member.id);
  const priorities: DevelopmentPriority[] = [];
  const interestedServices = memberInterests.filter(i => i.interest_rank <= 5);

  interestedServices.forEach(interest => {
    const service = advisoryServices.find(s =>
      s.id.toLowerCase() === interest.service_line.toLowerCase() ||
      s.name.toLowerCase().includes(interest.service_line.toLowerCase()) ||
      interest.service_line.toLowerCase().includes(s.name.toLowerCase())
    );
    if (!service) return;

    service.requiredSkills.forEach(req => {
      const skill = skillDefinitions.find(s => s.name.toLowerCase() === req.skillName.toLowerCase());
      if (!skill) return;
      const assessment = memberAssessments.find(a => a.skill_id === skill.id);
      const currentLevel = assessment?.current_level ?? 0;

      if (currentLevel < req.minimumLevel) {
        const existing = priorities.find(p => p.skillName === req.skillName);
        if (existing) {
          if (!existing.serviceLines.includes(service.name)) existing.serviceLines.push(service.name);
          if (req.criticalToDelivery && existing.priority !== 'critical') {
            existing.priority = 'critical';
            existing.reason = `Critical for ${service.name} delivery (Level ${currentLevel} → ${req.minimumLevel})`;
          }
        } else {
          priorities.push({
            skillName: req.skillName,
            skillCategory: skill.category,
            currentLevel,
            targetLevel: req.minimumLevel,
            priority: req.criticalToDelivery ? 'critical' : interest.interest_rank <= 2 ? 'high' : 'medium',
            reason: req.criticalToDelivery
              ? `Critical for ${service.name} delivery`
              : `Needed for ${service.name} (interested, rank #${interest.interest_rank})`,
            serviceLines: [service.name]
          });
        }
      }
    });
  });

  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  return priorities
    .sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return b.serviceLines.length - a.serviceLines.length;
    })
    .slice(0, 8);
}

