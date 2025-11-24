import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SkillAssessment } from '../lib/types';

export function useSkillAssessments(memberIds: string[]) {
  return useQuery({
    queryKey: ['skill-assessments', memberIds, 'v2'], // Cache bust
    queryFn: async () => {
      if (memberIds.length === 0) return [];
      
      console.log('🔍 Fetching skill assessments with limit(10000)...');
      
      // Fetch ALL assessments - Supabase has a default limit of 1000
      const { data, error } = await supabase
        .from('skill_assessments')
        .select('id, member_id, skill_id, current_level, interest_level, assessed_at')
        .in('member_id', memberIds)
        .limit(10000); // Set high limit to get all assessments
      
      if (error) throw error;
      
      console.log(`✅ Fetched ${data?.length || 0} skill assessments`);
      
      return data as SkillAssessment[];
    },
    enabled: memberIds.length > 0,
  });
}

