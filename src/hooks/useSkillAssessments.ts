import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SkillAssessment } from '../lib/types';

export function useSkillAssessments(memberIds: string[]) {
  return useQuery({
    queryKey: ['skill-assessments', memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('skill_assessments')
        .select('id, member_id, skill_id, current_level, interest_level, assessed_at')
        .in('member_id', memberIds);
      
      if (error) throw error;
      return data as SkillAssessment[];
    },
    enabled: memberIds.length > 0,
  });
}

