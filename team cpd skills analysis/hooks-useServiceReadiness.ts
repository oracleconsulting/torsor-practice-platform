import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ADVISORY_SERVICES } from '../lib/advisory-services';
import { calculateServiceReadiness } from '../lib/service-calculations';
import type { Skill, PracticeMember, SkillAssessment } from '../lib/types';

export function useServiceReadiness(practiceId: string | null) {
  return useQuery({
    queryKey: ['service-readiness', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];

      // Fetch all data in parallel including service line interests
      const [membersRes, skillsRes, assessmentsRes, interestsRes] = await Promise.all([
        supabase
          .from('practice_members')
          .select('id, name, email, role')
          .eq('practice_id', practiceId),
        supabase
          .from('skills')
          .select('id, name, category, required_level')
          .eq('is_active', true),
        supabase
          .from('skill_assessments')
          .select('id, member_id, skill_id, current_level'),
        supabase
          .from('service_line_interests')
          .select('practice_member_id, service_line, interest_rank, current_experience_level, desired_involvement_pct')
      ]);

      if (membersRes.error) throw membersRes.error;
      if (skillsRes.error) throw skillsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;

      const members = membersRes.data as PracticeMember[];
      const skills = skillsRes.data as Skill[];
      
      // Filter assessments to only this practice's members
      const memberIds = members.map(m => m.id);
      const assessments = (assessmentsRes.data as SkillAssessment[]).filter(a =>
        memberIds.includes(a.member_id)
      );

      // Build service line interests map
      const serviceInterests = new Map();
      interestsRes.data?.forEach((interest: any) => {
        const key = `${interest.practice_member_id}-${interest.service_line}`;
        serviceInterests.set(key, {
          rank: interest.interest_rank,
          experience: interest.current_experience_level,
          involvement: interest.desired_involvement_pct
        });
      });

      // Calculate readiness for each service with interest data
      const readiness = ADVISORY_SERVICES.map(service =>
        calculateServiceReadiness(service, members, assessments, skills, serviceInterests)
      );

      // Sort by readiness percentage (highest first)
      return readiness.sort((a, b) => b.readinessPercent - a.readinessPercent);
    },
    enabled: !!practiceId,
  });
}

