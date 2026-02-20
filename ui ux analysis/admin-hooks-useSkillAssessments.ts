import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SkillAssessment } from '../lib/types';

export function useSkillAssessments(memberIds: string[]) {
  return useQuery({
    queryKey: ['skill-assessments', memberIds, 'v3'], // Cache bust
    queryFn: async () => {
      if (memberIds.length === 0) return [];
      
      console.log('🔍 Fetching ALL skill assessments (paginated)...');
      
      // Fetch ALL assessments using pagination to bypass Supabase's max row limit
      let allData: SkillAssessment[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('skill_assessments')
          .select('id, member_id, skill_id, current_level, interest_level, assessed_at')
          .in('member_id', memberIds)
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`📦 Fetched batch: ${data.length} assessments (total so far: ${allData.length})`);
          
          // If we got less than pageSize, we've reached the end
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            from += pageSize;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Total fetched: ${allData.length} skill assessments`);
      
      return allData as SkillAssessment[];
    },
    enabled: memberIds.length > 0,
  });
}

