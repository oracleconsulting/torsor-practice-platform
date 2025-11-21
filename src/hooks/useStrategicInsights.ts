/**
 * Custom hook for strategic insights calculation
 * Handles role-fit analysis, team composition scoring, and caching
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { roleFitAnalyzer } from '@/lib/api/assessment-insights/role-fit-analyzer';
import { teamCompositionAnalyzer } from '@/lib/api/assessment-insights/team-composition-analyzer';
import type { AssessmentInsight } from '@/lib/api/assessment-insights/role-fit-analyzer';
import type { TeamCompositionInsight } from '@/lib/api/assessment-insights/team-composition-analyzer';
import type { TeamMember } from '@/types/team-insights';

interface UseStrategicInsightsReturn {
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  calculatingStrategic: boolean;
  calculateStrategicInsights: (forceRecalculate?: boolean) => Promise<void>;
}

const PRACTICE_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useStrategicInsights = (teamMembers: TeamMember[]): UseStrategicInsightsReturn => {
  const [individualInsights, setIndividualInsights] = useState<AssessmentInsight[]>([]);
  const [strategicTeamInsight, setStrategicTeamInsight] = useState<TeamCompositionInsight | null>(null);
  const [calculatingStrategic, setCalculatingStrategic] = useState(false);

  const loadCachedInsights = async (): Promise<boolean> => {
    const { data: existingInsights } = await supabase
      .from('team_composition_insights')
      .select('*')
      .eq('practice_id', PRACTICE_ID)
      .is('service_line_id', null)
      .maybeSingle();

    if (!existingInsights?.calculated_at) return false;

    const cacheAge = Date.now() - new Date(existingInsights.calculated_at).getTime();
    if (cacheAge >= CACHE_DURATION_MS) return false;

    console.log('[useStrategicInsights] Using cached insights (age:', Math.round(cacheAge / (60 * 1000)), 'minutes)');

    // Convert database format to UI format
    const teamInsight: TeamCompositionInsight = {
      practiceId: existingInsights.practice_id,
      teamName: existingInsights.team_name || 'Practice Team',
      memberCount: existingInsights.team_size,
      belbinBalance: existingInsights.belbin_coverage as any || {},
      motivationalDistribution: existingInsights.motivational_distribution as any || {},
      eqMapping: existingInsights.eq_domain_averages as any || {},
      conflictStyleDiversity: existingInsights.conflict_style_distribution as any || {},
      teamHealthScore: Number(existingInsights.team_health_score) || 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      riskFactors: [],
      lastCalculated: existingInsights.calculated_at
    };

    setStrategicTeamInsight(teamInsight);

    // Load individual insights from cache
    const { data: cachedIndividualInsights } = await supabase
      .from('assessment_insights')
      .select('*')
      .in('member_id', existingInsights.member_ids || []);

    if (cachedIndividualInsights && cachedIndividualInsights.length > 0) {
      const insights: AssessmentInsight[] = cachedIndividualInsights.map((cached: any) => ({
        memberId: cached.member_id,
        memberName: '',
        assignedRoleType: cached.assigned_role_type,
        roleFitScores: {
          advisorySuitability: Number(cached.advisory_suitability_score) || 0,
          technicalSuitability: Number(cached.technical_suitability_score) || 0,
          hybridSuitability: Number(cached.hybrid_suitability_score) || 0,
          leadershipReadiness: Number(cached.leadership_readiness_score) || 0,
          overallRoleFit: Number(cached.overall_role_fit_score) || 0
        },
        belbinPrimary: cached.belbin_primary || [],
        belbinSecondary: cached.belbin_secondary || [],
        motivationalDrivers: cached.motivational_drivers || {},
        eqScores: cached.eq_scores || {},
        conflictStylePrimary: cached.conflict_style_primary || '',
        communicationPreference: cached.communication_preference || '',
        redFlags: cached.red_flags || [],
        warningFlags: cached.warning_flags || [],
        developmentPriorities: cached.development_priorities || [],
        trainingLevel: cached.training_level,
        currentRoleMatch: Number(cached.current_role_match_percentage) || 0,
        recommendedRoleType: cached.recommended_role_type || 'unassigned',
        successionReadiness: Number(cached.succession_readiness_score) || 0
      }));

      setIndividualInsights(insights);
    }

    return true;
  };

  const fetchMemberAssessmentData = async (member: TeamMember) => {
    const [eqData, belbinData, motivData, conflictData, workingPrefsData, skillsData] = await Promise.all([
      supabase.from('eq_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
      supabase.from('belbin_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
      supabase.from('motivational_drivers').select('*').eq('practice_member_id', member.id).maybeSingle(),
      supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
      supabase.from('working_preferences').select('*').eq('practice_member_id', member.id).maybeSingle(),
      supabase.from('skill_assessments').select('*, skills(name)').eq('practice_member_id', member.id)
    ]);

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      eq_scores: eqData.data ? {
        self_awareness: eqData.data.self_awareness_score ?? null,
        self_management: eqData.data.self_management_score ?? null,
        social_awareness: eqData.data.social_awareness_score ?? null,
        relationship_management: eqData.data.relationship_management_score ?? null
      } : {},
      belbin_primary: belbinData.data?.primary_role ? [belbinData.data.primary_role] : [],
      belbin_secondary: belbinData.data?.secondary_role ? [belbinData.data.secondary_role] : [],
      motivational_drivers: motivData.data ? {
        achievement: motivData.data.achievement_score || 50,
        affiliation: motivData.data.affiliation_score || 50,
        autonomy: motivData.data.autonomy_score || 50,
        influence: motivData.data.influence_score || 50
      } : {},
      conflict_style_primary: conflictData.data?.primary_style || '',
      communication_preference: workingPrefsData.data?.communication_style || '',
      skills: (skillsData.data || []).map((s: any) => ({
        name: s.skills?.name || '',
        current_level: s.self_rating || 0
      }))
    };
  };

  const calculateIndividualInsights = async (members: TeamMember[]): Promise<AssessmentInsight[]> => {
    const memberInsights: AssessmentInsight[] = [];

    for (const member of members) {
      const memberData = await fetchMemberAssessmentData(member);

      // Calculate role-fit scores
      const advisorySuitability = roleFitAnalyzer.calculateAdvisorySuitability(memberData);
      const technicalSuitability = roleFitAnalyzer.calculateTechnicalSuitability(memberData);
      const hybridSuitability = roleFitAnalyzer.calculateHybridSuitability(advisorySuitability, technicalSuitability);
      const leadershipReadiness = roleFitAnalyzer.calculateLeadershipReadiness(memberData);

      // Determine recommended role
      let recommendedRole = 'unassigned';
      if (hybridSuitability >= 70) recommendedRole = 'hybrid';
      else if (advisorySuitability > technicalSuitability && advisorySuitability >= 60) recommendedRole = 'advisory';
      else if (technicalSuitability >= 60) recommendedRole = 'technical';

      // Determine assigned role type
      let assignedRoleType: any = 'unassigned';
      if (member.role && ['Partner', 'Director', 'Manager'].includes(member.role)) {
        assignedRoleType = 'leadership';
      }

      const roleFitScores = {
        advisorySuitability,
        technicalSuitability,
        hybridSuitability,
        leadershipReadiness,
        overallRoleFit: Math.round((advisorySuitability + technicalSuitability + leadershipReadiness) / 3)
      };

      // Detect red flags
      const redFlags = roleFitAnalyzer.detectRedFlags(memberData, assignedRoleType);

      // Generate development priorities
      const developmentPriorities = roleFitAnalyzer.generateDevelopmentPriorities(
        memberData,
        roleFitScores,
        redFlags
      );

      // Calculate current role match
      let currentRoleMatch = 50;
      if (assignedRoleType === 'advisory') currentRoleMatch = advisorySuitability;
      else if (assignedRoleType === 'technical') currentRoleMatch = technicalSuitability;
      else if (assignedRoleType === 'leadership') currentRoleMatch = leadershipReadiness;

      // Determine training level
      let trainingLevel: 'critical' | 'enhancement' | 'excellence' | 'none' = 'none';
      if (redFlags.filter(f => f.severity === 'critical' || f.severity === 'high').length > 0) {
        trainingLevel = 'critical';
      } else if (currentRoleMatch < 70) {
        trainingLevel = 'enhancement';
      } else if (currentRoleMatch >= 85) {
        trainingLevel = 'excellence';
      }

      memberInsights.push({
        memberId: member.id,
        memberName: member.name,
        assignedRoleType,
        roleFitScores,
        belbinPrimary: memberData.belbin_primary,
        belbinSecondary: memberData.belbin_secondary,
        motivationalDrivers: memberData.motivational_drivers,
        eqScores: memberData.eq_scores,
        conflictStylePrimary: memberData.conflict_style_primary,
        communicationPreference: memberData.communication_preference,
        redFlags: redFlags.filter(f => f.severity === 'critical' || f.severity === 'high'),
        warningFlags: redFlags.filter(f => f.severity === 'medium' || f.severity === 'low'),
        developmentPriorities,
        trainingLevel,
        currentRoleMatch,
        recommendedRoleType: recommendedRole,
        successionReadiness: leadershipReadiness
      });
    }

    return memberInsights;
  };

  const calculateTeamInsights = async (members: TeamMember[]): Promise<TeamCompositionInsight> => {
    const memberDataForTeam = await Promise.all(members.map(async (member) => {
      const [eqData, belbinData, motivData, conflictData] = await Promise.all([
        supabase.from('eq_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('belbin_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('motivational_drivers').select('*').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', member.id).maybeSingle()
      ]);

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        eq_scores: eqData.data ? {
          self_awareness: eqData.data.self_awareness_score ?? null,
          self_management: eqData.data.self_management_score ?? null,
          social_awareness: eqData.data.social_awareness_score ?? null,
          relationship_management: eqData.data.relationship_management_score ?? null
        } : {},
        belbin_primary: belbinData.data?.primary_role ? [belbinData.data.primary_role] : [],
        belbin_secondary: belbinData.data?.secondary_role ? [belbinData.data.secondary_role] : [],
        motivational_drivers: motivData.data ? {
          achievement: motivData.data.achievement_score || 50,
          affiliation: motivData.data.affiliation_score || 50,
          autonomy: motivData.data.autonomy_score || 50,
          influence: motivData.data.influence_score || 50
        } : {},
        conflict_style_primary: conflictData.data?.primary_style || ''
      };
    }));

    // Analyze team composition
    const belbinBalance = teamCompositionAnalyzer.analyzeBelbinBalance(memberDataForTeam);
    const motivationalDistribution = teamCompositionAnalyzer.analyzeMotivationalDistribution(memberDataForTeam);
    const eqMapping = teamCompositionAnalyzer.analyzeTeamEQ(memberDataForTeam);
    const conflictDiversity = teamCompositionAnalyzer.analyzeConflictStyleDiversity(memberDataForTeam);

    const teamHealthScore = teamCompositionAnalyzer.calculateTeamHealthScore(
      belbinBalance,
      motivationalDistribution,
      eqMapping,
      conflictDiversity
    );

    return {
      practiceId: members[0]?.practice_id || PRACTICE_ID,
      teamName: 'Practice Team',
      memberCount: members.length,
      belbinBalance,
      motivationalDistribution,
      eqMapping,
      conflictStyleDiversity: conflictDiversity,
      teamHealthScore,
      strengths: teamCompositionAnalyzer.identifyStrengths({ 
        belbinBalance, eqMapping, conflictStyleDiversity: conflictDiversity, 
        motivationalDistribution, teamHealthScore 
      }),
      weaknesses: teamCompositionAnalyzer.identifyWeaknesses({ 
        belbinBalance, eqMapping, motivationalDistribution, 
        conflictStyleDiversity: conflictDiversity 
      }),
      recommendations: teamCompositionAnalyzer.generateRecommendations({ 
        belbinBalance, eqMapping, motivationalDistribution, 
        conflictStyleDiversity: conflictDiversity, teamHealthScore 
      }),
      riskFactors: [],
      lastCalculated: new Date().toISOString()
    };
  };

  const cacheInsights = async (
    members: TeamMember[],
    memberInsights: AssessmentInsight[],
    teamInsight: TeamCompositionInsight
  ) => {
    try {
      // Save team composition insights
      await supabase.from('team_composition_insights').upsert({
        practice_id: PRACTICE_ID,
        service_line_id: null,
        team_name: 'Practice Team',
        member_ids: members.map(m => m.id),
        team_size: members.length,
        belbin_coverage: teamInsight.belbinBalance,
        motivational_distribution: teamInsight.motivationalDistribution,
        eq_domain_averages: teamInsight.eqMapping,
        conflict_style_distribution: teamInsight.conflictStyleDiversity,
        team_health_score: teamInsight.teamHealthScore,
        team_avg_eq: teamInsight.eqMapping.teamAverage || 0,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'practice_id,service_line_id',
        ignoreDuplicates: false
      });

      // Save individual assessment insights
      for (const insight of memberInsights) {
        await supabase.from('assessment_insights').upsert({
          member_id: insight.memberId,
          assigned_role_type: insight.assignedRoleType,
          advisory_suitability_score: insight.roleFitScores.advisorySuitability,
          technical_suitability_score: insight.roleFitScores.technicalSuitability,
          hybrid_suitability_score: insight.roleFitScores.hybridSuitability,
          leadership_readiness_score: insight.roleFitScores.leadershipReadiness,
          overall_role_fit_score: insight.roleFitScores.overallRoleFit,
          belbin_primary: insight.belbinPrimary,
          belbin_secondary: insight.belbinSecondary,
          motivational_drivers: insight.motivationalDrivers,
          eq_scores: insight.eqScores,
          conflict_style_primary: insight.conflictStylePrimary,
          communication_preference: insight.communicationPreference,
          red_flags: insight.redFlags,
          warning_flags: insight.warningFlags,
          development_priorities: insight.developmentPriorities,
          training_level: insight.trainingLevel,
          current_role_match_percentage: insight.currentRoleMatch,
          recommended_role_type: insight.recommendedRoleType,
          succession_readiness_score: insight.successionReadiness,
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'member_id',
          ignoreDuplicates: false
        });
      }

      console.log(`[useStrategicInsights] Cached insights for ${memberInsights.length} members`);
    } catch (error) {
      console.error('[useStrategicInsights] Error caching insights:', error);
    }
  };

  const calculateStrategicInsights = async (forceRecalculate = false) => {
    console.log('[useStrategicInsights] Calculating strategic insights...');
    setCalculatingStrategic(true);

    try {
      // Try to load cached insights first
      if (!forceRecalculate) {
        const cacheLoaded = await loadCachedInsights();
        if (cacheLoaded) {
          setCalculatingStrategic(false);
          return;
        }
      }

      console.log('[useStrategicInsights] Recalculating insights (cache miss or forced)...');

      // Fetch complete member data
      const { data: members, error } = await supabase
        .from('practice_members')
        .select('id, name, role, email, practice_id')
        .eq('is_active', true)
        .or('is_test_account.is.null,is_test_account.eq.false');

      if (error) throw error;
      if (!members || members.length === 0) {
        console.log('[useStrategicInsights] No active members found');
        return;
      }

      // Calculate individual insights
      const memberInsights = await calculateIndividualInsights(members);
      setIndividualInsights(memberInsights);

      // Calculate team insights
      const teamInsight = await calculateTeamInsights(members);
      setStrategicTeamInsight(teamInsight);

      // Cache the results
      await cacheInsights(members, memberInsights, teamInsight);

    } catch (error) {
      console.error('[useStrategicInsights] Error calculating insights:', error);
    } finally {
      setCalculatingStrategic(false);
    }
  };

  return {
    individualInsights,
    strategicTeamInsight,
    calculatingStrategic,
    calculateStrategicInsights
  };
};

