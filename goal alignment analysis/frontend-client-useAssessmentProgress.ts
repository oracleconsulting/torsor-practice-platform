import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AssessmentProgress, AssessmentStatus } from '@torsor/shared';

interface AssessmentData {
  assessment_type: string;
  status: AssessmentStatus;
  completion_percentage: number;
  completed_at: string | null;
}

export function useAssessmentProgress() {
  const { clientSession } = useAuth();

  const query = useQuery({
    queryKey: ['assessment-progress', clientSession?.clientId],
    queryFn: async (): Promise<AssessmentProgress | null> => {
      if (!clientSession?.clientId) return null;

      const { data, error } = await supabase
        .from('client_assessments')
        .select('assessment_type, status, completion_percentage, completed_at')
        .eq('client_id', clientSession.clientId);

      if (error) throw error;

      const assessments = (data || []) as AssessmentData[];

      const getStatus = (type: string) => {
        const a = assessments.find(a => a.assessment_type === type);
        return {
          status: (a?.status || 'not_started') as AssessmentStatus,
          percentage: a?.completion_percentage || 0,
        };
      };

      const part1 = getStatus('part1');
      const part2 = getStatus('part2');
      const part3 = getStatus('part3');

      // Calculate overall progress
      const parts = [part1, part2, part3];
      const overallPercentage = Math.round(
        parts.reduce((sum, p) => sum + p.percentage, 0) / 3
      );

      // Check if roadmap exists
      const { data: roadmapData } = await supabase
        .from('client_roadmaps')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .eq('is_active', true)
        .single();

      // Get current week based on enrollment date
      let currentWeek = 1;
      if (clientSession.enrolledAt) {
        const start = new Date(clientSession.enrolledAt);
        const now = new Date();
        const diffWeeks = Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        currentWeek = Math.min(Math.max(diffWeeks + 1, 1), 13);
      }

      return {
        part1,
        part2,
        part3,
        overall: overallPercentage,
        hasRoadmap: !!roadmapData,
        currentWeek,
      };
    },
    enabled: !!clientSession?.clientId,
  });

  return {
    progress: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

