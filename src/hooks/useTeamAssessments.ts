/**
 * Simplified hook for team assessments
 * Uses the unified v_member_assessment_overview view
 * Replaces all the complex data loading logic
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface TeamMemberAssessment {
  member_id: string;
  name: string;
  role: string;
  email: string;
  practice_id: string;
  
  // VARK
  vark_style: string | null;
  vark_complete: boolean;
  vark_completed_at: string | null;
  
  // OCEAN
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
  ocean_complete: boolean;
  ocean_completed_at: string | null;
  
  // Belbin
  belbin_primary: string | null;
  belbin_secondary: string | null;
  belbin_complete: boolean;
  belbin_completed_at: string | null;
  
  // EQ
  overall_eq: number | null;
  eq_level: string | null;
  eq_complete: boolean;
  eq_completed_at: string | null;
  
  // Motivational
  primary_driver: string | null;
  motivational_complete: boolean;
  motivational_completed_at: string | null;
  
  // Conflict
  conflict_style: string | null;
  conflict_complete: boolean;
  conflict_completed_at: string | null;
  
  // Working Preferences
  communication_style: string | null;
  work_style: string | null;
  work_environment: string | null;
  working_prefs_complete: boolean;
  working_prefs_completed_at: string | null;
  
  // Completion
  assessments_completed: number;
  completion_percentage: number;
}

interface UseTeamAssessmentsReturn {
  members: TeamMemberAssessment[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useTeamAssessments = (): UseTeamAssessmentsReturn => {
  const [members, setMembers] = useState<TeamMemberAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('v_member_assessment_overview')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err) {
      console.error('[useTeamAssessments] Error loading assessments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  return {
    members,
    loading,
    error,
    refresh: loadAssessments
  };
};

