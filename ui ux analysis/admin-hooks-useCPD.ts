// ============================================================================
// CPD TRACKING HOOKS
// ============================================================================
// React hooks for managing CPD records
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentMember } from './useCurrentMember';
import { useAuth } from './useAuth';

export interface CPDRecord {
  id: string;
  practice_id: string;
  member_id: string;
  activity_type: 'course' | 'webinar' | 'reading' | 'conference' | 'mentoring' | 'other';
  title: string;
  provider: string | null;
  description: string | null;
  hours: number;
  date_completed: string;
  category: 'technical' | 'ethics' | 'business' | 'leadership' | 'industry';
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  certificate_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CPDTarget {
  id: string;
  practice_id: string;
  member_id: string;
  year: number;
  target_hours: number;
  technical_hours: number | null;
  ethics_hours: number | null;
  business_hours: number | null;
  leadership_hours: number | null;
  industry_hours: number | null;
}

export interface CPDSummary {
  member_id: string;
  member_name: string;
  total_hours: number;
  target_hours: number;
  progress_pct: number;
  activities_count: number;
  hours_by_category: Record<string, number>;
}

export function useCPDRecords(year?: number) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const selectedYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['cpd-records', currentMember?.practice_id, selectedYear],
    queryFn: async () => {
      if (!currentMember?.practice_id) return [];
      
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data, error } = await supabase
        .from('cpd_records')
        .select(`
          *,
          member:practice_members!member_id(name, email)
        `)
        .eq('practice_id', currentMember.practice_id)
        .gte('date_completed', startDate)
        .lte('date_completed', endDate)
        .order('date_completed', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentMember?.practice_id,
  });
}

export function useCPDSummary(year?: number) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const selectedYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['cpd-summary', currentMember?.practice_id, selectedYear],
    queryFn: async () => {
      if (!currentMember?.practice_id) return [];
      
      // Get all team members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('id, name')
        .eq('practice_id', currentMember.practice_id)
        .eq('member_type', 'team');
      
      if (membersError) throw membersError;
      
      // Get CPD records for the year
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data: records, error: recordsError } = await supabase
        .from('cpd_records')
        .select('member_id, hours, category')
        .eq('practice_id', currentMember.practice_id)
        .gte('date_completed', startDate)
        .lte('date_completed', endDate);
      
      if (recordsError) throw recordsError;
      
      // Get targets
      const { data: targets } = await supabase
        .from('cpd_targets')
        .select('member_id, target_hours')
        .eq('practice_id', currentMember.practice_id)
        .eq('year', selectedYear);
      
      // Build summaries
      const summaries: CPDSummary[] = members?.map((member) => {
        const memberRecords = records?.filter(r => r.member_id === member.id) || [];
        const memberTarget = targets?.find(t => t.member_id === member.id);
        const targetHours = memberTarget?.target_hours || 40;
        
        const totalHours = memberRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
        const hoursByCategory: Record<string, number> = {};
        
        memberRecords.forEach(r => {
          hoursByCategory[r.category] = (hoursByCategory[r.category] || 0) + r.hours;
        });
        
        return {
          member_id: member.id,
          member_name: member.name,
          total_hours: totalHours,
          target_hours: targetHours,
          progress_pct: Math.round((totalHours / targetHours) * 100),
          activities_count: memberRecords.length,
          hours_by_category: hoursByCategory,
        };
      }) || [];
      
      return summaries;
    },
    enabled: !!currentMember?.practice_id,
  });
}

export function useCreateCPDRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  return useMutation({
    mutationFn: async (record: Omit<CPDRecord, 'id' | 'practice_id' | 'created_at' | 'verified' | 'verified_by' | 'verified_at'>) => {
      if (!currentMember?.practice_id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cpd_records')
        .insert({
          ...record,
          practice_id: currentMember.practice_id,
          verified: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
      queryClient.invalidateQueries({ queryKey: ['cpd-summary'] });
    },
  });
}

export function useVerifyCPDRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!currentMember?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cpd_records')
        .update({
          verified: true,
          verified_by: currentMember.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', recordId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
    },
  });
}

export function useDeleteCPDRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cpd_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpd-records'] });
      queryClient.invalidateQueries({ queryKey: ['cpd-summary'] });
    },
  });
}

