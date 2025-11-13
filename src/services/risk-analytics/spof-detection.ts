/**
 * Single Point of Failure (SPOF) Detection
 * 
 * Identifies critical skills held by only one team member
 * Assesses business continuity risk and suggests mitigation strategies
 * 
 * Risk Categories:
 * - Critical: High-importance skill with only 1 expert
 * - High: Medium-importance skill with only 1 expert  
 * - Watch: Low-importance skill with only 1 expert
 * - Vulnerable: 2 people but still risky
 */

import { supabase } from '@/lib/supabase/client';

export interface SinglePointFailure {
  skillId: string;
  skillName: string;
  skillCategory: string;
  soleExpertId: string;
  soleExpertName: string;
  soleExpertLevel: number;        // 1-5
  criticalityScore: number;       // 0-100 (how critical is this skill)
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Watch';
  
  // Business impact
  estimatedClientImpact: string;  // "High" | "Medium" | "Low"
  wouldBlockDelivery: boolean;    // Would losing this person block client work?
  
  // Mitigation options
  crossTrainCandidates: Array<{
    memberId: string;
    memberName: string;
    currentLevel: number;
    gapToClose: number;
    estimatedTimeWeeks: number;
    suitabilityScore: number;
  }>;
  
  shouldHire: boolean;
  shouldDocument: boolean;
  urgency: 'Immediate' | 'Short-term' | 'Medium-term' | 'Monitor';
}

export interface TeamRedundancyAnalysis {
  totalSkills: number;
  criticalSPOFs: number;           // Critical skills with 1 person
  highSPOFs: number;               // Important skills with 1 person
  vulnerableSkills: number;        // Skills with 2 people
  healthySkills: number;           // Skills with 3+ people
  
  overallRedundancyScore: number;  // 0-100 (100 = excellent redundancy)
  businessContinuityRisk: 'Critical' | 'High' | 'Medium' | 'Low';
  
  spofs: SinglePointFailure[];
  calculatedAt: string;
}

/**
 * Skill importance weightings (based on common advisory practice needs)
 */
const SKILL_IMPORTANCE: Record<string, number> = {
  // Critical (90-100)
  'Client Relationship Management': 95,
  'Financial Reporting': 95,
  'Tax Compliance': 95,
  'Audit Management': 95,
  'Statutory Accounts': 90,
  'Management Accounts': 90,
  'VAT': 90,
  
  // High (70-89)
  'Bookkeeping': 80,
  'Payroll': 80,
  'Cloud Accounting': 80,
  'Forecasting': 75,
  'Budgeting': 75,
  'Cash Flow Management': 75,
  'Corporation Tax': 75,
  
  // Medium (50-69)
  'Data Analysis': 60,
  'Process Improvement': 60,
  'Training & Mentoring': 55,
  'Project Management': 55,
  
  // Default for unlisted skills
  'default': 50
};

/**
 * Get importance score for a skill
 */
function getSkillImportance(skillName: string): number {
  return SKILL_IMPORTANCE[skillName] || SKILL_IMPORTANCE['default'];
}

/**
 * Analyze Single Points of Failure for entire practice
 */
