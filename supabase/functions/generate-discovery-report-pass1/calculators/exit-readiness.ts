// ============================================================================
// EXIT READINESS CALCULATOR
// ============================================================================
// Calculates exit readiness score with pre-built phrases for Pass 2
// ============================================================================

import { 
  ExitReadinessMetrics, 
  ExitReadinessFactor,
  CalculatedMetric,
  formatPercent
} from '../types/pass1-output.ts';

type ClientBusinessType = 
  | 'trading_product'
  | 'trading_agency'
  | 'professional_practice'
  | 'investment_vehicle'
  | 'funded_startup'
  | 'lifestyle_business';

interface FrameworkOverrides {
  useEarningsValuation: boolean;
  useAssetValuation: boolean;
  benchmarkAgainst: string | null;
  exitReadinessRelevant: boolean;
  payrollBenchmarkRelevant: boolean;
  appropriateServices: string[];
  inappropriateServices: string[];
  reportFraming: 'transformation' | 'wealth_protection' | 'foundations' | 'optimisation';
  maxRecommendedInvestment: number | null;
}

export interface ExitReadinessInputs {
  // From assessment
  hoursWorked?: string;
  businessRunsWithout?: boolean;
  hasDocumentedProcesses?: boolean;
  hasManagementTeam?: boolean;
  hasValuationBaseline?: boolean;
  exitPlanDocumented?: boolean;
  
  // From financials
  trajectoryDeclining?: boolean;
  payrollOverstaffed?: boolean;
  
  // From discovery
  founderKeyRelationships?: boolean;
  customerConcentrationRisk?: boolean;
}

/**
 * Calculate exit readiness metrics with pre-built phrases
 */
