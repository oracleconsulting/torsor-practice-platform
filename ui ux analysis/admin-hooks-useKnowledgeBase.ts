// ============================================================================
// KNOWLEDGE BASE HOOKS
// ============================================================================
// React hooks for managing knowledge base entries
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentMember } from './useCurrentMember';
import { useAuth } from './useAuth';

export interface KnowledgeEntry {
  id: string;
  practice_id: string;
  category: 'methodology' | 'example' | 'correction' | 'objection' | 'template';
  title: string;
  content: string;
  tags: string[];
  usage_count: number;
  is_approved: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  return useQuery({
    queryKey: ['knowledge-base', currentMember?.practice_id],
    queryFn: async () => {
      if (!currentMember?.practice_id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('practice_id', currentMember.practice_id)
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeEntry[];
    },
    enabled: !!currentMember?.practice_id,
  });
}

export function useKnowledgeEntry(id: string) {
  return useQuery({
    queryKey: ['knowledge-entry', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as KnowledgeEntry;
    },
    enabled: !!id,
  });
}

export function useCreateKnowledgeEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  return useMutation({
    mutationFn: async (entry: Omit<KnowledgeEntry, 'id' | 'practice_id' | 'created_by' | 'created_at' | 'updated_at' | 'usage_count'>) => {
      if (!currentMember?.practice_id || !user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          ...entry,
          practice_id: currentMember.practice_id,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

export function useUpdateKnowledgeEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-entry', variables.id] });
    },
  });
}

export function useDeleteKnowledgeEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });
}

// Hook to log when an entry is used (for analytics)
export function useLogKnowledgeUsage() {
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.rpc('increment_knowledge_usage', { entry_id: id });
    },
  });
}

