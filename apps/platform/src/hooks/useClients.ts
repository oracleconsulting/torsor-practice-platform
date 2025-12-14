import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  enrolledAt: string | null;
  lastLogin: string | null;
  assignedAdvisor: {
    id: string;
    name: string;
  } | null;
  assessments: {
    part1: 'not_started' | 'in_progress' | 'completed';
    part2: 'not_started' | 'in_progress' | 'completed';
    part3: 'not_started' | 'in_progress' | 'completed';
  };
  hasRoadmap: boolean;
  roadmapGeneratedAt: string | null;
}

export interface ClientDetail extends Client {
  roadmap: {
    id: string;
    data: any;
    valueAnalysis: any;
    createdAt: string;
    status?: string;
  } | null;
  assessmentResponses: {
    part1: any;
    part2: any;
    part3: any;
    followup: any;
  };
  context: ClientContext[];
  tasks: any[];
}

export interface ClientContext {
  id: string;
  contextType: 'transcript' | 'email' | 'note' | 'priority';
  content: string;
  sourceFileUrl?: string;
  addedBy: string;
  addedByName: string;
  priorityLevel: 'normal' | 'high' | 'critical';
  processed: boolean;
  createdAt: string;
}

export function useClients() {
  const { teamMember } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const fetchClients = useCallback(async () => {
    if (!teamMember?.practiceId) return [];

    setLoading(true);
    setError(null);

    try {
      // Get all clients in the practice
      const { data: clientsData, error: clientsError } = await supabase
        .from('practice_members')
        .select(`
          id,
          user_id,
          name,
          email,
          client_company,
          program_status,
          program_enrolled_at,
          last_portal_login,
          assigned_advisor_id
        `)
        .eq('practice_id', teamMember.practiceId)
        .eq('member_type', 'client')
        .order('name');

      if (clientsError) throw clientsError;

      // Get assessments for all clients
      const clientIds = clientsData?.map(c => c.id) || [];
      
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('client_id, assessment_type, status')
        .in('client_id', clientIds);

      // Get roadmaps for all clients
      const { data: roadmaps } = await supabase
        .from('client_roadmaps')
        .select('client_id, created_at, status')
        .in('client_id', clientIds)
        .eq('is_active', true);

      // Get advisor names
      const advisorIds = [...new Set(clientsData?.map(c => c.assigned_advisor_id).filter(Boolean))];
      const { data: advisors } = await supabase
        .from('practice_members')
        .select('id, name')
        .in('id', advisorIds);

      // Map clients with their data
      const enrichedClients: Client[] = (clientsData || []).map(client => {
        const clientAssessments = assessments?.filter(a => a.client_id === client.id) || [];
        const clientRoadmap = roadmaps?.find(r => r.client_id === client.id);
        const advisor = advisors?.find(a => a.id === client.assigned_advisor_id);

        const getStatus = (type: string) => {
          const assessment = clientAssessments.find(a => a.assessment_type === type);
          return (assessment?.status || 'not_started') as 'not_started' | 'in_progress' | 'completed';
        };

        return {
          id: client.id,
          userId: client.user_id,
          name: client.name,
          email: client.email,
          company: client.client_company,
          status: client.program_status || 'active',
          enrolledAt: client.program_enrolled_at,
          lastLogin: client.last_portal_login,
          assignedAdvisor: advisor ? { id: advisor.id, name: advisor.name } : null,
          assessments: {
            part1: getStatus('part1'),
            part2: getStatus('part2'),
            part3: getStatus('part3')
          },
          hasRoadmap: !!clientRoadmap,
          roadmapGeneratedAt: clientRoadmap?.created_at || null
        };
      });

      setClients(enrichedClients);
      return enrichedClients;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [teamMember]);

  return { fetchClients, clients, loading, error };
}

export function useClientDetail(clientId: string | null) {
  const { teamMember } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientDetail | null>(null);

  const fetchClient = useCallback(async () => {
    if (!teamMember?.practiceId || !clientId) return null;

    setLoading(true);
    setError(null);

    try {
      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from('practice_members')
        .select(`
          id,
          user_id,
          name,
          email,
          client_company,
          program_status,
          program_enrolled_at,
          last_portal_login,
          assigned_advisor_id
        `)
        .eq('id', clientId)
        .eq('practice_id', teamMember.practiceId)
        .single();

      if (clientError) throw clientError;

      // Get assessments
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, status, responses, fit_profile')
        .eq('client_id', clientId);

      // Get roadmap
      const { data: roadmap } = await supabase
        .from('client_roadmaps')
        .select('id, roadmap_data, value_analysis, created_at, status')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      // Get tasks
      const { data: tasks } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('week_number')
        .order('sort_order');

      // Get context (if table exists)
      let context: ClientContext[] = [];
      try {
        const { data: contextData } = await supabase
          .from('client_context')
          .select(`
            id,
            context_type,
            content,
            source_file_url,
            added_by,
            priority_level,
            processed,
            created_at,
            adder:added_by (name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        context = (contextData || []).map(c => ({
          id: c.id,
          contextType: c.context_type,
          content: c.content,
          sourceFileUrl: c.source_file_url,
          addedBy: c.added_by,
          addedByName: (c.adder as any)?.name || 'Unknown',
          priorityLevel: c.priority_level || 'normal',
          processed: c.processed || false,
          createdAt: c.created_at
        }));
      } catch {
        // Table may not exist yet
      }

      // Get advisor
      let advisor = null;
      if (clientData.assigned_advisor_id) {
        const { data: advisorData } = await supabase
          .from('practice_members')
          .select('id, name')
          .eq('id', clientData.assigned_advisor_id)
          .single();
        advisor = advisorData;
      }

      const getAssessment = (type: string) => 
        assessments?.find(a => a.assessment_type === type);

      const getStatus = (type: string) => 
        (getAssessment(type)?.status || 'not_started') as 'not_started' | 'in_progress' | 'completed';

      const clientDetail: ClientDetail = {
        id: clientData.id,
        userId: clientData.user_id,
        name: clientData.name,
        email: clientData.email,
        company: clientData.client_company,
        status: clientData.program_status || 'active',
        enrolledAt: clientData.program_enrolled_at,
        lastLogin: clientData.last_portal_login,
        assignedAdvisor: advisor ? { id: advisor.id, name: advisor.name } : null,
        assessments: {
          part1: getStatus('part1'),
          part2: getStatus('part2'),
          part3: getStatus('part3')
        },
        hasRoadmap: !!roadmap,
        roadmapGeneratedAt: roadmap?.created_at || null,
        roadmapStatus: roadmap?.status || 'pending_review',
        roadmap: roadmap ? {
          id: roadmap.id,
          data: roadmap.roadmap_data,
          valueAnalysis: roadmap.value_analysis,
          createdAt: roadmap.created_at,
          status: roadmap.status || 'pending_review'
        } : null,
        assessmentResponses: {
          part1: getAssessment('part1')?.responses || null,
          part2: getAssessment('part2')?.responses || null,
          part3: getAssessment('part3')?.responses || null,
          followup: getAssessment('followup')?.responses || null
        },
        context,
        tasks: tasks || []
      };

      setClient(clientDetail);
      return clientDetail;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [teamMember, clientId]);

  const addContext = useCallback(async (
    contextType: 'transcript' | 'email' | 'note' | 'priority',
    content: string,
    priorityLevel: 'normal' | 'high' | 'critical' = 'normal'
  ) => {
    if (!teamMember || !clientId) return false;

    try {
      const { error } = await supabase
        .from('client_context')
        .insert({
          practice_id: teamMember.practiceId,
          client_id: clientId,
          context_type: contextType,
          content,
          added_by: teamMember.id,
          priority_level: priorityLevel,
          processed: false
        });

      if (error) throw error;

      // Refresh client data
      await fetchClient();
      return true;

    } catch (err) {
      console.error('Error adding context:', err);
      return false;
    }
  }, [teamMember, clientId, fetchClient]);

  const regenerateRoadmap = useCallback(async () => {
    if (!teamMember || !clientId) return false;

    try {
      // With the new staged architecture, we queue all stages for regeneration
      // The orchestrator (running via cron) will process them in order
      const stages = [
        'fit_assessment',
        'five_year_vision',
        'six_month_shift',
        'sprint_plan',
        'value_analysis'
      ];

      // First, clear any existing pending items for this client to avoid duplicates
      await supabase
        .from('generation_queue')
        .delete()
        .eq('client_id', clientId)
        .eq('status', 'pending');

      // Queue all stages for regeneration
      const queuePromises = stages.map(stageType => 
        supabase.from('generation_queue').insert({
          practice_id: teamMember.practiceId,
          client_id: clientId,
          stage_type: stageType,
          priority: 10 // High priority for manual regeneration
        })
      );

      const results = await Promise.all(queuePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Errors queueing stages:', errors);
        const errorMessages = errors.map(e => e.error?.message || 'Unknown error').join('; ');
        throw new Error(`Failed to queue ${errors.length} stage(s) for regeneration: ${errorMessages}`);
      }

      // Verify at least some items were queued successfully
      const successCount = results.filter(r => !r.error && r.data).length;
      if (successCount === 0) {
        throw new Error('Failed to queue any stages. Please check database permissions and table structure.');
      }

      console.log(`Successfully queued ${successCount} stages for regeneration`);

      // Note: The orchestrator runs via cron and will pick up these queued items
      // No need to invoke it directly - it will process the queue automatically

      // Refresh client data
      await fetchClient();
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error regenerating roadmap:', err);
      console.error('Error details:', {
        message: errorMessage,
        clientId,
        practiceId: teamMember?.practiceId,
        error: err
      });
      return false;
    }
  }, [teamMember, clientId, fetchClient]);

  return { fetchClient, client, loading, error, addContext, regenerateRoadmap };
}

