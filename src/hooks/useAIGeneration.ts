/**
 * Custom hook for AI-powered analysis generation
 * Handles team composition and gap analysis generation
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  generateGapAnalysisInsights,
  generateTeamCompositionAnalysis
} from '@/lib/api/advanced-analysis';
import { useToast } from '@/components/ui/use-toast';

interface UseAIGenerationReturn {
  compositionAnalysis: string | null;
  gapAnalysis: string | null;
  generatingComposition: boolean;
  generatingGap: boolean;
  generateCompositionAnalysis: () => Promise<void>;
  generateGapAnalysis: () => Promise<void>;
}

const PRACTICE_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc';

export const useAIGeneration = (): UseAIGenerationReturn => {
  const [compositionAnalysis, setCompositionAnalysis] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
  const [generatingComposition, setGeneratingComposition] = useState(false);
  const [generatingGap, setGeneratingGap] = useState(false);
  const { toast } = useToast();

  const generateCompositionAnalysis = async () => {
    setGeneratingComposition(true);
    try {
      const result = await generateTeamCompositionAnalysis(supabase, PRACTICE_ID);
      setCompositionAnalysis(result.analysis);
      toast({
        title: 'Team Analysis Complete!',
        description: 'AI-powered team dynamics insights have been generated.',
      });
    } catch (error: any) {
      console.error('[useAIGeneration] Error generating composition analysis:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingComposition(false);
    }
  };

  const generateGapAnalysis = async () => {
    setGeneratingGap(true);
    try {
      const result = await generateGapAnalysisInsights(supabase, PRACTICE_ID);
      setGapAnalysis(result.insights);
      toast({
        title: 'Gap Analysis Complete!',
        description: 'AI-powered strategic insights have been generated.',
      });
    } catch (error: any) {
      console.error('[useAIGeneration] Error generating gap analysis:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingGap(false);
    }
  };

  return {
    compositionAnalysis,
    gapAnalysis,
    generatingComposition,
    generatingGap,
    generateCompositionAnalysis,
    generateGapAnalysis
  };
};

