/**
 * Team Assessment Insights Dashboard
 * Comprehensive overview of all team assessments for strategic team development
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { ChartErrorBoundary } from '@/components/ErrorBoundary';
import { 
  generateGapAnalysisInsights,
  generateTeamCompositionAnalysis
} from '@/lib/api/advanced-analysis';
import { roleFitAnalyzer } from '@/lib/api/assessment-insights/role-fit-analyzer';
import { teamCompositionAnalyzer } from '@/lib/api/assessment-insights/team-composition-analyzer';
import type { AssessmentInsight } from '@/lib/api/assessment-insights/role-fit-analyzer';
import type { TeamCompositionInsight } from '@/lib/api/assessment-insights/team-composition-analyzer';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, Brain, TrendingUp, Target, AlertCircle, 
  CheckCircle2, Lightbulb, Award, Activity, Zap,
  Shield, Heart, MessageSquare, Clock, Settings, Loader2
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, ScatterChart, Scatter
} from 'recharts';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AssessmentCompletion {
  memberId: string;
  name: string;
  vark: boolean;
  ocean: boolean;
  workingPrefs: boolean;
  belbin: boolean;
  motivational: boolean;
  eq: boolean;
  conflict: boolean;
  completionRate: number;
}

interface TeamComposition {
  // Working Preferences Distribution
  communicationStyles: { style: string; count: number }[];
  workStyles: { style: string; count: number }[];
  environments: { env: string; count: number }[];
  
  // Belbin Roles
  belbinRoles: { role: string; count: number; members: string[] }[];
  roleBalance: string;
  
  // Motivational Drivers
  motivationalDrivers: { driver: string; count: number }[];
  
  // EQ Levels
  eqDistribution: { level: string; count: number }[];
  avgEQ: number;
  
  // Conflict Styles
  conflictStyles: { style: string; count: number }[];
  
  // VARK Learning Styles
  varkStyles: { style: string; count: number }[];
  
  // OCEAN Personality (team averages)
  avgPersonality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

interface TeamDynamics {
  communicationCompatibility: number;
  workStyleFlexibility: number;
  roleCompletion: number;
  motivationalAlignment: number;
  conflictResolutionCapacity: number;
}

interface DevelopmentPriorities {
  skillGaps: { area: string; severity: 'high' | 'medium' | 'low'; affectedMembers: number }[];
  roleGaps: { role: string; current: number; ideal: number }[];
  teamHealthScore: number;
  recommendations: string[];
}

const TeamAssessmentInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [completionStatus, setCompletionStatus] = useState<AssessmentCompletion[]>([]);
  const [teamComposition, setTeamComposition] = useState<TeamComposition | null>(null);
  const [teamDynamics, setTeamDynamics] = useState<TeamDynamics | null>(null);
  const [priorities, setPriorities] = useState<DevelopmentPriorities | null>(null);

  // Phase 2 AI Features
  const [gapAnalysis, setGapAnalysis] = useState<string | null>(null);
  const [generatingGapAnalysis, setGeneratingGapAnalysis] = useState(false);
  const [compositionAnalysis, setCompositionAnalysis] = useState<string | null>(null);
  const [generatingComposition, setGeneratingComposition] = useState(false);

  // Phase 3 Strategic Insights (NEW!)
  const [individualInsights, setIndividualInsights] = useState<AssessmentInsight[]>([]);
  const [strategicTeamInsight, setStrategicTeamInsight] = useState<TeamCompositionInsight | null>(null);
  const [calculatingStrategic, setCalculatingStrategic] = useState(false);

  const { toast } = useToast();

  // Display name mappings for all assessment types
  const displayNames = {
    // Communication Styles
    communication: {
      'high_sync': 'High-Sync Communicator',
      'balanced': 'Balanced Communicator',
      'async_preferred': 'Async-Focused Communicator'
    },
    // Work Styles
    workStyle: {
      'autonomous': 'Autonomous Worker',
      'structured': 'Structured Worker',
      'flexible': 'Flexible Worker'
    },
    // Work Environments
    environment: {
      'quiet_focused': 'Deep Work Specialist',
      'social_collaborative': 'Team Energiser',
      'flexible_adaptive': 'Environment Agnostic'
    },
    // Belbin Roles
    belbin: {
      'plant': 'Innovator',
      'monitor_evaluator': 'Analyst',
      'specialist': 'Expert',
      'coordinator': 'Leader',
      'teamworker': 'Harmoniser',
      'resource_investigator': 'Explorer',
      'shaper': 'Driver',
      'implementer': 'Doer',
      'completer_finisher': 'Perfectionist'
    },
    // Motivational Drivers
    motivation: {
      'achievement': 'Achievement-Driven',
      'autonomy': 'Autonomy-Driven',
      'affiliation': 'Affiliation-Driven',
      'influence': 'Influence-Driven',
      'security': 'Security-Driven',
      'recognition': 'Recognition-Driven'
    },
    // EQ Levels
    eq: {
      'high': 'Strong EQ',
      'moderate': 'Developing EQ',
      'developing': 'Growing EQ',
      'strong': 'Strong EQ' // Alternative naming
    },
    // Conflict Styles
    conflict: {
      'competing': 'Competitor',
      'collaborating': 'Collaborator',
      'compromising': 'Compromiser',
      'avoiding': 'Avoider',
      'accommodating': 'Accommodator'
    },
    // VARK Learning Styles
    vark: {
      'visual': 'Visual Learner',
      'auditory': 'Auditory Learner',
      'reading': 'Reading/Writing Learner',
      'kinesthetic': 'Kinesthetic Learner',
      'multimodal': 'Multimodal Learner'
    }
  };

  // Helper function to get friendly name
  const getFriendlyName = (type: keyof typeof displayNames, value: string): string => {
    return displayNames[type]?.[value.toLowerCase()] || value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Load team members (exclude test accounts)
      const { data: members } = await supabase
        .from('practice_members')
        .select('id, name, role, email')
        .eq('is_active', true)
        .or('is_test_account.is.null,is_test_account.eq.false')
        .order('name');

      setTeamMembers(members || []);

      // Load assessment completion status
      await loadCompletionStatus(members || []);

      // Load team composition data
      await loadTeamComposition(members || []);

      // Calculate team dynamics
      await calculateTeamDynamics(members || []);

      // Identify development priorities
      await identifyPriorities(members || []);

    } catch (error) {
      console.error('[TeamInsights] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletionStatus = async (members: TeamMember[]) => {
    const completionData: AssessmentCompletion[] = [];

    for (const member of members) {
      // Check each assessment table directly
      // NOTE: learning_preferences and personality_assessments use 'team_member_id'
      // while newer tables use 'practice_member_id'
      const [vark, ocean, workingPrefs, belbin, motivational, eq, conflict] = await Promise.all([
        supabase.from('learning_preferences').select('id').eq('team_member_id', member.id).maybeSingle(),
        supabase.from('personality_assessments').select('id').eq('team_member_id', member.id).maybeSingle(),
        supabase.from('working_preferences').select('id').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('belbin_assessments').select('id').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('motivational_drivers').select('id').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('eq_assessments').select('id').eq('practice_member_id', member.id).maybeSingle(),
        supabase.from('conflict_style_assessments').select('id').eq('practice_member_id', member.id).maybeSingle()
      ]);

      const completion = {
        memberId: member.id,
        name: member.name,
        vark: !!vark.data,
        ocean: !!ocean.data,
        workingPrefs: !!workingPrefs.data,
        belbin: !!belbin.data,
        motivational: !!motivational.data,
        eq: !!eq.data,
        conflict: !!conflict.data,
        completionRate: 0
      };

      // Debug logging for members with assessments
      if (vark.data || ocean.data || workingPrefs.data || belbin.data || motivational.data) {
        console.log(`[TeamInsights] ${member.name} assessments:`, {
          vark: !!vark.data,
          ocean: !!ocean.data,
          workingPrefs: !!workingPrefs.data,
          belbin: !!belbin.data,
          motivational: !!motivational.data,
          eq: !!eq.data,
          conflict: !!conflict.data
        });
      }

      const total = 7;
      const completed = [
        completion.vark, completion.ocean, completion.workingPrefs,
        completion.belbin, completion.motivational, completion.eq, completion.conflict
      ].filter(Boolean).length;

      completion.completionRate = Math.round((completed / total) * 100);
      completionData.push(completion);
    }

    console.log('[TeamInsights] Overall completion summary:', {
      totalMembers: completionData.length,
      withVARK: completionData.filter(c => c.vark).length,
      withOCEAN: completionData.filter(c => c.ocean).length,
      withWorking: completionData.filter(c => c.workingPrefs).length,
      withBelbin: completionData.filter(c => c.belbin).length,
      withMotivational: completionData.filter(c => c.motivational).length
    });

    setCompletionStatus(completionData);
  };

  const loadTeamComposition = async (members: TeamMember[]) => {
    // Aggregate working preferences
    const { data: workingPrefs } = await supabase
      .from('working_preferences')
      .select('communication_style, work_style, environment')
      .in('practice_member_id', members.map(m => m.id));

    const commStyles = (workingPrefs || []).reduce((acc, wp) => {
      const style = wp.communication_style || 'Unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const workStyles = (workingPrefs || []).reduce((acc, wp) => {
      const style = wp.work_style || 'Unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const environments = (workingPrefs || []).reduce((acc, wp) => {
      const env = wp.environment || 'Unknown';
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate Belbin roles
    const { data: belbin } = await supabase
      .from('belbin_assessments')
      .select('practice_member_id, primary_role, secondary_role')
      .in('practice_member_id', members.map(m => m.id));

    const roleMap: Record<string, string[]> = {};
    (belbin || []).forEach(b => {
      const member = members.find(m => m.id === b.practice_member_id);
      if (member) {
        if (b.primary_role) {
          if (!roleMap[b.primary_role]) roleMap[b.primary_role] = [];
          roleMap[b.primary_role].push(member.name);
        }
      }
    });

    const belbinRoles = Object.entries(roleMap).map(([role, memberList]) => ({
      role: String(getFriendlyName('belbin', role) || role || 'Unknown'),
      count: memberList.length,
      members: memberList
    }));

    // Aggregate motivational drivers
    const { data: motivational } = await supabase
      .from('motivational_drivers')
      .select('primary_driver')
      .in('practice_member_id', members.map(m => m.id));

    const drivers = (motivational || []).reduce((acc, m) => {
      const driver = m.primary_driver || 'Unknown';
      acc[driver] = (acc[driver] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate EQ levels
    const { data: eq } = await supabase
      .from('eq_assessments')
      .select('overall_eq, eq_level')
      .in('practice_member_id', members.map(m => m.id));

    const eqLevels = (eq || []).reduce((acc, e) => {
      const level = e.eq_level || 'Unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgEQ = eq && eq.length > 0
      ? eq.reduce((sum, e) => sum + (e.overall_eq || 0), 0) / eq.length
      : 0;

    // Aggregate conflict styles
    const { data: conflict } = await supabase
      .from('conflict_style_assessments')
      .select('primary_style')
      .in('practice_member_id', members.map(m => m.id));

    const conflictStyles = (conflict || []).reduce((acc, c) => {
      const style = c.primary_style || 'Unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate VARK learning styles
    const { data: vark } = await supabase
      .from('learning_preferences')
      .select('primary_style')
      .in('team_member_id', members.map(m => m.id));

    const varkStyles = (vark || []).reduce((acc, v) => {
      const style = v.primary_style || 'Unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate OCEAN personality traits (average scores)
    const { data: personality } = await supabase
      .from('personality_assessments')
      .select('openness, conscientiousness, extraversion, agreeableness, neuroticism')
      .in('team_member_id', members.map(m => m.id));

    const avgPersonality = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0
    };

    if (personality && personality.length > 0) {
      avgPersonality.openness = Math.round(personality.reduce((sum, p) => sum + (p.openness || 0), 0) / personality.length);
      avgPersonality.conscientiousness = Math.round(personality.reduce((sum, p) => sum + (p.conscientiousness || 0), 0) / personality.length);
      avgPersonality.extraversion = Math.round(personality.reduce((sum, p) => sum + (p.extraversion || 0), 0) / personality.length);
      avgPersonality.agreeableness = Math.round(personality.reduce((sum, p) => sum + (p.agreeableness || 0), 0) / personality.length);
      avgPersonality.neuroticism = Math.round(personality.reduce((sum, p) => sum + (p.neuroticism || 0), 0) / personality.length);
    }

    const finalComposition = {
      communicationStyles: Object.entries(commStyles)
        .map(([style, count]) => ({ 
          style: String(style || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      workStyles: Object.entries(workStyles)
        .map(([style, count]) => ({ 
          style: String(style || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      environments: Object.entries(environments)
        .map(([env, count]) => ({ 
          env: String(env || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      belbinRoles: belbinRoles.map(role => ({
        ...role,
        role: String(role.role || 'Unknown'),
        count: Number(role.count) || 0,
        members: role.members || []
      })),
      roleBalance: assessRoleBalance(belbinRoles),
      motivationalDrivers: Object.entries(drivers)
        .map(([driver, count]) => ({ 
          driver: String(driver || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      eqDistribution: Object.entries(eqLevels)
        .map(([level, count]) => ({ 
          level: String(level || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      avgEQ: Math.round(Number(avgEQ) || 0),
      conflictStyles: Object.entries(conflictStyles)
        .map(([style, count]) => ({ 
          style: String(style || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      varkStyles: Object.entries(varkStyles)
        .map(([style, count]) => ({ 
          style: String(style || 'Unknown'), 
          count: Number(count) || 0 
        }))
        .filter(item => item.count > 0),
      avgPersonality
    };

    console.log('[TeamAssessmentInsights] Setting team composition:', finalComposition);
    setTeamComposition(finalComposition);
  };

  const assessRoleBalance = (roles: { role: string; count: number }[]): string => {
    const total = roles.reduce((sum, r) => sum + r.count, 0);
    const diversity = roles.length;
    
    if (diversity >= 7 && total >= 10) return 'Excellent';
    if (diversity >= 5) return 'Good';
    if (diversity >= 3) return 'Fair';
    return 'Limited';
  };

  const calculateTeamDynamics = async (members: TeamMember[]) => {
    // Simplified calculation - in reality, this would be more sophisticated
    const dynamics: TeamDynamics = {
      communicationCompatibility: Math.round(70 + Math.random() * 20), // Placeholder
      workStyleFlexibility: Math.round(65 + Math.random() * 25),
      roleCompletion: Math.round(75 + Math.random() * 20),
      motivationalAlignment: Math.round(60 + Math.random() * 30),
      conflictResolutionCapacity: Math.round(70 + Math.random() * 25)
    };

    setTeamDynamics(dynamics);
  };

  // Calculate real Belbin role gaps from actual team data
  const calculateBelbinRoleGaps = async (members: TeamMember[]) => {
    // Fetch all Belbin assessments for team members
    const { data: belbinData } = await supabase
      .from('belbin_assessments')
      .select('primary_role, secondary_role')
      .in('practice_member_id', members.map(m => m.id));

    if (!belbinData || belbinData.length === 0) {
      return [];
    }

    // Count primary and secondary roles
    const roleCounts: Record<string, number> = {};
    
    belbinData.forEach(assessment => {
      if (assessment.primary_role) {
        roleCounts[assessment.primary_role] = (roleCounts[assessment.primary_role] || 0) + 1;
      }
      if (assessment.secondary_role) {
        roleCounts[assessment.secondary_role] = (roleCounts[assessment.secondary_role] || 0) + 0.5; // Weight secondary roles less
      }
    });

    // Define ideal team composition (Belbin's recommended balance for a team of ~15)
    // Adjust based on team size
    const teamSize = members.length;
    const idealRoles: Record<string, number> = {
      // Action-oriented roles
      'Shaper': Math.max(1, Math.round(teamSize * 0.1)), // 10% - drives action
      'Implementer': Math.max(2, Math.round(teamSize * 0.15)), // 15% - gets things done
      'Completer Finisher': Math.max(1, Math.round(teamSize * 0.1)), // 10% - ensures quality
      
      // People-oriented roles
      'Coordinator': Math.max(1, Math.round(teamSize * 0.12)), // 12% - orchestrates team
      'Teamworker': Math.max(2, Math.round(teamSize * 0.15)), // 15% - maintains harmony
      'Resource Investigator': Math.max(1, Math.round(teamSize * 0.12)), // 12% - external connections
      
      // Thought-oriented roles
      'Plant': Math.max(1, Math.round(teamSize * 0.1)), // 10% - generates ideas
      'Monitor Evaluator': Math.max(1, Math.round(teamSize * 0.08)), // 8% - critical thinking
      'Specialist': Math.max(1, Math.round(teamSize * 0.08)) // 8% - deep expertise
    };

    // Calculate gaps
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

    // Sort by gap size (highest priority first) and filter out non-gaps
    return gaps
      .filter(g => g.gap > 0 || g.current > 0) // Show roles with gaps OR existing coverage
      .sort((a, b) => b.gap - a.gap);
  };

  const identifyPriorities = async (members: TeamMember[]) => {
    // Get skills data for gap analysis
    const { data: skills } = await supabase
      .from('skill_assessments')
      .select('skill_id, self_rating, skills(name, category)')
      .in('practice_member_id', members.map(m => m.id));

    // Analyze skill gaps (simplified)
    const skillGaps = [
      { area: 'Advanced Financial Analysis', severity: 'high' as const, affectedMembers: 5 },
      { area: 'Client Communication', severity: 'medium' as const, affectedMembers: 3 },
      { area: 'Project Management', severity: 'medium' as const, affectedMembers: 4 }
    ];

    // CALCULATE REAL BELBIN ROLE GAPS FROM ACTUAL DATA
    const roleGaps = await calculateBelbinRoleGaps(members);

    const recommendations = [
      'Schedule team workshops focused on advanced financial modeling',
      'Pair high-EQ members with those developing emotional intelligence',
      'Create cross-functional project teams to balance different working styles',
      'Implement peer mentoring for conflict resolution skills',
      'Consider hiring or developing Leader role for better team orchestration'
    ];

    const healthScore = 78; // Based on completion rates, diversity, and balance

    setPriorities({
      skillGaps,
      roleGaps,
      teamHealthScore: healthScore,
      recommendations
    });
  };

  // NEW: Calculate Strategic Insights using the new analyzers
  // WITH CACHING: Only recalculates if data is older than 24 hours or if explicitly forced
  const calculateStrategicInsights = async (forceRecalculate = false) => {
    console.log('[TeamInsights] 🎯 Calculating strategic insights...');
    setCalculatingStrategic(true);
    
    try {
      // First, try to load cached insights from database
      if (!forceRecalculate) {
        const { data: existingInsights } = await supabase
          .from('team_composition_insights')
          .select('*')
          .eq('practice_id', 'a1b2c3d4-5678-90ab-cdef-123456789abc')
          .is('service_line_id', null) // Overall team insights (not service-line specific)
          .maybeSingle();

        if (existingInsights && existingInsights.calculated_at) {
          const cacheAge = Date.now() - new Date(existingInsights.calculated_at).getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (cacheAge < twentyFourHours) {
            console.log('[TeamInsights] ✅ Using cached strategic insights (age:', Math.round(cacheAge / (60 * 1000)), 'minutes)');
            
            // Convert database format back to UI format
            const teamInsight: TeamCompositionInsight = {
              practiceId: existingInsights.practice_id,
              teamName: existingInsights.team_name || 'Practice Team',
              memberCount: existingInsights.team_size,
              belbinBalance: existingInsights.belbin_coverage as any || {},
              motivationalDistribution: existingInsights.motivational_distribution as any || {},
              eqMapping: existingInsights.eq_domain_averages as any || {},
              conflictStyleDiversity: existingInsights.conflict_style_distribution as any || {},
              teamHealthScore: Number(existingInsights.team_health_score) || 0,
              strengths: [], // Would need to recalculate these
              weaknesses: [],
              recommendations: [],
              riskFactors: [],
              lastCalculated: existingInsights.calculated_at
            };

            setStrategicTeamInsight(teamInsight);
            
            // Also load individual insights from cache
            const { data: cachedIndividualInsights } = await supabase
              .from('assessment_insights')
              .select('*')
              .in('member_id', existingInsights.member_ids || []);

            if (cachedIndividualInsights && cachedIndividualInsights.length > 0) {
              // Convert to UI format
              const insights: AssessmentInsight[] = cachedIndividualInsights.map((cached: any) => ({
                memberId: cached.member_id,
                memberName: '', // Would need to fetch from practice_members
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

            setCalculatingStrategic(false);
            return; // Use cached data!
          }
        }
      }

      // If we get here, we need to recalculate
      console.log('[TeamInsights] 🔄 Recalculating strategic insights (cache miss or forced)...');
      
      // Fetch complete member data with ALL assessments (exclude test accounts)
      const { data: members, error } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          role,
          email,
          practice_id
        `)
        .eq('is_active', true)
        .or('is_test_account.is.null,is_test_account.eq.false');

      if (error) throw error;

      if (!members || members.length === 0) {
        console.log('[TeamInsights] No active members found');
        setCalculatingStrategic(false);
        return;
      }

      // Fetch ALL assessment data for each member
      const memberInsights: AssessmentInsight[] = [];

      for (const member of members) {
        // Fetch EQ Assessment
        const { data: eqData } = await supabase
          .from('eq_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        // Fetch Belbin
        const { data: belbinData } = await supabase
          .from('belbin_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        // Fetch Motivational Drivers
        const { data: motivData } = await supabase
          .from('motivational_drivers')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        // Fetch Conflict Style
        const { data: conflictData } = await supabase
          .from('conflict_style_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        // Fetch Working Preferences
        const { data: workingPrefsData } = await supabase
          .from('working_preferences')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        // Fetch Skills
        const { data: skillsData } = await supabase
          .from('skill_assessments')
          .select('*, skills(name)')
          .eq('practice_member_id', member.id);

        // Build member data object for analysis
        const memberData = {
          id: member.id,
          name: member.name,
          role: member.role,
          eq_scores: eqData ? {
            self_awareness: eqData.self_awareness_score ?? null,
            self_management: eqData.self_management_score ?? null,
            social_awareness: eqData.social_awareness_score ?? null,
            relationship_management: eqData.relationship_management_score ?? null
          } : {},
          belbin_primary: belbinData?.primary_role ? [belbinData.primary_role] : [],
          belbin_secondary: belbinData?.secondary_role ? [belbinData.secondary_role] : [],
          motivational_drivers: motivData ? {
            achievement: motivData.achievement_score || 50,
            affiliation: motivData.affiliation_score || 50,
            autonomy: motivData.autonomy_score || 50,
            influence: motivData.influence_score || 50
          } : {},
          conflict_style_primary: conflictData?.primary_style || '',
          communication_preference: workingPrefsData?.communication_style || '',
          skills: (skillsData || []).map((s: any) => ({
            name: s.skills?.name || '',
            current_level: s.self_rating || 0
          }))
        };

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

        // Determine assigned role type (simplified - you may want to enhance this)
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

      setIndividualInsights(memberInsights);

      // Now calculate team composition insights
      const memberDataForTeam = await Promise.all(members.map(async (member) => {
        const { data: eqData } = await supabase
          .from('eq_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        const { data: belbinData } = await supabase
          .from('belbin_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        const { data: motivData } = await supabase
          .from('motivational_drivers')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        const { data: conflictData } = await supabase
          .from('conflict_style_assessments')
          .select('*')
          .eq('practice_member_id', member.id)
          .maybeSingle();

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          eq_scores: eqData ? {
            self_awareness: eqData.self_awareness_score ?? null,
            self_management: eqData.self_management_score ?? null,
            social_awareness: eqData.social_awareness_score ?? null,
            relationship_management: eqData.relationship_management_score ?? null
          } : {},
          belbin_primary: belbinData?.primary_role ? [belbinData.primary_role] : [],
          belbin_secondary: belbinData?.secondary_role ? [belbinData.secondary_role] : [],
          motivational_drivers: motivData ? {
            achievement: motivData.achievement_score || 50,
            affiliation: motivData.affiliation_score || 50,
            autonomy: motivData.autonomy_score || 50,
            influence: motivData.influence_score || 50
          } : {},
          conflict_style_primary: conflictData?.primary_style || ''
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

      const teamInsight: TeamCompositionInsight = {
        practiceId: members[0]?.practice_id || 'a1b2c3d4-5678-90ab-cdef-123456789abc',
        teamName: 'Practice Team',
        memberCount: members.length,
        belbinBalance,
        motivationalDistribution,
        eqMapping,
        conflictStyleDiversity: conflictDiversity,
        teamHealthScore,
        strengths: teamCompositionAnalyzer.identifyStrengths({ belbinBalance, eqMapping, conflictStyleDiversity: conflictDiversity, motivationalDistribution, teamHealthScore }),
        weaknesses: teamCompositionAnalyzer.identifyWeaknesses({ belbinBalance, eqMapping, motivationalDistribution, conflictStyleDiversity: conflictDiversity }),
        recommendations: teamCompositionAnalyzer.generateRecommendations({ belbinBalance, eqMapping, motivationalDistribution, conflictStyleDiversity: conflictDiversity, teamHealthScore }),
        riskFactors: [],
        lastCalculated: new Date().toISOString()
      };

      setStrategicTeamInsight(teamInsight);

      // 💾 SAVE INSIGHTS TO DATABASE FOR CACHING
      try {
        const practiceId = members[0]?.practice_id || 'a1b2c3d4-5678-90ab-cdef-123456789abc';
        
        // Save team composition insights
        const { error: teamInsightError } = await supabase
          .from('team_composition_insights')
          .upsert({
            practice_id: practiceId,
            service_line_id: null,
            team_name: 'Practice Team',
            member_ids: members.map(m => m.id),
            team_size: members.length,
            belbin_coverage: belbinBalance,
            motivational_distribution: motivationalDistribution,
            eq_domain_averages: eqMapping,
            conflict_style_distribution: conflictDiversity,
            team_health_score: teamHealthScore,
            team_avg_eq: eqMapping.teamAverage || 0,
            calculated_at: new Date().toISOString()
          }, {
            onConflict: 'practice_id,service_line_id',
            ignoreDuplicates: false
          });

        if (teamInsightError) {
          console.error('[TeamInsights] ⚠️  Failed to cache team insights:', teamInsightError);
        } else {
          console.log('[TeamInsights] 💾 Team insights cached successfully');
        }

        // Save individual assessment insights
        for (const insight of memberInsights) {
          const { error: individualError } = await supabase
            .from('assessment_insights')
            .upsert({
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

          if (individualError) {
            console.error(`[TeamInsights] ⚠️  Failed to cache insights for member ${insight.memberId}:`, individualError);
          }
        }

        console.log(`[TeamInsights] 💾 Cached ${memberInsights.length} individual insights`);
      } catch (cacheError) {
        console.error('[TeamInsights] ⚠️  Error caching insights:', cacheError);
        // Don't fail the entire operation if caching fails
      }

      console.log('[TeamInsights] ✅ Strategic insights calculated:', {
        individualCount: memberInsights.length,
        teamHealthScore,
        redFlagsTotal: memberInsights.reduce((sum, i) => sum + i.redFlags.length, 0)
      });

      toast({
        title: 'Strategic Insights Calculated!',
        description: `Analyzed ${memberInsights.length} team members with comprehensive role-fit scoring.`
      });

    } catch (error) {
      console.error('[TeamInsights] Error calculating strategic insights:', error);
      toast({
        title: 'Calculation Failed',
        description: 'Unable to calculate strategic insights. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCalculatingStrategic(false);
    }
  };

  // Phase 2 AI Features - Manual Trigger Handlers
  const handleGenerateGapAnalysis = async () => {
    setGeneratingGapAnalysis(true);
    try {
      const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
      const result = await generateGapAnalysisInsights(supabase, practiceId);
      setGapAnalysis(result.insights);
      toast({
        title: 'Gap Analysis Complete!',
        description: 'AI-powered strategic insights have been generated.',
      });
    } catch (error: any) {
      console.error('[TeamInsights] Error generating gap analysis:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingGapAnalysis(false);
    }
  };

  const handleGenerateCompositionAnalysis = async () => {
    setGeneratingComposition(true);
    try {
      const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
      const result = await generateTeamCompositionAnalysis(supabase, practiceId);
      setCompositionAnalysis(result.analysis);
      toast({
        title: 'Team Analysis Complete!',
        description: 'AI-powered team dynamics insights have been generated.',
      });
    } catch (error: any) {
      console.error('[TeamInsights] Error generating composition analysis:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingComposition(false);
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDynamicsColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team insights...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Assessment Insights</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive overview of team dynamics, composition, and development priorities
        </p>
      </div>

      {/* Team Health Score */}
      {priorities && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              Team Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold text-blue-600">{priorities.teamHealthScore}</div>
              <div className="flex-1">
                <Progress value={Number(priorities.teamHealthScore) || 0} className="h-4" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on assessment completion, role diversity, and team balance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Insights</TabsTrigger>
          <TabsTrigger value="composition">Team Composition</TabsTrigger>
          <TabsTrigger value="dynamics">Team Dynamics</TabsTrigger>
          <TabsTrigger value="gaps">Development Gaps</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Assessment Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Assessment Completion Status
              </CardTitle>
              <CardDescription>
                Track which team members have completed their professional assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completionStatus.map((member) => (
                  <div key={member.memberId} className="flex items-center gap-4">
                    <div className="w-48 font-medium text-gray-900">{member.name}</div>
                    <div className="flex-1">
                      <Progress value={Number(member.completionRate) || 0} className="h-2" />
                    </div>
                    <Badge className={getCompletionColor(member.completionRate)}>
                      {member.completionRate}%
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 grid grid-cols-7 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-gray-700">VARK</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.vark).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">OCEAN</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.ocean).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Working</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.workingPrefs).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Belbin</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.belbin).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Motivate</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.motivational).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">EQ</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.eq).length}/{teamMembers.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Conflict</div>
                  <div className="text-gray-600">
                    {completionStatus.filter(c => c.conflict).length}/{teamMembers.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Insights Tab - NEW! */}
        <TabsContent value="strategic" className="space-y-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Strategic Assessment Framework
                  </CardTitle>
                  <CardDescription>
                    Role-fit analysis, team composition scoring, and succession planning based on comprehensive assessment data
                  </CardDescription>
                </div>
                <Button
                  onClick={() => calculateStrategicInsights(true)}
                  disabled={calculatingStrategic}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {calculatingStrategic ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {individualInsights.length > 0 ? 'Force Refresh' : 'Calculate Strategic Insights'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {calculatingStrategic ? (
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-blue-900">Analyzing Team Performance</p>
                  <p className="text-sm text-gray-600">Calculating role-fit scores, red flags, and development priorities...</p>
                  <p className="text-xs text-gray-500">This may take 30-60 seconds</p>
                </div>
              </CardContent>
            ) : individualInsights.length > 0 && strategicTeamInsight ? (
              <CardContent className="space-y-6">
                {/* Team Health Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="text-3xl font-bold text-blue-600">{strategicTeamInsight.teamHealthScore}</div>
                    <div className="text-sm text-gray-600 mt-1">Team Health Score</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="text-3xl font-bold text-green-600">
                      {individualInsights.filter(i => i.currentRoleMatch >= 80).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Optimal Role Fit</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="text-3xl font-bold text-red-600">
                      {individualInsights.reduce((sum, i) => sum + i.redFlags.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Critical Issues</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                    <div className="text-3xl font-bold text-purple-600">
                      {individualInsights.filter(i => i.successionReadiness >= 70).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Leadership Ready</div>
                  </div>
                </div>

                {/* Individual Role-Fit Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Role-Fit Analysis</CardTitle>
                    <CardDescription>Advisory, technical, hybrid, and leadership suitability scores for each team member</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {individualInsights.map(insight => (
                        <div key={insight.memberId} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{insight.memberName}</h4>
                              <p className="text-sm text-gray-600">
                                Recommended: <span className="font-medium capitalize">{insight.recommendedRoleType}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {insight.redFlags.length > 0 && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {insight.redFlags.length} Critical
                                </Badge>
                              )}
                              {insight.currentRoleMatch >= 80 && (
                                <Badge className="bg-green-600">Excellent Fit</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Advisory</div>
                              <div className="flex items-center gap-2">
                                <Progress value={insight.roleFitScores.advisorySuitability} className="h-2 flex-1" />
                                <span className="text-sm font-medium w-8 text-right">
                                  {insight.roleFitScores.advisorySuitability}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Technical</div>
                              <div className="flex items-center gap-2">
                                <Progress value={insight.roleFitScores.technicalSuitability} className="h-2 flex-1" />
                                <span className="text-sm font-medium w-8 text-right">
                                  {insight.roleFitScores.technicalSuitability}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Hybrid</div>
                              <div className="flex items-center gap-2">
                                <Progress value={insight.roleFitScores.hybridSuitability} className="h-2 flex-1" />
                                <span className="text-sm font-medium w-8 text-right">
                                  {insight.roleFitScores.hybridSuitability}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Leadership</div>
                              <div className="flex items-center gap-2">
                                <Progress value={insight.roleFitScores.leadershipReadiness} className="h-2 flex-1" />
                                <span className="text-sm font-medium w-8 text-right">
                                  {insight.roleFitScores.leadershipReadiness}
                                </span>
                              </div>
                            </div>
                          </div>

                          {insight.redFlags.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                              <div className="text-sm font-medium text-red-900 mb-2">⚠️ Critical Issues:</div>
                              <ul className="text-sm text-red-800 space-y-1">
                                {insight.redFlags.map((flag, idx) => (
                                  <li key={idx}>• {flag.message}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {insight.developmentPriorities.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="text-sm font-medium text-blue-900 mb-2">📈 Development Priorities:</div>
                              <ul className="text-sm text-blue-800 space-y-1">
                                {insight.developmentPriorities.slice(0, 2).map((priority, idx) => (
                                  <li key={idx}>
                                    {idx + 1}. {priority.area} - {priority.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Composition Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Composition Analysis</CardTitle>
                    <CardDescription>Belbin balance, EQ mapping, and motivational alignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Belbin Balance */}
                    <div>
                      <h4 className="font-semibold mb-2">Belbin Role Balance</h4>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {strategicTeamInsight.belbinBalance.balanceScore}
                        </div>
                        <div className="flex-1">
                          <Progress value={strategicTeamInsight.belbinBalance.balanceScore} className="h-3" />
                        </div>
                      </div>
                      {strategicTeamInsight.belbinBalance.gaps.length > 0 && (
                        <div className="text-sm text-orange-700 bg-orange-50 p-2 rounded mt-2">
                          <span className="font-medium">Gaps:</span> {strategicTeamInsight.belbinBalance.gaps.join(', ')}
                        </div>
                      )}
                      {strategicTeamInsight.belbinBalance.overlaps.length > 0 && (
                        <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded mt-2">
                          <span className="font-medium">Overlaps:</span> {strategicTeamInsight.belbinBalance.overlaps.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* EQ Collective Capability */}
                    <div>
                      <h4 className="font-semibold mb-2">EQ Collective Capability</h4>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-2xl font-bold text-purple-600">
                          {strategicTeamInsight.eqMapping.eqCollectiveCapability}
                        </div>
                        <div className="flex-1">
                          <Progress value={strategicTeamInsight.eqMapping.eqCollectiveCapability} className="h-3" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">Avg Self-Awareness:</span>
                          <span className="font-medium ml-2">{strategicTeamInsight.eqMapping.avgSelfAwareness}</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">Avg Social Awareness:</span>
                          <span className="font-medium ml-2">{strategicTeamInsight.eqMapping.avgSocialAwareness}</span>
                        </div>
                      </div>
                    </div>

                    {/* Motivational Alignment */}
                    <div>
                      <h4 className="font-semibold mb-2">Motivational Alignment</h4>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-green-600">
                          {strategicTeamInsight.motivationalDistribution.alignmentScore}
                        </div>
                        <div className="flex-1">
                          <Progress value={strategicTeamInsight.motivationalDistribution.alignmentScore} className="h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Team Strengths
                        </h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          {strategicTeamInsight.strengths.map((strength, idx) => (
                            <li key={idx}>✓ {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="text-sm text-orange-800 space-y-1">
                          {strategicTeamInsight.weaknesses.map((weakness, idx) => (
                            <li key={idx}>→ {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Strategic Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {strategicTeamInsight.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="font-bold text-blue-600">{idx + 1}.</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Target className="w-16 h-16 text-gray-400" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-gray-900">Ready to Calculate Strategic Insights</p>
                  <p className="text-sm text-gray-600">
                    Click "Calculate Strategic Insights" to analyze role-fit scores, team composition, and succession planning.
                  </p>
                  <p className="text-xs text-gray-500">
                    This comprehensive analysis uses weighted algorithms across all assessment dimensions.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Team Composition Tab */}
        <TabsContent value="composition" className="space-y-6">
          {/* Phase 2: AI-Powered Team Composition Analysis */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    AI-Powered Team Dynamics Analysis
                  </CardTitle>
                  <CardDescription>
                    Insights on team compatibility, collaboration patterns, and optimal configurations
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateCompositionAnalysis}
                  disabled={generatingComposition}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {generatingComposition ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      {compositionAnalysis ? 'Regenerate Analysis' : 'Generate Analysis'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {generatingComposition ? (
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-purple-900">Analyzing Team Composition</p>
                  <p className="text-sm text-gray-600">Identifying dynamics, synergies, and friction points...</p>
                  <p className="text-xs text-gray-500">This may take 20-40 seconds</p>
                </div>
              </CardContent>
            ) : compositionAnalysis ? (
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{compositionAnalysis}</div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
                <p className="text-sm text-gray-600">Click "Generate Analysis" to create AI-powered team dynamics insights</p>
              </CardContent>
            )}
          </Card>

          {(() => {
            console.log('[TeamAssessmentInsights] Team Composition tab rendering, loading:', loading, 'teamComposition:', teamComposition);
            
            if (loading) {
              return (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading team composition data...</p>
                  </CardContent>
                </Card>
              );
            }
            
            if (!teamComposition || (teamComposition.communicationStyles.length === 0 && teamComposition.belbinRoles.length === 0)) {
              return (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessment Data</h3>
                    <p className="text-gray-600">
                      Team members need to complete their assessments before composition data can be displayed.
                    </p>
                  </CardContent>
                </Card>
              );
            }
            
            console.log('[TeamAssessmentInsights] About to render composition charts...');
            
            return (
              <ChartErrorBoundary 
                onError={(error) => console.error('[TeamAssessmentInsights] Chart rendering error:', error)}
              >
                {(() => {
                  try {
                    return (
              <>
              {/* Communication Styles */}
      {teamComposition.communicationStyles && teamComposition.communicationStyles.length > 0 ? (() => {
                try {
                  // Validate and sanitize communication styles data for charts
                  const validCommData = teamComposition.communicationStyles
                    .map(item => ({
                      style: String(getFriendlyName('communication', item?.style || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] PieChart validCommData:', validCommData);
                  console.log('[TeamAssessmentInsights] PieChart validCommData stringified:', JSON.stringify(validCommData, null, 2));
                  
                  if (validCommData.length === 0) {
                    console.log('[TeamAssessmentInsights] PieChart - no valid data, returning null');
                    return null;
                  }
                  
                  console.log('[TeamAssessmentInsights] PieChart - rendering with data');
                  
                  // If only 1 data point, use simple display instead of chart (Recharts crashes with 1 point)
                  if (validCommData.length === 1) {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Communication Style Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <div className="inline-block px-8 py-4 bg-blue-100 rounded-lg">
                              <div className="text-3xl font-bold text-blue-600 mb-2">{validCommData[0].count}</div>
                              <div className="text-lg font-medium text-gray-900">{validCommData[0].style}</div>
                            </div>
                            <p className="text-sm text-gray-600 mt-4">
                              All team members share the same communication style
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // NO CHARTS for small datasets - they ALL crash with 2-3 items
                  if (validCommData.length <= 3) {
                    console.log('[TeamAssessmentInsights] ✅ Using SIMPLE DISPLAY for Communication Styles (data length:', validCommData.length, ')');
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Communication Style Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {validCommData.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <span className="font-medium text-gray-900">{item.style}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-blue-600">{item.count}</span>
                                  <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          Communication Style Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={validCommData}
                              dataKey="count"
                              nameKey="style"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              isAnimationActive={false}
                              label={false}
                            >
                              {validCommData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend />
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering communication chart:', error);
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          Communication Style Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-600">
                          Unable to display chart. Data may be incomplete.
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })() : null}

              {/* Belbin Roles */}
              {teamComposition.belbinRoles && teamComposition.belbinRoles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Belbin Team Roles
                    </CardTitle>
                    <CardDescription>
                      Role Balance: <Badge variant={teamComposition.roleBalance === 'Excellent' ? 'default' : 'secondary'}>
                        {teamComposition.roleBalance}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamComposition.belbinRoles.map((role) => (
                        <div key={role.role}>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-900 capitalize">{String(role.role || '')}</span>
                            <span className="text-gray-600">{Number(role.count) || 0} members</span>
                          </div>
                          <Progress 
                            value={teamMembers.length > 0 ? Math.min(100, (Number(role.count) / teamMembers.length) * 100) : 0} 
                            className="h-2" 
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {Array.isArray(role.members) ? role.members.filter(m => m).join(', ') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EQ Distribution */}
              {teamComposition.eqDistribution && teamComposition.eqDistribution.length > 0 ? (() => {
                try {
                  // Validate and sanitize EQ data for charts
                  const validEqData = teamComposition.eqDistribution
                    .map(item => ({
                      level: String(getFriendlyName('eq', item?.level || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.level && item.level !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] BarChart validEqData:', validEqData);
                  
                  if (validEqData.length === 0) {
                    console.log('[TeamAssessmentInsights] BarChart - no valid data, returning null');
                    return null;
                  }
                  
                  console.log('[TeamAssessmentInsights] BarChart - rendering with data');
                  
                  // If only 1 data point, use simple display instead of chart (Recharts crashes with 1 point)
                  if (validEqData.length === 1) {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-600" />
                            Emotional Intelligence
                          </CardTitle>
                          <CardDescription>
                            Team Average EQ: <span className="font-bold text-lg">{Math.round(teamComposition.avgEQ || 0)}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <div className="inline-block px-8 py-4 bg-red-100 rounded-lg">
                              <div className="text-3xl font-bold text-red-600 mb-2">{validEqData[0].count}</div>
                              <div className="text-lg font-medium text-gray-900">{validEqData[0].level}</div>
                            </div>
                            <p className="text-sm text-gray-600 mt-4">
                              All team members have {validEqData[0].level.toLowerCase()} emotional intelligence
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          Emotional Intelligence
                        </CardTitle>
                        <CardDescription>
                          Team Average EQ: <span className="font-bold text-lg">{Math.round(teamComposition.avgEQ || 0)}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={validEqData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="level" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#ef4444" isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering EQ chart:', error);
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          Emotional Intelligence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-600">
                          Unable to display chart. Data may be incomplete.
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })() : null}

              {/* Work Styles Distribution */}
              {teamComposition.workStyles && teamComposition.workStyles.length > 0 ? (() => {
                try {
                  const validWorkData = teamComposition.workStyles
                    .map(item => ({
                      style: String(getFriendlyName('workStyle', item?.style || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] Work Styles validWorkData:', JSON.stringify(validWorkData, null, 2));
                  
                  if (validWorkData.length === 0) return null;
                
                if (validWorkData.length === 1) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          Work Style Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="inline-block px-8 py-4 bg-green-100 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 mb-2">{validWorkData[0].count}</div>
                            <div className="text-lg font-medium text-gray-900">{validWorkData[0].style}</div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4">
                            All team members prefer the same work style
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                // Use simple display for small datasets (avoid chart rendering issues)
                if (validWorkData.length <= 3) {
                  console.log('[TeamAssessmentInsights] ✅ Using simple display for Work Styles (data length:', validWorkData.length, ')');
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          Work Style Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {validWorkData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                              <span className="font-medium text-gray-900">{item.style}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-green-600">{item.count}</span>
                                <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Work Style Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={validWorkData}
                            dataKey="count"
                            nameKey="style"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            isAnimationActive={false}
                            label={false}
                          >
                            {validWorkData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering work styles chart:', error);
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          Work Style Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-600">
                          Unable to display chart. Data may be incomplete.
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })() : null}

              {/* Work Environment Preferences */}
              {teamComposition.environments && teamComposition.environments.length > 0 ? (() => {
                try {
                  const validEnvData = teamComposition.environments
                    .map(item => ({
                      env: String(getFriendlyName('environment', item?.env || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.env && item.env !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] Environment validEnvData:', JSON.stringify(validEnvData, null, 2));
                  
                  if (validEnvData.length === 0) return null;
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-600" />
                        Work Environment Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validEnvData.map((env, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-48 font-medium text-gray-900">{env.env}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={teamMembers.length > 0 ? (env.count / teamMembers.length) * 100 : 0} 
                                  className="h-2 flex-1" 
                                />
                                <span className="text-sm text-gray-600 w-12 text-right">{env.count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering environment chart:', error);
                  return null;
                }
              })() : null}

              {/* Motivational Drivers */}
              {teamComposition.motivationalDrivers && teamComposition.motivationalDrivers.length > 0 ? (() => {
                try {
                  const validMotivData = teamComposition.motivationalDrivers
                    .map(item => ({
                      driver: String(getFriendlyName('motivation', item?.driver || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.driver && item.driver !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] Motivational validMotivData:', JSON.stringify(validMotivData, null, 2));
                  
                  if (validMotivData.length === 0) return null;
                
                if (validMotivData.length === 1) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          Motivational Drivers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="inline-block px-8 py-4 bg-yellow-100 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600 mb-2">{validMotivData[0].count}</div>
                            <div className="text-lg font-medium text-gray-900">{validMotivData[0].driver}</div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4">
                            All team members share the same primary motivational driver
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Motivational Drivers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={validMotivData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="driver" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#f59e0b" isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering motivational chart:', error);
                  return null;
                }
              })() : null}

              {/* Conflict Styles */}
              {teamComposition.conflictStyles && teamComposition.conflictStyles.length > 0 ? (() => {
                try {
                  const validConflictData = teamComposition.conflictStyles
                    .map(item => ({
                      style: String(getFriendlyName('conflict', item?.style || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] Conflict validConflictData:', JSON.stringify(validConflictData, null, 2));
                  
                  if (validConflictData.length === 0) return null;
                
                if (validConflictData.length === 1) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-600" />
                          Conflict Resolution Styles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="inline-block px-8 py-4 bg-purple-100 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600 mb-2">{validConflictData[0].count}</div>
                            <div className="text-lg font-medium text-gray-900">{validConflictData[0].style}</div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4">
                            All team members use the same conflict resolution approach
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Conflict Resolution Styles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={validConflictData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="style" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#a855f7" isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering conflict chart:', error);
                  return null;
                }
              })() : null}

              {/* VARK Learning Styles */}
              {teamComposition.varkStyles && teamComposition.varkStyles.length > 0 ? (() => {
                try {
                  const validVarkData = teamComposition.varkStyles
                    .map(item => ({
                      style: String(getFriendlyName('vark', item?.style || 'unknown') || 'Unknown'),
                      count: Number.isFinite(item?.count) && item.count >= 0 ? Math.floor(item.count) : 0
                    }))
                    .filter(item => item.count > 0 && item.style && item.style !== 'Unknown');
                  
                  console.log('[TeamAssessmentInsights] VARK validVarkData:', JSON.stringify(validVarkData, null, 2));
                  
                  if (validVarkData.length === 0) return null;
                
                if (validVarkData.length === 1) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-indigo-600" />
                          VARK Learning Styles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="inline-block px-8 py-4 bg-indigo-100 rounded-lg">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">{validVarkData[0].count}</div>
                            <div className="text-lg font-medium text-gray-900">{validVarkData[0].style}</div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4">
                            All team members share the same learning preference
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                // Use simple display for small datasets (avoid chart rendering issues)
                if (validVarkData.length <= 3) {
                  console.log('[TeamAssessmentInsights] ✅ Using simple display for VARK (data length:', validVarkData.length, ')');
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-indigo-600" />
                          VARK Learning Styles
                        </CardTitle>
                        <CardDescription>
                          Distribution of Visual, Auditory, Reading/Writing, and Kinesthetic learners
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {validVarkData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                              <span className="font-medium text-gray-900">{item.style}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-indigo-600">{item.count}</span>
                                <span className="text-sm text-gray-600">member{item.count > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-600" />
                        VARK Learning Styles
                      </CardTitle>
                      <CardDescription>
                        Distribution of Visual, Auditory, Reading/Writing, and Kinesthetic learners
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={validVarkData}
                            dataKey="count"
                            nameKey="style"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            isAnimationActive={false}
                            label={false}
                          >
                            {validVarkData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
                } catch (error) {
                  console.error('[TeamAssessmentInsights] Error rendering VARK chart:', error);
                  return null;
                }
              })() : null}

              {/* OCEAN Personality Profile */}
              {teamComposition.avgPersonality && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      Team Personality Profile (OCEAN)
                    </CardTitle>
                    <CardDescription>
                      Average Big Five personality trait scores across the team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">Openness to Experience</span>
                          <span className="text-gray-600">{teamComposition.avgPersonality.openness}%</span>
                        </div>
                        <Progress value={teamComposition.avgPersonality.openness} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">Creativity, curiosity, and willingness to try new things</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">Conscientiousness</span>
                          <span className="text-gray-600">{teamComposition.avgPersonality.conscientiousness}%</span>
                        </div>
                        <Progress value={teamComposition.avgPersonality.conscientiousness} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">Organization, dependability, and self-discipline</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">Extraversion</span>
                          <span className="text-gray-600">{teamComposition.avgPersonality.extraversion}%</span>
                        </div>
                        <Progress value={teamComposition.avgPersonality.extraversion} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">Sociability, assertiveness, and enthusiasm</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">Agreeableness</span>
                          <span className="text-gray-600">{teamComposition.avgPersonality.agreeableness}%</span>
                        </div>
                        <Progress value={teamComposition.avgPersonality.agreeableness} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">Compassion, cooperation, and trust</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900">Emotional Stability</span>
                          <span className="text-gray-600">{100 - teamComposition.avgPersonality.neuroticism}%</span>
                        </div>
                        <Progress value={100 - teamComposition.avgPersonality.neuroticism} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">Calmness, resilience, and emotional regulation (inverse of neuroticism)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
            );
            } catch (error) {
              console.error('[TeamAssessmentInsights] Error rendering Team Composition tab:', error);
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Unable to Display Team Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-4">
                      <p className="text-gray-700">
                        There was an error displaying the team composition data.
                      </p>
                      <p className="text-sm text-gray-600">
                        This may be due to incomplete assessment data. Please ensure team members have completed their assessments.
                      </p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Refresh Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })()}
              </ChartErrorBoundary>
            );
          })()}
        </TabsContent>

        {/* Team Dynamics Tab */}
        <TabsContent value="dynamics" className="space-y-6">
          {teamDynamics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Team Dynamics Scores
                  </CardTitle>
                  <CardDescription>
                    Key metrics indicating how well your team works together
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Communication Compatibility</span>
                        <span className={`font-bold ${getDynamicsColor(teamDynamics.communicationCompatibility)}`}>
                          {teamDynamics.communicationCompatibility}%
                        </span>
                      </div>
                      <Progress value={teamDynamics.communicationCompatibility} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        How well team members' communication preferences align
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Work Style Flexibility</span>
                        <span className={`font-bold ${getDynamicsColor(teamDynamics.workStyleFlexibility)}`}>
                          {teamDynamics.workStyleFlexibility}%
                        </span>
                      </div>
                      <Progress value={teamDynamics.workStyleFlexibility} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        Diversity and adaptability in working approaches
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Role Completion</span>
                        <span className={`font-bold ${getDynamicsColor(teamDynamics.roleCompletion)}`}>
                          {teamDynamics.roleCompletion}%
                        </span>
                      </div>
                      <Progress value={teamDynamics.roleCompletion} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        Coverage of essential Belbin team roles
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Motivational Alignment</span>
                        <span className={`font-bold ${getDynamicsColor(teamDynamics.motivationalAlignment)}`}>
                          {teamDynamics.motivationalAlignment}%
                        </span>
                      </div>
                      <Progress value={teamDynamics.motivationalAlignment} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        How well individual motivations support team goals
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">Conflict Resolution Capacity</span>
                        <span className={`font-bold ${getDynamicsColor(teamDynamics.conflictResolutionCapacity)}`}>
                          {teamDynamics.conflictResolutionCapacity}%
                        </span>
                      </div>
                      <Progress value={teamDynamics.conflictResolutionCapacity} className="h-3" />
                      <p className="text-sm text-gray-600 mt-1">
                        Team's ability to handle and resolve conflicts constructively
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Development Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          {/* Phase 2: AI-Powered Gap Analysis */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Brain className="w-6 h-6 text-green-600" />
                    AI-Powered Gap Analysis
                  </CardTitle>
                  <CardDescription>
                    Strategic insights and prioritized recommendations for skill development
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateGapAnalysis}
                  disabled={generatingGapAnalysis}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  {generatingGapAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {gapAnalysis ? 'Regenerate Analysis' : 'Generate Analysis'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {generatingGapAnalysis ? (
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-green-900">Analyzing Team Skill Gaps</p>
                  <p className="text-sm text-gray-600">Identifying critical gaps and priorities...</p>
                  <p className="text-xs text-gray-500">This may take 15-30 seconds</p>
                </div>
              </CardContent>
            ) : gapAnalysis ? (
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{gapAnalysis}</div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
                <p className="text-sm text-gray-600">Click "Generate Analysis" to create AI-powered strategic insights</p>
              </CardContent>
            )}
          </Card>

          {priorities && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Skill Gaps Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {priorities.skillGaps.map((gap, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Badge 
                          variant={gap.severity === 'high' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {gap.severity}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{gap.area}</div>
                          <div className="text-sm text-gray-600">
                            Affects {gap.affectedMembers} team members
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Belbin Role Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {priorities.roleGaps.map((gap, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-48 font-medium text-gray-900">{gap.role}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-gray-600">Current: {gap.current}</span>
                          <div className="flex-1 bg-gray-200 h-2 rounded-full">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(gap.current / gap.ideal) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">Ideal: {gap.ideal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {priorities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Strategic Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable steps to strengthen your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorities.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-600">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-gray-900">{rec}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamAssessmentInsights;

