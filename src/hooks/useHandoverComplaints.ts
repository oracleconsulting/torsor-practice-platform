import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import type { HandoverComplaint, Evidence, HandoverIssue, TimelineEvent } from '../types/accountancy';

interface UseHandoverComplaintsReturn {
  complaints: HandoverComplaint[];
  loading: boolean;
  error: string | null;
  createComplaint: (complaint: Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HandoverComplaint>;
  updateComplaint: (id: string, updates: Partial<HandoverComplaint>) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  addEvidence: (complaintId: string, evidence: Omit<Evidence, 'id' | 'uploadedAt'>) => Promise<Evidence>;
  addIssue: (complaintId: string, issue: Omit<HandoverIssue, 'id'>) => Promise<HandoverIssue>;
  updateIssue: (complaintId: string, issueId: string, updates: Partial<HandoverIssue>) => Promise<void>;
  addTimelineEvent: (complaintId: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>) => Promise<TimelineEvent>;
  getComplaintById: (id: string) => Promise<HandoverComplaint | null>;
}

export function useHandoverComplaints(): UseHandoverComplaintsReturn {
  const [complaints, setComplaints] = useState<HandoverComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();

    // Subscribe to changes
    const subscription = supabase
      .channel('handover_complaints_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'handover_complaints'
      }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('handover_complaints')
        .select(`
          *,
          issues:handover_issues(*),
          evidence:handover_evidence(*),
          timeline:handover_timeline(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const createComplaint = async (complaint: Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('handover_complaints')
      .insert([{
        ...complaint,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateComplaint = async (id: string, updates: Partial<HandoverComplaint>) => {
    const { error } = await supabase
      .from('handover_complaints')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  };

  const deleteComplaint = async (id: string) => {
    const { error } = await supabase
      .from('handover_complaints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const addEvidence = async (complaintId: string, evidence: Omit<Evidence, 'id' | 'uploadedAt'>) => {
    const { data, error } = await supabase
      .from('handover_evidence')
      .insert([{
        ...evidence,
        complaint_id: complaintId,
        uploaded_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const addIssue = async (complaintId: string, issue: Omit<HandoverIssue, 'id'>) => {
    const { data, error } = await supabase
      .from('handover_issues')
      .insert([{
        ...issue,
        complaint_id: complaintId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateIssue = async (complaintId: string, issueId: string, updates: Partial<HandoverIssue>) => {
    const { error } = await supabase
      .from('handover_issues')
      .update(updates)
      .eq('id', issueId)
      .eq('complaint_id', complaintId);

    if (error) throw error;
  };

  const addTimelineEvent = async (complaintId: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('handover_timeline')
      .insert([{
        ...event,
        complaint_id: complaintId,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getComplaintById = async (id: string) => {
    const { data, error } = await supabase
      .from('handover_complaints')
      .select(`
        *,
        issues:handover_issues(*),
        evidence:handover_evidence(*),
        timeline:handover_timeline(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    complaints,
    loading,
    error,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    addEvidence,
    addIssue,
    updateIssue,
    addTimelineEvent,
    getComplaintById
  };
} 