export async function analyzeSinglePointsOfFailure(practiceId: string): Promise<TeamRedundancyAnalysis> {
  console.log('[SPOF] 🔍 Analyzing single points of failure for practice:', practiceId);

  try {
    // 1. Get all skills
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!skills || skills.length === 0) {
      console.error('[SPOF] No skills found');
      return getEmptyAnalysis();
    }

    // 2. Get all active, non-test team members
    const { data: members } = await supabase
      .from('practice_members')
      .select('id, name, role')
      .eq('is_active', true)
      .or('is_test_account.is.null,is_test_account.eq.false');

    if (!members || members.length === 0) {
      console.error('[SPOF] No members found');
      return getEmptyAnalysis();
    }

    const memberIds = members.map(m => m.id);

    // 3. Get all skill assessments
    const { data: assessments } = await supabase
      .from('skill_assessments')
      .select('*')
      .in('team_member_id', memberIds);

    if (!assessments || assessments.length === 0) {
      console.error('[SPOF] No assessments found');
      return getEmptyAnalysis();
    }

    // 4. Analyze each skill for SPOF risk
    const spofs: SinglePointFailure[] = [];
    let criticalSPOFs = 0;
    let highSPOFs = 0;
    let vulnerableSkills = 0;
    let healthySkills = 0;

    for (const skill of skills) {
      // Find all members with this skill at competent level (3+)
      const competentMembers = assessments.filter(a => 
        a.skill_id === skill.id && 
        a.current_level >= 3
      );

      const memberCount = competentMembers.length;
      const importance = getSkillImportance(skill.name);

      // SPOF: Only 1 person has this skill at competent level
      if (memberCount === 1) {
        const assessment = competentMembers[0];
        const expert = members.find(m => m.id === assessment.team_member_id);

        if (!expert) continue;

        // Calculate criticality score (0-100)
        // Based on: skill importance + expert's proficiency level
        const proficiencyBonus = (assessment.current_level - 3) * 5; // +0, +5, or +10
        const criticalityScore = Math.min(100, importance + proficiencyBonus);

        // Determine risk level
        let riskLevel: 'Critical' | 'High' | 'Medium' | 'Watch';
        if (criticalityScore >= 90) {
          riskLevel = 'Critical';
          criticalSPOFs++;
        } else if (criticalityScore >= 70) {
          riskLevel = 'High';
          highSPOFs++;
        } else if (criticalityScore >= 50) {
          riskLevel = 'Medium';
        } else {
          riskLevel = 'Watch';
        }

        // Estimate client impact
        const estimatedClientImpact = criticalityScore >= 80 ? 'High' :
                                     criticalityScore >= 60 ? 'Medium' : 'Low';
        const wouldBlockDelivery = criticalityScore >= 80;

        // Find cross-training candidates
        const crossTrainCandidates = await findCrossTrainCandidates(
          skill.id,
          assessment.team_member_id,
          members,
          assessments
        );

        // Mitigation recommendations
        const shouldHire = criticalityScore >= 90 && crossTrainCandidates.length === 0;
        const shouldDocument = criticalityScore >= 70;
        
        const urgency: 'Immediate' | 'Short-term' | 'Medium-term' | 'Monitor' =
          criticalityScore >= 90 ? 'Immediate' :
          criticalityScore >= 70 ? 'Short-term' :
          criticalityScore >= 50 ? 'Medium-term' : 'Monitor';

        spofs.push({
          skillId: skill.id,
          skillName: skill.name,
          skillCategory: skill.category || 'Uncategorized',
          soleExpertId: expert.id,
          soleExpertName: expert.name,
          soleExpertLevel: assessment.current_level,
          criticalityScore,
          riskLevel,
          estimatedClientImpact,
          wouldBlockDelivery,
          crossTrainCandidates,
          shouldHire,
          shouldDocument,
          urgency
        });

      } else if (memberCount === 2) {
        // Vulnerable: Only 2 people (not SPOF but still risky)
        vulnerableSkills++;
      } else if (memberCount >= 3) {
        // Healthy: 3+ people with competency
        healthySkills++;
      }
    }

    // Calculate overall redundancy score
    const totalCriticalSkills = skills.filter(s => getSkillImportance(s.name) >= 70).length;
    const criticalSkillsCovered = totalCriticalSkills - criticalSPOFs - highSPOFs;
    const coverageRate = totalCriticalSkills > 0 ? criticalSkillsCovered / totalCriticalSkills : 1;
    
    const overallRedundancyScore = Math.round(coverageRate * 100);

    // Determine business continuity risk
    const businessContinuityRisk: 'Critical' | 'High' | 'Medium' | 'Low' =
      criticalSPOFs > 0 ? 'Critical' :
      highSPOFs >= 3 ? 'High' :
      highSPOFs >= 1 ? 'Medium' : 'Low';

    // Sort SPOFs by criticality (highest first)
    spofs.sort((a, b) => b.criticalityScore - a.criticalityScore);

    return {
      totalSkills: skills.length,
      criticalSPOFs,
      highSPOFs,
      vulnerableSkills,
      healthySkills,
      overallRedundancyScore,
      businessContinuityRisk,
      spofs,
      calculatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('[SPOF] Error analyzing SPOFs:', error);
    return getEmptyAnalysis();
  }
}

/**
 * Find candidates for cross-training
 */
