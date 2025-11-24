import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Skill } from '../lib/types';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category, required_level, is_active')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Skill[];
    },
  });
}

