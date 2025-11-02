/**
 * API Layer for Advanced AI Analysis
 * Provides access to Phase 2 LLM features
 */

import {
  generateGapAnalysisInsights,
  generateTeamCompositionAnalysis,
  generateServiceLineDeployment,
  generateTrainingNarrative,
  generateAssessmentSynthesis
} from '@/services/ai/advancedAnalysis';

export {
  generateGapAnalysisInsights,
  generateTeamCompositionAnalysis,
  generateServiceLineDeployment,
  generateTrainingNarrative,
  generateAssessmentSynthesis
};

/**
 * Convenience function: Generate all team-level analyses
 */
export async function generateAllTeamAnalyses(practiceId: string) {
  const [gapAnalysis, teamComposition, serviceDeployment] = await Promise.all([
    generateGapAnalysisInsights(practiceId),
    generateTeamCompositionAnalysis(practiceId),
    generateServiceLineDeployment(practiceId)
  ]);
  
  return {
    gapAnalysis,
    teamComposition,
    serviceDeployment
  };
}

/**
 * Convenience function: Generate all member-level analyses
 */
export async function generateAllMemberAnalyses(memberId: string, practiceId: string) {
  const [trainingNarrative, assessmentSynthesis] = await Promise.all([
    generateTrainingNarrative(memberId, practiceId),
    generateAssessmentSynthesis(memberId, practiceId)
  ]);
  
  return {
    trainingNarrative,
    assessmentSynthesis
  };
}

