// ============================================================================
// ACHIEVEMENTS CALCULATOR
// ============================================================================
// Identifies what the client has done RIGHT with pre-built phrases for Pass 2
// ============================================================================

import { 
  AchievementsMetrics, 
  Achievement
} from '../types/pass1-output.ts';

import { PayrollMetrics } from './payroll.ts';
import { ProfitabilityMetrics } from './profitability.ts';
import { ExitReadinessMetrics } from './exit-readiness.ts';

export interface AchievementsInputs {
  // From assessment
  responses: Record<string, any>;
  
  // From calculations
  payroll?: PayrollMetrics | null;
  profitability?: ProfitabilityMetrics | null;
  exitReadiness?: ExitReadinessMetrics | null;
  
  // From signals
  isMarketLeader?: boolean;
  businessRunsWithout?: boolean;
  trajectoryGrowing?: boolean;
}

/**
 * Calculate achievements metrics with pre-built phrases
 */
export function calculateAchievementsMetrics(
  inputs: AchievementsInputs
): AchievementsMetrics {
  const { 
    responses,
    payroll,
    profitability,
    exitReadiness,
    isMarketLeader,
    businessRunsWithout,
    trajectoryGrowing
  } = inputs;
  
  const achievements: Achievement[] = [];
  
  // Achievement: Business runs without founder
  if (businessRunsWithout) {
    achievements.push({
      category: 'operational',
      achievement: 'Business runs without constant attention',
      evidence: extractEvidence(responses, ['runs without', 'ticks along', 'team handles']),
      significance: 'high',
      phrase: "You've built a business that runs without you - that's rare and valuable"
    });
  }
  
  // Achievement: Market leader
  if (isMarketLeader) {
    achievements.push({
      category: 'strategic',
      achievement: 'Clear market leader in niche',
      evidence: extractEvidence(responses, ['market leader', 'leading', 'dominant', 'we are the']),
      significance: 'high',
      phrase: "You're the clear market leader in your niche"
    });
  }
  
  // Achievement: Excellent gross margins
  if (profitability?.grossMargin.status === 'excellent') {
    achievements.push({
      category: 'financial',
      achievement: 'Excellent gross margins',
      evidence: `${profitability.grossMargin.formatted} gross margin`,
      significance: 'high',
      phrase: `Your ${profitability.grossMargin.formatted} gross margin is excellent for the industry`
    });
  } else if (profitability?.grossMargin.status === 'good') {
    achievements.push({
      category: 'financial',
      achievement: 'Healthy gross margins',
      evidence: `${profitability.grossMargin.formatted} gross margin`,
      significance: 'medium',
      phrase: `Your ${profitability.grossMargin.formatted} gross margin is healthy`
    });
  }
  
  // Achievement: Efficient payroll (if not overstaffed)
  if (payroll && !payroll.summary.isOverstaffed) {
    achievements.push({
      category: 'financial',
      achievement: 'Efficient staffing',
      evidence: `Staff costs at ${payroll.staffCostsPercent.formatted} - within benchmark`,
      significance: 'medium',
      phrase: `Your staffing is efficient at ${payroll.staffCostsPercent.formatted} of revenue`
    });
  }
  
  // Achievement: Growing trajectory
  if (trajectoryGrowing) {
    achievements.push({
      category: 'financial',
      achievement: 'Revenue growing',
      evidence: 'Year-on-year revenue growth',
      significance: 'high',
      phrase: "Revenue is growing - that's what buyers want to see"
    });
  }
  
  // Achievement: Low founder dependency
  if (exitReadiness && exitReadiness.founderDependency.status === 'excellent') {
    achievements.push({
      category: 'operational',
      achievement: 'Low founder dependency',
      evidence: exitReadiness.founderDependency.phrases.impact,
      significance: 'high',
      phrase: 'The business genuinely runs without you - buyers will pay more for that'
    });
  }
  
  // Achievement: Strong exit readiness
  if (exitReadiness && (exitReadiness.overallScore.value || 0) >= 70) {
    achievements.push({
      category: 'strategic',
      achievement: 'Strong exit readiness',
      evidence: `${exitReadiness.overallScore.formatted} exit ready`,
      significance: 'high',
      phrase: `At ${exitReadiness.overallScore.formatted} exit readiness, you've done the hard work`
    });
  }
  
  // Assessment-based achievements
  const assessmentAchievements = extractAssessmentAchievements(responses);
  achievements.push(...assessmentAchievements);
  
  // Build summary phrases
  const topAchievements = achievements
    .filter(a => a.significance === 'high')
    .slice(0, 3)
    .map(a => a.achievement)
    .join(', ') || 'Foundation being built';
  
  const foundationStatement = achievements.length >= 3
    ? "The foundation is solid - now it's about closing the gaps"
    : achievements.length >= 1
    ? "You've made progress - let's build on it"
    : "Let's identify and build on your strengths";
  
  return {
    achievements,
    phrases: {
      topAchievements,
      foundationStatement
    }
  };
}