async function findCrossTrainCandidates(
  skillId: string,
  expertId: string,
  members: any[],
  assessments: any[]
): Promise<Array<{
  memberId: string;
  memberName: string;
  currentLevel: number;
  gapToClose: number;
  estimatedTimeWeeks: number;
  suitabilityScore: number;
}>> {
  // Find members who:
  // 1. Have this skill at level 1-2 (some familiarity)
  // 2. Have high interest in this skill (if tracked)
  // 3. Are NOT the current expert

  const candidates = assessments
    .filter(a => 
      a.skill_id === skillId &&
      a.team_member_id !== expertId &&
      a.current_level >= 1 &&
      a.current_level < 3
    )
    .map(a => {
      const member = members.find(m => m.id === a.team_member_id);
      if (!member) return null;

      const currentLevel = a.current_level;
      const targetLevel = 3; // Competent
      const gapToClose = targetLevel - currentLevel;
      
      // Estimate time: 8-12 weeks per level typically
      const estimatedTimeWeeks = gapToClose * 10;

      // Suitability score based on:
      // - Current level (higher = better starting point)
      // - Interest level (if available)
      // - Learning velocity (if historical data available)
      const baseScore = currentLevel * 25; // Level 1 = 25, Level 2 = 50
      const interestBonus = (a.interest_level || 3) * 10; // Up to +50
      const suitabilityScore = Math.min(100, baseScore + interestBonus);

      return {
        memberId: member.id,
        memberName: member.name,
        currentLevel,
        gapToClose,
        estimatedTimeWeeks,
        suitabilityScore
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 3); // Top 3 candidates

  return candidates;
}

/**
 * Get empty analysis (when no data)
 */
function getEmptyAnalysis(): TeamRedundancyAnalysis {
  return {
    totalSkills: 0,
    criticalSPOFs: 0,
    highSPOFs: 0,
    vulnerableSkills: 0,
    healthySkills: 0,
    overallRedundancyScore: 0,
    businessContinuityRisk: 'Critical',
    spofs: [],
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Generate mitigation plan for a specific SPOF
 */
export function generateMitigationPlan(spof: SinglePointFailure): {
  recommendations: Array<{
    action: string;
    priority: 'Critical' | 'High' | 'Medium';
    timeframe: string;
    resources: string;
    expectedOutcome: string;
  }>;
  estimatedCost: string;
  estimatedTime: string;
} {
  const recommendations = [];

  // 1. Cross-training (if candidates available)
  if (spof.crossTrainCandidates.length > 0) {
    const topCandidate = spof.crossTrainCandidates[0];
    recommendations.push({
      action: `Cross-train ${topCandidate.memberName}`,
      priority: spof.riskLevel === 'Critical' ? 'Critical' : 'High',
      timeframe: `${topCandidate.estimatedTimeWeeks} weeks`,
      resources: `1-on-1 mentoring with ${spof.soleExpertName}, structured training plan`,
      expectedOutcome: `${topCandidate.memberName} reaches competent level (3) in ${spof.skillName}`
    });
  }

  // 2. Documentation (always for high-criticality)
  if (spof.shouldDocument) {
    recommendations.push({
      action: 'Document critical processes and knowledge',
      priority: spof.riskLevel === 'Critical' ? 'Critical' : 'High',
      timeframe: '2-4 weeks',
      resources: `${spof.soleExpertName} creates SOPs, checklists, knowledge base articles`,
      expectedOutcome: 'Essential knowledge preserved if expert unavailable'
    });
  }

  // 3. Hiring (if no viable cross-train candidates)
  if (spof.shouldHire) {
    recommendations.push({
      action: 'Recruit additional expert',
      priority: 'High',
      timeframe: '3-6 months',
      resources: 'Recruitment budget, hiring manager time',
      expectedOutcome: 'Permanent redundancy in critical skill area'
    });
  }

  // 4. Backup arrangements (immediate mitigation)
  if (spof.riskLevel === 'Critical') {
    recommendations.push({
      action: 'Establish emergency backup arrangements',
      priority: 'Critical',
      timeframe: '1 week',
      resources: 'External consultant on retainer, or partnership agreement',
      expectedOutcome: 'Immediate backup available if expert unavailable'
    });
  }

  // Estimate overall cost and time
  const estimatedCost = spof.shouldHire ? '£40k-60k (hiring)' :
                       spof.crossTrainCandidates.length > 0 ? '£2k-5k (training)' :
                       '£1k-3k (documentation)';

  const estimatedTime = spof.shouldHire ? '6-12 months' :
                       spof.crossTrainCandidates.length > 0 ? `${spof.crossTrainCandidates[0].estimatedTimeWeeks} weeks` :
                       '2-4 weeks';

  return {
    recommendations,
    estimatedCost,
    estimatedTime
  };
}

/**
 * Get SPOF summary for executive reporting
 */
export async function getSPOFExecutiveSummary(practiceId: string): Promise<{
  overallRisk: string;
  criticalCount: number;
  topRisks: Array<{ skillName: string; expertName: string; impact: string }>;
  recommendedActions: string[];
  estimatedMitigationCost: string;
}> {
  const analysis = await analyzeSinglePointsOfFailure(practiceId);

  const topRisks = analysis.spofs
    .slice(0, 5)
    .map(s => ({
      skillName: s.skillName,
      expertName: s.soleExpertName,
      impact: s.estimatedClientImpact
    }));

  const recommendedActions = [
    analysis.criticalSPOFs > 0 ? `URGENT: Address ${analysis.criticalSPOFs} critical single points of failure` : null,
    analysis.highSPOFs > 0 ? `Initiate cross-training for ${analysis.highSPOFs} high-risk skills` : null,
    analysis.vulnerableSkills > 10 ? `Monitor ${analysis.vulnerableSkills} skills with limited redundancy` : null,
    'Establish quarterly SPOF review process',
    'Create knowledge documentation standards'
  ].filter((a): a is string => a !== null);

  // Rough cost estimate for mitigation
  const crossTrainCost = (analysis.criticalSPOFs + analysis.highSPOFs) * 3000;
  const hiringCost = analysis.spofs.filter(s => s.shouldHire).length * 50000;
  const totalCost = crossTrainCost + hiringCost;

  const estimatedMitigationCost = totalCost > 0 ? `£${(totalCost / 1000).toFixed(0)}k` : '£0';

  return {
    overallRisk: analysis.businessContinuityRisk,
    criticalCount: analysis.criticalSPOFs,
    topRisks,
    recommendedActions,
    estimatedMitigationCost
  };
}

