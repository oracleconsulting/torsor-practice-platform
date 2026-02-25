import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  calculatePersonalityPerformance,
  calculateLearningEffectiveness,
  calculateEQConflictSynergy,
  calculateBelbinMotivationAlignment,
  calculateRetentionRisk,
  calculateBurnoutRisk,
  calculatePromotionReadiness,
  calculateSkillProfile,
  calculateServiceCapability,
  calculateDevelopmentPriorities,
  type SkillProfile,
  type ServiceCapability,
  type DevelopmentPriority
} from '../lib/analytics-engine';
import { ADVISORY_SERVICES } from '../lib/advisory-services';
import type {
  PracticeMember,
  VarkAssessment,
  PersonalityAssessment,
  BelbinAssessment,
  EQAssessment,
  MotivationalDriver,
  ConflictStyleAssessment,
  WorkingPreferences,
  SkillAssessment
} from '../lib/types';

export type { SkillProfile, ServiceCapability, DevelopmentPriority };

export interface TeamMemberAnalytics {
  member: PracticeMember;
  personalityPerformance?: ReturnType<typeof calculatePersonalityPerformance>;
  learningEffectiveness?: ReturnType<typeof calculateLearningEffectiveness>;
  eqConflictSynergy?: ReturnType<typeof calculateEQConflictSynergy>;
  belbinMotivation?: ReturnType<typeof calculateBelbinMotivationAlignment>;
  retentionRisk?: ReturnType<typeof calculateRetentionRisk>;
  burnoutRisk?: ReturnType<typeof calculateBurnoutRisk>;
  promotionReadiness?: ReturnType<typeof calculatePromotionReadiness>;
  skillProfile?: SkillProfile;
  serviceCapability?: ServiceCapability;
  developmentPriorities?: DevelopmentPriority[];
}