/**
 * Extract evidence from responses
 */
function extractEvidence(
  responses: Record<string, any>,
  keywords: string[]
): string {
  const allText = JSON.stringify(responses).toLowerCase();
  
  for (const key of Object.keys(responses)) {
    const value = String(responses[key] || '').toLowerCase();
    for (const keyword of keywords) {
      if (value.includes(keyword)) {
        return responses[key]; // Return the original (not lowercased) value
      }
    }
  }
  
  return 'From assessment responses';
}

/**
 * Extract achievements from assessment responses
 */
function extractAssessmentAchievements(
  responses: Record<string, any>
): Achievement[] {
  const achievements: Achievement[] = [];
  const allText = JSON.stringify(responses).toLowerCase();
  
  // Check for customer loyalty
  if (allText.includes('loyal customer') || 
      allText.includes('repeat customer') ||
      allText.includes('long-term client') ||
      allText.includes('recurring')) {
    achievements.push({
      category: 'strategic',
      achievement: 'Strong customer loyalty',
      evidence: extractEvidence(responses, ['loyal', 'repeat', 'long-term', 'recurring']),
      significance: 'medium',
      phrase: 'Strong customer loyalty - buyers value sticky revenue'
    });
  }
  
  // Check for strong team
  if (allText.includes('great team') ||
      allText.includes('strong team') ||
      allText.includes('capable team') ||
      allText.includes('trust my team')) {
    achievements.push({
      category: 'operational',
      achievement: 'Strong team in place',
      evidence: extractEvidence(responses, ['great team', 'strong team', 'capable', 'trust']),
      significance: 'medium',
      phrase: "You've built a capable team - that's an asset"
    });
  }
  
  // Check for clear vision
  if (allText.includes('clear vision') ||
      allText.includes('know exactly') ||
      allText.includes('want to sell') ||
      allText.includes('exit')) {
    achievements.push({
      category: 'personal',
      achievement: 'Clear exit vision',
      evidence: extractEvidence(responses, ['vision', 'know exactly', 'want to sell', 'exit']),
      significance: 'medium',
      phrase: 'You have clarity on where you want to end up'
    });
  }
  
  // Check for industry experience
  if (allText.includes('20 years') ||
      allText.includes('25 years') ||
      allText.includes('30 years') ||
      allText.includes('decades')) {
    achievements.push({
      category: 'personal',
      achievement: 'Deep industry experience',
      evidence: extractEvidence(responses, ['years', 'decades', 'experience']),
      significance: 'medium',
      phrase: 'Your deep industry experience built something valuable'
    });
  }
  
  return achievements;
}

/**
 * Build achievements phrase for narrative
 */
export function buildAchievementsPhrase(
  achievements: AchievementsMetrics
): string {
  if (achievements.achievements.length === 0) {
    return "Let's identify your strengths and build from there.";
  }
  
  const high = achievements.achievements.filter(a => a.significance === 'high');
  
  if (high.length >= 2) {
    return `${high[0].phrase}. ${high[1].phrase}. ${achievements.phrases.foundationStatement}`;
  }
  
  if (high.length === 1) {
    return `${high[0].phrase}. ${achievements.phrases.foundationStatement}`;
  }
  
  return achievements.phrases.foundationStatement;
}