export function calculateExitReadinessMetrics(
  inputs: ExitReadinessInputs,
  clientType?: ClientBusinessType,
  frameworkOverrides?: FrameworkOverrides
): ExitReadinessMetrics | { status: 'not_applicable'; notApplicableReason: string; hasData: false } {
  // ========================================================================
  // APPLICABILITY CHECK
  // ========================================================================
  // Exit readiness is not applicable for:
  // - investment_vehicle (not planning exit, wealth protection focus)
  // - funded_startup (5+ year horizon, no exit planning)
  // - lifestyle_business (not exit-focused)
  
  if (frameworkOverrides && !frameworkOverrides.exitReadinessRelevant) {
    const reason = clientType === 'investment_vehicle'
      ? 'Exit readiness not applicable - investment vehicles focus on wealth protection, not exit'
      : clientType === 'funded_startup'
      ? 'Exit readiness not applicable - funded startups have 5+ year horizon, no exit planning'
      : clientType === 'lifestyle_business'
      ? 'Exit readiness not applicable - lifestyle businesses not exit-focused'
      : 'Exit readiness not applicable for this client type';
    
    console.log('[Exit Readiness] Not applicable:', reason);
    return {
      status: 'not_applicable',
      notApplicableReason: reason,
      hasData: false
    } as any;
  }
  const now = new Date().toISOString();
  
  const factors: ExitReadinessFactor[] = [];
  const strengths: string[] = [];
  const blockers: string[] = [];
  
  let totalScore = 0;
  const maxScore = 100;
  
  // Factor 1: Founder Dependency (20 points)
  const founderDependencyScore = calculateFounderDependencyScore(inputs);
  factors.push({
    name: 'Founder Dependency',
    score: founderDependencyScore.score,
    maxScore: 20,
    status: founderDependencyScore.score >= 15 ? 'green' : 
            founderDependencyScore.score >= 10 ? 'amber' : 'red',
    note: founderDependencyScore.note
  });
  totalScore += founderDependencyScore.score;
  if (founderDependencyScore.score >= 15) strengths.push(founderDependencyScore.note);
  if (founderDependencyScore.score < 10) blockers.push('High founder dependency');
  
  // Factor 2: Financial Trajectory (20 points)
  const trajectoryScore = inputs.trajectoryDeclining ? 8 : 18;
  factors.push({
    name: 'Financial Trajectory',
    score: trajectoryScore,
    maxScore: 20,
    status: trajectoryScore >= 15 ? 'green' : 
            trajectoryScore >= 10 ? 'amber' : 'red',
    note: inputs.trajectoryDeclining ? 'Declining revenue' : 'Stable/growing revenue'
  });
  totalScore += trajectoryScore;
  if (!inputs.trajectoryDeclining) strengths.push('Revenue stable or growing');
  if (inputs.trajectoryDeclining) blockers.push('Declining revenue trajectory');
  
  // Factor 3: Team Readiness (15 points)
  const teamScore = inputs.payrollOverstaffed ? 8 : 
                    inputs.hasManagementTeam ? 14 : 10;
  factors.push({
    name: 'Team Readiness',
    score: teamScore,
    maxScore: 15,
    status: teamScore >= 12 ? 'green' : 
            teamScore >= 8 ? 'amber' : 'red',
    note: inputs.payrollOverstaffed ? 'Overstaffed - restructuring needed' :
          inputs.hasManagementTeam ? 'Management team in place' : 'Team structure adequate'
  });
  totalScore += teamScore;
  if (inputs.hasManagementTeam) strengths.push('Management team in place');
  if (inputs.payrollOverstaffed) blockers.push('Team restructuring needed before sale');
  
  // Factor 4: Documentation (15 points)
  const docScore = inputs.hasDocumentedProcesses ? 13 : 
                   inputs.exitPlanDocumented ? 10 : 5;
  factors.push({
    name: 'Documentation',
    score: docScore,
    maxScore: 15,
    status: docScore >= 12 ? 'green' : 
            docScore >= 8 ? 'amber' : 'red',
    note: inputs.hasDocumentedProcesses ? 'Processes documented' : 
          inputs.exitPlanDocumented ? 'Exit plan exists' : 'Limited documentation'
  });
  totalScore += docScore;
  if (inputs.hasDocumentedProcesses) strengths.push('Documented processes');
  if (!inputs.hasDocumentedProcesses && !inputs.exitPlanDocumented) blockers.push('Processes need documenting');
  
  // Factor 5: Valuation Baseline (15 points)
  const valuationScore = inputs.hasValuationBaseline ? 14 : 3;
  factors.push({
    name: 'Valuation Baseline',
    score: valuationScore,
    maxScore: 15,
    status: valuationScore >= 12 ? 'green' : 
            valuationScore >= 6 ? 'amber' : 'red',
    note: inputs.hasValuationBaseline ? 'Has valuation baseline' : 'No baseline valuation'
  });
  totalScore += valuationScore;
  if (inputs.hasValuationBaseline) strengths.push('Has valuation baseline');
  if (!inputs.hasValuationBaseline) blockers.push('No baseline valuation to negotiate from');
  
  // Factor 6: Customer Concentration (15 points)
  const concentrationScore = inputs.customerConcentrationRisk ? 8 : 13;
  factors.push({
    name: 'Customer Concentration',
    score: concentrationScore,
    maxScore: 15,
    status: concentrationScore >= 12 ? 'green' : 
            concentrationScore >= 8 ? 'amber' : 'red',
    note: inputs.customerConcentrationRisk ? 'Customer concentration risk' : 'Diversified customer base'
  });
  totalScore += concentrationScore;
  if (!inputs.customerConcentrationRisk) strengths.push('Diversified customer base');
  if (inputs.customerConcentrationRisk) blockers.push('Customer concentration risk');
  
  // Determine overall readiness
  const percentage = Math.round((totalScore / maxScore) * 100);
  const readiness: 'ready' | 'nearly' | 'not_ready' = 
    percentage >= 75 ? 'ready' :
    percentage >= 50 ? 'nearly' : 'not_ready';
  
  // Build overall score metric
  const overallScoreMetric: CalculatedMetric = {
    value: percentage,
    formatted: formatPercent(percentage, 0),
    benchmark: 75,
    benchmarkSource: 'Exit-ready threshold',
    variance: percentage - 75,
    varianceFormatted: percentage >= 75 ? 'Exit ready' : 
                       `${75 - percentage}% below exit-ready threshold`,
    status: percentage >= 75 ? 'good' :
            percentage >= 50 ? 'neutral' : 'concern',
    direction: percentage >= 75 ? 'above' : 'below',
    phrases: {
      headline: `Exit readiness: ${formatPercent(percentage, 0)}`,
      impact: readiness === 'ready' ? 'Business is exit-ready' :
              readiness === 'nearly' ? 'Close to exit-ready - gaps to close' :
              'Significant work needed before exit',
      context: `${strengths.length} strength${strengths.length !== 1 ? 's' : ''}, ${blockers.length} blocker${blockers.length !== 1 ? 's' : ''}`
    },
    calculation: {
      formula: '(totalScore / maxScore) × 100',
      inputs: { totalScore, maxScore },
      timestamp: now
    }
  };
  
  // Build founder dependency metric
  const founderDependencyMetric: CalculatedMetric = {
    value: 100 - (founderDependencyScore.score / 20 * 100), // Invert: lower is better
    formatted: `${Math.round(100 - (founderDependencyScore.score / 20 * 100))}%`,
    benchmark: 25,
    benchmarkSource: 'Healthy founder dependency',
    variance: null,
    varianceFormatted: '',
    status: founderDependencyScore.score >= 15 ? 'excellent' :
            founderDependencyScore.score >= 10 ? 'good' : 'concern',
    direction: founderDependencyScore.score >= 10 ? 'below' : 'above',
    phrases: {
      headline: `Founder dependency: ${Math.round(100 - (founderDependencyScore.score / 20 * 100))}%`,
      impact: founderDependencyScore.note,
      context: founderDependencyScore.score >= 15 
        ? 'Business runs without constant attention - rare and valuable'
        : 'Reduce founder dependency before exit'
    },
    calculation: {
      formula: 'Based on hours worked and business autonomy indicators',
      inputs: { 
        hoursWorked: inputs.hoursWorked || null,
        businessRunsWithout: inputs.businessRunsWithout || false
      },
      timestamp: now
    }
  };
  
  // Build phrases
  const phrases = {
    summary: `${formatPercent(percentage, 0)} exit ready - ${
      readiness === 'ready' ? 'strong foundation' :
      readiness === 'nearly' ? 'close but gaps remain' :
      'significant work needed'
    }`,
    topStrength: strengths[0] || 'Foundation being built',
    topBlocker: blockers[0] || 'No major blockers identified'
  };
  
  return {
    status: 'calculated',
    hasData: true,
    overallScore: overallScoreMetric,
    founderDependency: founderDependencyMetric,
    documentationScore: null, // Could expand
    systemsScore: null,
    teamScore: null,
    factors,
    strengths,
    blockers,
    phrases
  };
}

