import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  calculatePersonalityPerformance,
  calculateLearningEffectiveness,
  calculateEQConflictSynergy,
  calculateBelbinMotivationAlignment,
  calculateRetentionRisk,
  calculateBurnoutRisk,
  calculatePromotionReadiness
} from '../lib/analytics-engine';
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

export interface TeamMemberAnalytics {
  member: PracticeMember;
  personalityPerformance?: ReturnType<typeof calculatePersonalityPerformance>;
  learningEffectiveness?: ReturnType<typeof calculateLearningEffectiveness>;
  eqConflictSynergy?: ReturnType<typeof calculateEQConflictSynergy>;
  belbinMotivation?: ReturnType<typeof calculateBelbinMotivationAlignment>;
  retentionRisk?: ReturnType<typeof calculateRetentionRisk>;
  burnoutRisk?: ReturnType<typeof calculateBurnoutRisk>;
  promotionReadiness?: ReturnType<typeof calculatePromotionReadiness>;
}

export function useTeamAnalytics(practiceId: string | null) {
  return useQuery({
    queryKey: ['team-analytics', practiceId],
    queryFn: async (): Promise<TeamMemberAnalytics[]> => {
      if (!practiceId) return [];

      // Fetch all members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', practiceId);

      if (membersError) throw membersError;
      if (!members) return [];

      // Fetch all assessment types in parallel
      const memberIds = members.map(m => m.id);

      const [
        varks,
        personalities,
        belbins,
        eqs,
        motivations,
        conflicts,
        workingPrefs,
        skills
      ] = await Promise.all([
        supabase.from('learning_preferences').select('*').in('member_id', memberIds),
        supabase.from('personality_assessments').select('*').in('member_id', memberIds),
        supabase.from('belbin_assessments').select('*').in('member_id', memberIds),
        supabase.from('eq_assessments').select('*').in('member_id', memberIds),
        supabase.from('motivational_drivers').select('*').in('member_id', memberIds),
        supabase.from('conflict_style_assessments').select('*').in('member_id', memberIds),
        supabase.from('working_preferences').select('*').in('member_id', memberIds),
        supabase.from('skill_assessments').select('*').in('member_id', memberIds)
      ]);

      // Build analytics for each member
      return members.map(member => {
        const vark = varks.data?.find(v => v.member_id === member.id);
        const personality = personalities.data?.find(p => p.member_id === member.id);
        const belbin = belbins.data?.find(b => b.member_id === member.id);
        const eq = eqs.data?.find(e => e.member_id === member.id);
        const motivation = motivations.data?.find(m => m.member_id === member.id);
        const conflict = conflicts.data?.find(c => c.member_id === member.id);
        const workingPref = workingPrefs.data?.find(w => w.member_id === member.id);
        const memberSkills = skills.data?.filter(s => s.member_id === member.id) || [];

        const analytics: TeamMemberAnalytics = { member };

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

        // Calculate predictive analytics
        if (motivation && personality && memberSkills.length > 0 && workingPref) {
          analytics.retentionRisk = calculateRetentionRisk(
            member,
            motivation as MotivationalDriver,
            // personality removed from function signature
            memberSkills as SkillAssessment[],
            workingPref as WorkingPreferences
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

