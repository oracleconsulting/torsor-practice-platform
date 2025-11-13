/**
 * Retention Risk Analytics
 * 
 * Predicts flight risk for team members based on existing assessment data
 * NO NEW ASSESSMENTS NEEDED - uses current data only
 * 
 * Risk Factors:
 * 1. Role Match Score (from existing role-fit analysis)
 * 2. Motivation Alignment (achievement motivation vs actual progression)
 * 3. Engagement Indicators (CPD participation, assessment completion)
 * 4. Tenure Risk (time in role vs typical progression timeframe)
 * 5. Development Gap (unaddressed development needs)
 */

import { supabase } from '@/lib/supabase/client';

export interface RetentionRiskFactors {
  roleMatchScore: number;           // 0-100 (from existing role-fit)
  motivationAlignment: number;      // 0-100
  engagementIndicators: number;     // 0-100
  tenureRisk: number;               // 0-100
  developmentGapSeverity: number;   // 0-100
  eqMismatch: number;               // 0-100 (EQ vs role requirements)
}

export interface RetentionRiskResult {
  memberId: string;
  memberName: string;
  riskScore: number;                // 0-100 (100 = highest flight risk)
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;               // 0-100 (how confident we are in this prediction)
  topRiskFactors: Array<{
    factor: string;
    score: number;
    weight: number;
    description: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'Immediate' | 'Short-term' | 'Medium-term';
    expectedImpact: number;
    description: string;
  }>;
  timeToAction: string;             // "Act within X weeks"
  calculatedAt: string;
}

/**
 * Calculate retention risk for a single team member
 */
