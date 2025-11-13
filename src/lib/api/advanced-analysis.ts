/**
 * API Layer for Advanced AI Analysis
 * Provides access to Phase 2 LLM features
 */

import type { SupabaseClient } from '@supabase/supabase-js';
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
export async function generateAllTeamAnalyses(supabase: SupabaseClient, practiceId: string) {
  const [gapAnalysis, teamComposition, serviceDeployment] = await Promise.all([
    generateGapAnalysisInsights(supabase, practiceId),
    generateTeamCompositionAnalysis(supabase, practiceId),
    generateServiceLineDeployment(supabase, practiceId)
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
export async function generateAllMemberAnalyses(supabase: SupabaseClient, memberId: string, practiceId: string) {
  const [trainingNarrative, assessmentSynthesis] = await Promise.all([
    generateTrainingNarrative(supabase, memberId, practiceId),
    generateAssessmentSynthesis(supabase, memberId, practiceId)
  ]);
  
  return {
    trainingNarrative,
    assessmentSynthesis
  };
}