export function useTeamAnalytics(practiceId: string | null) {
  return useQuery({
    queryKey: ['team-analytics', practiceId],
    queryFn: async (): Promise<TeamMemberAnalytics[]> => {
      if (!practiceId) return [];

      // Fetch staff members only (exclude clients)
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', practiceId)
        .neq('member_type', 'client')
        .order('name', { ascending: true });

      if (membersError) throw membersError;
      if (!members) return [];

      const memberIds = members.map(m => m.id);

      const [
        varks,
        personalities,
        belbins,
        eqs,
        motivations,
        conflicts,
        workingPrefs,
        skillAssessments,
        skillDefinitions,
        serviceInterests
      ] = await Promise.all([
        supabase.from('learning_preferences').select('*').in('member_id', memberIds),
        supabase.from('personality_assessments').select('*').in('member_id', memberIds),
        supabase.from('belbin_assessments').select('*').in('member_id', memberIds),
        supabase.from('eq_assessments').select('*').in('member_id', memberIds),
        supabase.from('motivational_drivers').select('*').in('member_id', memberIds),
        supabase.from('conflict_style_assessments').select('*').in('member_id', memberIds),
        supabase.from('working_preferences').select('*').in('member_id', memberIds),
        supabase.from('skill_assessments').select('*').in('member_id', memberIds),
        supabase.from('skills').select('id, name, category, required_level, is_active').eq('is_active', true),
        supabase.from('service_line_interests').select('*').in('practice_member_id', memberIds)
      ]);

      const assessments = (skillAssessments.data || []) as SkillAssessment[];
      const skills = (skillDefinitions.data || []) as Array<{ id: string; name: string; category: string; required_level: number }>;
      const interests = (serviceInterests.data || []) as Array<{ practice_member_id: string; service_line: string; interest_rank: number; desired_involvement_pct?: number }>;

      return members.map(member => {
        const vark = varks.data?.find(v => v.member_id === member.id);
        const personality = personalities.data?.find(p => p.member_id === member.id);
        const belbin = belbins.data?.find(b => b.member_id === member.id);
        const eq = eqs.data?.find(e => e.member_id === member.id);
        const motivation = motivations.data?.find(m => m.member_id === member.id);
        const conflict = conflicts.data?.find(c => c.member_id === member.id);
        const workingPref = workingPrefs.data?.find(w => w.member_id === member.id);
        const memberSkills = assessments.filter(s => s.member_id === member.id);

        const analytics: TeamMemberAnalytics = { member };

        // Skill-based analytics (always compute when we have assessments)
        if (assessments.length > 0 && skills.length > 0) {
          analytics.skillProfile = calculateSkillProfile(member, assessments, skills);
          analytics.serviceCapability = calculateServiceCapability(member, assessments, skills, ADVISORY_SERVICES, interests);
          analytics.developmentPriorities = calculateDevelopmentPriorities(member, assessments, skills, ADVISORY_SERVICES, interests);
        }

        // Calculate correlations if data exists
        if (personality && memberSkills.length > 0) {
          analytics.personalityPerformance = calculatePersonalityPerformance(
            member,
            personality as PersonalityAssessment,
            memberSkills as SkillAssessment[]
          );
        }

        if (vark && memberSkills.length > 0) {
          analytics.learningEffectiveness = calculateLearningEffectiveness(
            member,
            vark as VarkAssessment,
            memberSkills as SkillAssessment[]
          );
        }

        if (eq && conflict) {
          analytics.eqConflictSynergy = calculateEQConflictSynergy(
            member,
            eq as EQAssessment,
            conflict as ConflictStyleAssessment
          );
        }

        if (belbin && motivation) {
          analytics.belbinMotivation = calculateBelbinMotivationAlignment(
            member,
            belbin as BelbinAssessment,
            motivation as MotivationalDriver
          );
        }

        // Calculate predictive analytics (pass skill data for role fit / development)
        if (motivation && personality && memberSkills.length > 0 && workingPref) {
          analytics.retentionRisk = calculateRetentionRisk(
            member,
            motivation as MotivationalDriver,
            memberSkills as SkillAssessment[],
            workingPref as WorkingPreferences,
            analytics.skillProfile
          );
        }

        if (personality && workingPref) {
          analytics.burnoutRisk = calculateBurnoutRisk(
            member,
            personality as PersonalityAssessment,
            workingPref as WorkingPreferences
          );
        }

        if (personality && eq && memberSkills.length > 0) {
          const targetRole = member.role === 'Senior' ? 'Manager' : 
                           member.role === 'Manager' ? 'Director' : 'Senior';
          analytics.promotionReadiness = calculatePromotionReadiness(
            member,
            personality as PersonalityAssessment,
            eq as EQAssessment,
            memberSkills as SkillAssessment[],
            targetRole
          );
        }

        return analytics;
      });
    },
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}

export function useIndividualAnalytics(memberId: string | null) {
  return useQuery({
    queryKey: ['individual-analytics', memberId],
    queryFn: async (): Promise<TeamMemberAnalytics | null> => {
      if (!memberId) return null;

      // Fetch member
      const { data: member, error: memberError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;
      if (!member) return null;

      // Fetch all assessments for this member
      const [
        vark,
        personality,
        belbin,
        eq,
        motivation,
        conflict,
        workingPref,
        skills
      ] = await Promise.all([
        supabase.from('learning_preferences').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('personality_assessments').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('belbin_assessments').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('eq_assessments').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('motivational_drivers').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('conflict_style_assessments').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('working_preferences').select('*').eq('member_id', memberId).maybeSingle(),
        supabase.from('skill_assessments').select('*').eq('member_id', memberId)
      ]);

      const analytics: TeamMemberAnalytics = { member };
      const memberSkills = skills.data || [];

      // Calculate all analytics
      if (personality.data && memberSkills.length > 0) {
        analytics.personalityPerformance = calculatePersonalityPerformance(
          member,
          personality.data as PersonalityAssessment,
          memberSkills as SkillAssessment[]
        );
      }

      if (vark.data && memberSkills.length > 0) {
        analytics.learningEffectiveness = calculateLearningEffectiveness(
          member,
          vark.data as VarkAssessment,
          memberSkills as SkillAssessment[]
        );
      }

      if (eq.data && conflict.data) {
        analytics.eqConflictSynergy = calculateEQConflictSynergy(
          member,
          eq.data as EQAssessment,
          conflict.data as ConflictStyleAssessment
        );
      }

      if (belbin.data && motivation.data) {
        analytics.belbinMotivation = calculateBelbinMotivationAlignment(
          member,
          belbin.data as BelbinAssessment,
          motivation.data as MotivationalDriver
        );
      }

      if (motivation.data && personality.data && memberSkills.length > 0 && workingPref.data) {
        analytics.retentionRisk = calculateRetentionRisk(
          member,
          motivation.data as MotivationalDriver,
          // personality removed from function signature
          memberSkills as SkillAssessment[],
          workingPref.data as WorkingPreferences
        );
      }

      if (personality.data && workingPref.data) {
        analytics.burnoutRisk = calculateBurnoutRisk(
          member,
          personality.data as PersonalityAssessment,
          workingPref.data as WorkingPreferences
        );
      }

      if (personality.data && eq.data && memberSkills.length > 0) {
        const targetRole = member.role === 'Senior' ? 'Manager' : 
                         member.role === 'Manager' ? 'Director' : 'Senior';
        analytics.promotionReadiness = calculatePromotionReadiness(
          member,
          personality.data as PersonalityAssessment,
          eq.data as EQAssessment,
          memberSkills as SkillAssessment[],
          targetRole
        );
      }

      return analytics;
    },
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000
  });
}

