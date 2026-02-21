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
  cpdEffectiveness: number; // 0-100
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

  // High conscientiousness + high openness = faster skill acquisition
  const skillAcquisitionRate = 
    (personality.conscientiousness * 0.4 + personality.openness * 0.4 + personality.extraversion * 0.2) / 100;

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
    cpdEffectiveness: 75 // Placeholder - calculate from actual CPD outcomes
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
  // personality: PersonalityAssessment,
  skills: SkillAssessment[],
  workingPrefs: WorkingPreferences
): RetentionRiskProfile {
  // Low role match + high achievement + low autonomy = high flight risk
  const motivationMismatch = motivation.primary_driver === 'achievement' && 
    (member.role === 'Junior' || member.role === 'Admin') ? 80 : 30;

  const roleFitScore = skills.length >= 50 ? 80 : 50; // Placeholder
  const autonomyLevel = workingPrefs.autonomy_preference || 50;
  const developmentOpportunities = 70; // Placeholder - calculate from CPD
  const workloadBalance = 60; // Placeholder

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
  const workloadIntensity = 60; // Placeholder - calculate from actual hours/projects
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