/**
 * Calculate founder dependency score
 */
function calculateFounderDependencyScore(
  inputs: ExitReadinessInputs
): { score: number; note: string } {
  const { hoursWorked, businessRunsWithout, founderKeyRelationships } = inputs;
  
  let score = 10; // Start at middle
  let notes: string[] = [];
  
  // Hours worked adjustment
  if (hoursWorked) {
    const hours = hoursWorked.toLowerCase();
    if (hours.includes('under 20') || hours.includes('< 20') || hours.includes('20 or less')) {
      score += 6;
      notes.push('Works under 20 hours');
    } else if (hours.includes('under 30') || hours.includes('20-30') || hours.includes('less than 30')) {
      score += 4;
      notes.push('Works under 30 hours');
    } else if (hours.includes('40') || hours.includes('full time')) {
      score -= 2;
      notes.push('Works full time');
    } else if (hours.includes('50') || hours.includes('60') || hours.includes('more than')) {
      score -= 5;
      notes.push('Works excessive hours');
    }
  }
  
  // Business runs without adjustment
  if (businessRunsWithout) {
    score += 4;
    notes.push('Business runs without constant attention');
  }
  
  // Key relationships adjustment
  if (founderKeyRelationships) {
    score -= 3;
    notes.push('Founder holds key relationships');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(20, score));
  
  const note = notes.length > 0 ? notes[0] : 
               score >= 15 ? 'Low founder dependency' :
               score >= 10 ? 'Moderate founder dependency' : 
               'High founder dependency';
  
  return { score, note };
}

/**
 * Extract exit readiness signals from assessment responses
 */
export function extractExitReadinessSignals(
  responses: Record<string, any>
): Partial<ExitReadinessInputs> {
  const allText = JSON.stringify(responses).toLowerCase();
  
  return {
    hoursWorked: responses.sd_hours_worked || responses.dd_hours_worked || undefined,
    businessRunsWithout: allText.includes('runs without') || 
                         allText.includes('ticks along') ||
                         allText.includes('team handles'),
    hasDocumentedProcesses: allText.includes('documented') || 
                            allText.includes('sops') ||
                            allText.includes('procedures'),
    hasManagementTeam: allText.includes('management team') ||
                       allText.includes('senior team') ||
                       allText.includes('leadership'),
    hasValuationBaseline: allText.includes('valuation') &&
                          (allText.includes('had') || allText.includes('done')),
    exitPlanDocumented: allText.includes('exit plan') ||
                        allText.includes('succession'),
    founderKeyRelationships: allText.includes('my relationships') ||
                             allText.includes('i handle') ||
                             allText.includes('customers know me')
  };
}