export async function calculateRetentionRisk(memberId: string): Promise<RetentionRiskResult | null> {
  try {
    console.log('[RetentionRisk] 🎯 Calculating for member:', memberId);

    // 1. Get member basic info
    const { data: member } = await supabase
      .from('practice_members')
      .select('id, name, role, email, created_at')
      .eq('id', memberId)
      .single();

    if (!member) {
      console.error('[RetentionRisk] Member not found');
      return null;
    }

    // 2. Get role-fit scores (from assessment_insights if cached)
    const { data: roleInsights } = await supabase
      .from('assessment_insights')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle();

    // 3. Get motivational drivers
    const { data: motivation } = await supabase
      .from('motivational_drivers')
      .select('*')
      .eq('practice_member_id', memberId)
      .maybeSingle();

    // 4. Get EQ assessment
    const { data: eq } = await supabase
      .from('eq_assessments')
      .select('*')
      .eq('practice_member_id', memberId)
      .maybeSingle();

    // 5. Get working preferences
    const { data: workingPrefs } = await supabase
      .from('working_preferences')
      .select('*')
      .eq('practice_member_id', memberId)
      .maybeSingle();

    // 6. Get skills assessment count
    const { data: skills, count: skillsCount } = await supabase
      .from('skill_assessments')
      .select('*', { count: 'exact' })
      .eq('team_member_id', memberId);

    // 7. Get CPD activity count
    const { data: cpdActivities, count: cpdCount } = await supabase
      .from('cpd_activities')
      .select('*', { count: 'exact' })
      .eq('practice_member_id', memberId);

    // Calculate individual risk factors
    const factors = calculateRiskFactors({
      member,
      roleInsights,
      motivation,
      eq,
      workingPrefs,
      skillsCount: skillsCount || 0,
      cpdCount: cpdCount || 0
    });

    // Calculate overall risk score (weighted average)
    const weights = {
      roleMatchScore: 0.30,           // Highest weight - role fit is critical
      motivationAlignment: 0.25,      // Second highest - motivation drives retention
      developmentGapSeverity: 0.20,   // Important - unaddressed gaps cause frustration
      engagementIndicators: 0.15,     // Shows disengagement early
      eqMismatch: 0.05,               // Contributing factor
      tenureRisk: 0.05                // Less predictive but still relevant
    };

    const riskScore = Math.round(
      (factors.roleMatchScore * weights.roleMatchScore) +
      (factors.motivationAlignment * weights.motivationAlignment) +
      (factors.developmentGapSeverity * weights.developmentGapSeverity) +
      (factors.engagementIndicators * weights.engagementIndicators) +
      (factors.eqMismatch * weights.eqMismatch) +
      (factors.tenureRisk * weights.tenureRisk)
    );

    const riskLevel = getRiskLevel(riskScore);
    const confidence = calculateConfidence(factors);

    // Identify top risk factors
    const topRiskFactors = getTopRiskFactors(factors, weights);

    // Generate recommended actions
    const recommendedActions = generateRecommendedActions(factors, riskLevel);

    // Calculate time to action
    const timeToAction = getTimeToAction(riskLevel);

    return {
      memberId: member.id,
      memberName: member.name,
      riskScore,
      riskLevel,
      confidence,
      topRiskFactors,
      recommendedActions,
      timeToAction,
      calculatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('[RetentionRisk] Error calculating retention risk:', error);
    return null;
  }
}

/**
 * Calculate all individual risk factors
 */
function calculateRiskFactors(data: any): RetentionRiskFactors {
  const {
    member,
    roleInsights,
    motivation,
    eq,
    workingPrefs,
    skillsCount,
    cpdCount
  } = data;

  // 1. Role Match Score (inverted - low match = high risk)
  let roleMatchScore = 50; // Default medium risk
  if (roleInsights && roleInsights.current_role_match_percentage !== null) {
    // Invert: 100% match = 0 risk, 0% match = 100 risk
    roleMatchScore = 100 - roleInsights.current_role_match_percentage;
  }

  // 2. Motivation Alignment
  // High achievement/influence motivation with no growth = high risk
  let motivationAlignment = 50;
  if (motivation) {
    const achievementScore = motivation.achievement_score || 50;
    const influenceScore = motivation.influence_score || 50;
    const autonomyScore = motivation.autonomy_score || 50;

    // High achievers need progression
    const isHighAchiever = achievementScore >= 70 || influenceScore >= 70;
    
    // Check if they're in a role that supports their motivation
    // If high achievement/influence but in junior role = high risk
    const isJuniorRole = member.role && (
      member.role.toLowerCase().includes('junior') ||
      member.role.toLowerCase().includes('assistant')
    );

    if (isHighAchiever && isJuniorRole) {
      motivationAlignment = 75; // High risk - unfulfilled ambition
    } else if (isHighAchiever && !isJuniorRole) {
      motivationAlignment = 25; // Low risk - ambition aligned
    } else if (autonomyScore >= 70) {
      // High autonomy needs - check if they have it
      const hasAutonomy = workingPrefs?.autonomy_preference >= 4;
      motivationAlignment = hasAutonomy ? 30 : 60;
    }
  }

  // 3. Engagement Indicators
  // Low engagement = high risk
  let engagementIndicators = 0;
  
  // Skills assessment completion (111 total skills)
  const skillsCompletionRate = skillsCount / 111;
  const skillsEngagement = skillsCompletionRate >= 0.9 ? 0 : 
                          skillsCompletionRate >= 0.7 ? 20 :
                          skillsCompletionRate >= 0.5 ? 50 : 80;
  
  // CPD activity (expect at least some activity)
  const cpdEngagement = cpdCount >= 5 ? 0 :
                       cpdCount >= 2 ? 30 :
                       cpdCount >= 1 ? 60 : 90;

  engagementIndicators = Math.round((skillsEngagement + cpdEngagement) / 2);

  // 4. Tenure Risk
  // Too long in same role without promotion = high risk
  let tenureRisk = 20; // Default low
  if (member.created_at) {
    const monthsInPractice = Math.floor(
      (Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Risk increases after 18 months in same role for ambitious people
    if (motivation && (motivation.achievement_score >= 70 || motivation.influence_score >= 70)) {
      if (monthsInPractice > 24) tenureRisk = 80;
      else if (monthsInPractice > 18) tenureRisk = 60;
      else if (monthsInPractice > 12) tenureRisk = 40;
    }
  }

  // 5. Development Gap Severity
  // Unaddressed red flags = high risk
  let developmentGapSeverity = 20;
  if (roleInsights && roleInsights.red_flags) {
    const redFlagCount = Array.isArray(roleInsights.red_flags) ? roleInsights.red_flags.length : 0;
    const trainingLevel = roleInsights.training_level;

    if (trainingLevel === 'critical' || redFlagCount >= 3) {
      developmentGapSeverity = 80;
    } else if (trainingLevel === 'enhancement' || redFlagCount >= 2) {
      developmentGapSeverity = 50;
    } else if (redFlagCount >= 1) {
      developmentGapSeverity = 30;
    }
  }

  // 6. EQ Mismatch
  // Low EQ in client-facing role = frustration = risk
  let eqMismatch = 20;
  if (eq && member.role) {
    const overallEQ = eq.overall_eq || 50;
    const isClientFacing = member.role.toLowerCase().includes('director') ||
                          member.role.toLowerCase().includes('partner') ||
                          member.role.toLowerCase().includes('manager');

    if (isClientFacing && overallEQ < 60) {
      eqMismatch = 70; // High risk - struggling in client role
    } else if (isClientFacing && overallEQ < 70) {
      eqMismatch = 40; // Medium risk
    }
  }

  return {
    roleMatchScore,
    motivationAlignment,
    engagementIndicators,
    tenureRisk,
    developmentGapSeverity,
    eqMismatch
  };
}

/**
 * Determine overall risk level
 */
function getRiskLevel(riskScore: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (riskScore >= 75) return 'Critical';
  if (riskScore >= 60) return 'High';
  if (riskScore >= 40) return 'Medium';
  return 'Low';
}

/**
 * Calculate confidence in the prediction
 */
function calculateConfidence(factors: RetentionRiskFactors): number {
  // Confidence based on data completeness
  const factorCoverage = Object.values(factors).filter(f => f !== 50).length;
  const totalFactors = Object.keys(factors).length;
  
  return Math.round((factorCoverage / totalFactors) * 100);
}

/**
 * Identify top 3 risk factors
 */
function getTopRiskFactors(
  factors: RetentionRiskFactors,
  weights: Record<string, number>
): Array<{ factor: string; score: number; weight: number; description: string }> {
  const factorDetails = [
    {
      key: 'roleMatchScore',
      name: 'Role Misalignment',
      score: factors.roleMatchScore,
      weight: weights.roleMatchScore,
      description: factors.roleMatchScore >= 70 
        ? 'Critical mismatch between assessments and current role'
        : factors.roleMatchScore >= 50
        ? 'Moderate role misalignment detected'
        : 'Good role fit'
    },
    {
      key: 'motivationAlignment',
      name: 'Motivation Mismatch',
      score: factors.motivationAlignment,
      weight: weights.motivationAlignment,
      description: factors.motivationAlignment >= 70
        ? 'High ambition not being fulfilled in current role'
        : factors.motivationAlignment >= 50
        ? 'Some motivational misalignment'
        : 'Motivation well aligned with role'
    },
    {
      key: 'engagementIndicators',
      name: 'Low Engagement',
      score: factors.engagementIndicators,
      weight: weights.engagementIndicators,
      description: factors.engagementIndicators >= 70
        ? 'Very low participation in development activities'
        : factors.engagementIndicators >= 50
        ? 'Below-average engagement with growth opportunities'
        : 'Active engagement in development'
    },
    {
      key: 'developmentGapSeverity',
      name: 'Unaddressed Development Gaps',
      score: factors.developmentGapSeverity,
      weight: weights.developmentGapSeverity,
      description: factors.developmentGapSeverity >= 70
        ? 'Critical skill gaps not being addressed'
        : factors.developmentGapSeverity >= 50
        ? 'Some development needs require attention'
        : 'Development on track'
    },
    {
      key: 'tenureRisk',
      name: 'Tenure Risk',
      score: factors.tenureRisk,
      weight: weights.tenureRisk,
      description: factors.tenureRisk >= 70
        ? 'Long tenure without progression'
        : factors.tenureRisk >= 50
        ? 'Approaching typical progression timeframe'
        : 'Tenure appropriate for role'
    },
    {
      key: 'eqMismatch',
      name: 'EQ-Role Mismatch',
      score: factors.eqMismatch,
      weight: weights.eqMismatch,
      description: factors.eqMismatch >= 60
        ? 'EQ level challenging for role requirements'
        : 'EQ aligned with role needs'
    }
  ];

  // Sort by weighted impact (score * weight)
  return factorDetails
    .map(f => ({
      factor: f.name,
      score: f.score,
      weight: f.weight,
      description: f.description
    }))
    .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
    .slice(0, 3);
}

/**
 * Generate recommended actions based on risk factors
 */
function generateRecommendedActions(
  factors: RetentionRiskFactors,
  riskLevel: string
): Array<{
  action: string;
  priority: 'Immediate' | 'Short-term' | 'Medium-term';
  expectedImpact: number;
  description: string;
}> {
  const actions = [];

  // Critical role misalignment
  if (factors.roleMatchScore >= 70) {
    actions.push({
      action: 'Role Review & Adjustment',
      priority: 'Immediate' as const,
      expectedImpact: 85,
      description: 'Schedule urgent discussion about role fit. Consider role change, responsibilities adjustment, or transfer to better-fit position.'
    });
  }

  // Motivation misalignment
  if (factors.motivationAlignment >= 60) {
    actions.push({
      action: 'Career Development Conversation',
      priority: riskLevel === 'Critical' ? 'Immediate' as const : 'Short-term' as const,
      expectedImpact: 75,
      description: 'Discuss career aspirations and create clear progression plan. Identify opportunities for advancement or expanded responsibilities.'
    });
  }

  // Low engagement
  if (factors.engagementIndicators >= 60) {
    actions.push({
      action: 'Engagement & Wellbeing Check-in',
      priority: 'Immediate' as const,
      expectedImpact: 65,
      description: 'One-on-one to understand causes of disengagement. May indicate burnout, role dissatisfaction, or personal issues.'
    });
  }

  // Development gaps
  if (factors.developmentGapSeverity >= 60) {
    actions.push({
      action: 'Accelerated Development Plan',
      priority: 'Short-term' as const,
      expectedImpact: 70,
      description: 'Create focused training plan to address critical skill gaps. Assign mentor, provide resources, set milestones.'
    });
  }

  // Tenure risk
  if (factors.tenureRisk >= 60) {
    actions.push({
      action: 'Progression Planning',
      priority: 'Short-term' as const,
      expectedImpact: 60,
      description: 'Define clear path to next level. Set timeline for promotion review. Identify specific competencies to develop.'
    });
  }

  // EQ mismatch
  if (factors.eqMismatch >= 60) {
    actions.push({
      action: 'EQ Development or Role Realignment',
      priority: 'Medium-term' as const,
      expectedImpact: 55,
      description: 'Either provide EQ coaching/training or consider transition to more suitable role (e.g., technical role if struggling with client-facing).'
    });
  }

  // Generic retention actions if no specific high risks
  if (actions.length === 0 && riskLevel !== 'Low') {
    actions.push({
      action: 'Regular Check-ins',
      priority: 'Short-term' as const,
      expectedImpact: 40,
      description: 'Maintain regular 1-on-1s to monitor satisfaction and address concerns early.'
    });
  }

  // Sort by priority and impact
  const priorityOrder = { 'Immediate': 1, 'Short-term': 2, 'Medium-term': 3 };
  return actions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.expectedImpact - a.expectedImpact;
  }).slice(0, 5); // Top 5 actions
}

/**
 * Get time to action based on risk level
 */
function getTimeToAction(riskLevel: string): string {
  switch (riskLevel) {
    case 'Critical': return 'Act within 1 week';
    case 'High': return 'Act within 2-3 weeks';
    case 'Medium': return 'Act within 1-2 months';
    case 'Low': return 'Monitor quarterly';
    default: return 'Monitor quarterly';
  }
}

/**
 * Calculate retention risk for entire practice
 */
export async function calculatePracticeRetentionRisks(practiceId: string): Promise<RetentionRiskResult[]> {
  console.log('[RetentionRisk] 🏢 Calculating for entire practice:', practiceId);

  // Get all active, non-test members
  const { data: members } = await supabase
    .from('practice_members')
    .select('id')
    .eq('is_active', true)
    .or('is_test_account.is.null,is_test_account.eq.false');

  if (!members || members.length === 0) {
    console.log('[RetentionRisk] No members found');
    return [];
  }

  // Calculate risk for each member in parallel
  const riskPromises = members.map(m => calculateRetentionRisk(m.id));
  const results = await Promise.all(riskPromises);

  // Filter out nulls and sort by risk score (highest first)
  return results
    .filter((r): r is RetentionRiskResult => r !== null)
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Get summary statistics for practice retention risks
 */
export async function getPracticeRetentionSummary(practiceId: string) {
  const risks = await calculatePracticeRetentionRisks(practiceId);

  return {
    totalMembers: risks.length,
    criticalRisk: risks.filter(r => r.riskLevel === 'Critical').length,
    highRisk: risks.filter(r => r.riskLevel === 'High').length,
    mediumRisk: risks.filter(r => r.riskLevel === 'Medium').length,
    lowRisk: risks.filter(r => r.riskLevel === 'Low').length,
    averageRiskScore: Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length),
    topRisks: risks.slice(0, 5), // Top 5 highest risk members
    calculatedAt: new Date().toISOString()
  };
}

