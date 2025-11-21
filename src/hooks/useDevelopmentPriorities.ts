/**
 * Custom hook for development priorities and gap analysis
 * Handles skill gaps, role gaps, and recommendations
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { TeamMember } from '@/types/team-insights';

interface DevelopmentPriorities {
  skillGaps: { area: string; severity: 'high' | 'medium' | 'low'; affectedMembers: number }[];
  roleGaps: { role: string; current: number; ideal: number }[];
  teamHealthScore: number;
  recommendations: string[];
}

interface UseDevelopmentPrioritiesReturn {
  priorities: DevelopmentPriorities | null;
  loading: boolean;
}

export const useDevelopmentPriorities = (teamMembers: TeamMember[]): UseDevelopmentPrioritiesReturn => {
  const [priorities, setPriorities] = useState<DevelopmentPriorities | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateBelbinRoleGaps = async (members: TeamMember[]) => {
    const { data: belbinData } = await supabase
      .from('belbin_assessments')
      .select('primary_role, secondary_role')
      .in('practice_member_id', members.map(m => m.id));

    if (!belbinData || belbinData.length === 0) return [];

    const roleCounts: Record<string, number> = {};
    belbinData.forEach(assessment => {
      if (assessment.primary_role) {
        roleCounts[assessment.primary_role] = (roleCounts[assessment.primary_role] || 0) + 1;
      }
      if (assessment.secondary_role) {
        roleCounts[assessment.secondary_role] = (roleCounts[assessment.secondary_role] || 0) + 0.5;
      }
    });

    const teamSize = members.length;
    const idealRoles: Record<string, number> = {
      'Shaper': Math.max(1, Math.round(teamSize * 0.1)),
      'Implementer': Math.max(2, Math.round(teamSize * 0.15)),
      'Completer Finisher': Math.max(1, Math.round(teamSize * 0.1)),
      'Coordinator': Math.max(1, Math.round(teamSize * 0.12)),
      'Teamworker': Math.max(2, Math.round(teamSize * 0.15)),
      'Resource Investigator': Math.max(1, Math.round(teamSize * 0.12)),
      'Plant': Math.max(1, Math.round(teamSize * 0.1)),
      'Monitor Evaluator': Math.max(1, Math.round(teamSize * 0.08)),
      'Specialist': Math.max(1, Math.round(teamSize * 0.08))
    };

    const gaps = Object.entries(idealRoles).map(([role, ideal]) => {
      const current = Math.round(roleCounts[role] || 0);
      return {
        role,
        current,
        ideal,
        gap: ideal - current,
        priority: ideal - current > 1 ? 'high' : ideal - current > 0 ? 'medium' : 'none'
      };
    });

    return gaps
      .filter(g => g.gap > 0 || g.current > 0)
      .sort((a, b) => b.gap - a.gap);
  };

  const identifyPriorities = async () => {
    if (teamMembers.length === 0) return;

    setLoading(true);
    try {
      // Analyze skill gaps (simplified)
      const skillGaps = [
        { area: 'Advanced Financial Analysis', severity: 'high' as const, affectedMembers: 5 },
        { area: 'Client Communication', severity: 'medium' as const, affectedMembers: 3 },
        { area: 'Project Management', severity: 'medium' as const, affectedMembers: 4 }
      ];

      // Calculate real Belbin role gaps
      const roleGaps = await calculateBelbinRoleGaps(teamMembers);

      const recommendations = [
        'Schedule team workshops focused on advanced financial modeling',
        'Pair high-EQ members with those developing emotional intelligence',
        'Create cross-functional project teams to balance different working styles',
        'Implement peer mentoring for conflict resolution skills',
        'Consider hiring or developing Leader role for better team orchestration'
      ];

      const healthScore = 78;

      setPriorities({
        skillGaps,
        roleGaps,
        teamHealthScore: healthScore,
        recommendations
      });
    } catch (error) {
      console.error('[useDevelopmentPriorities] Error identifying priorities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    identifyPriorities();
  }, [teamMembers]);

  return { priorities, loading };
};

