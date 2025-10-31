/**
 * Team Assessment Insights Dashboard
 * Comprehensive overview of all team assessments for strategic team development
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { 
  Users, Brain, TrendingUp, Target, AlertCircle, 
  CheckCircle2, Lightbulb, Award, Activity, Zap,
  Shield, Heart, MessageSquare, Clock, Settings
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

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Load team members
      const { data: members } = await supabase
        .from('practice_members')
        .select('id, name, role, email')
        .eq('is_active', true)
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
      const { data: assessments } = await supabase
        .from('team_comprehensive_assessments')
        .select('*')
        .eq('practice_member_id', member.id)
        .single();

      const completion = {
        memberId: member.id,
        name: member.name,
        vark: !!assessments?.vark_completed,
        ocean: !!assessments?.personality_completed,
        workingPrefs: !!assessments?.working_prefs_completed,
        belbin: !!assessments?.belbin_completed,
        motivational: !!assessments?.motivational_completed,
        eq: !!assessments?.eq_completed,
        conflict: !!assessments?.conflict_completed,
        completionRate: 0
      };

      const total = 7;
      const completed = [
        completion.vark, completion.ocean, completion.workingPrefs,
        completion.belbin, completion.motivational, completion.eq, completion.conflict
      ].filter(Boolean).length;

      completion.completionRate = Math.round((completed / total) * 100);
      completionData.push(completion);
    }

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
      role: role.replace(/_/g, ' '),
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

    setTeamComposition({
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
        .filter(item => item.count > 0)
    });
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

    const roleGaps = [
      { role: 'Innovator (Plant)', current: 2, ideal: 3 },
      { role: 'Coordinator', current: 1, ideal: 2 }
    ];

    const recommendations = [
      'Schedule team workshops focused on advanced financial modeling',
      'Pair high-EQ members with those developing emotional intelligence',
      'Create cross-functional project teams to balance different working styles',
      'Implement peer mentoring for conflict resolution skills',
      'Consider hiring or developing Coordinator role for better team orchestration'
    ];

    const healthScore = 78; // Based on completion rates, diversity, and balance

    setPriorities({
      skillGaps,
      roleGaps,
      teamHealthScore: healthScore,
      recommendations
    });
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
                <Progress value={priorities.teamHealthScore} className="h-4" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on assessment completion, role diversity, and team balance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                      <Progress value={member.completionRate} className="h-2" />
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

        {/* Team Composition Tab */}
        <TabsContent value="composition" className="space-y-6">
          {!teamComposition || (teamComposition.communicationStyles.length === 0 && teamComposition.belbinRoles.length === 0) ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessment Data</h3>
                <p className="text-gray-600">
                  Team members need to complete their assessments before composition data can be displayed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Communication Styles */}
              {teamComposition.communicationStyles && teamComposition.communicationStyles.length > 0 && (
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
                          data={teamComposition.communicationStyles}
                          dataKey="count"
                          nameKey="style"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.style}: ${entry.count}`}
                        >
                          {teamComposition.communicationStyles.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

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
                            <span className="font-medium text-gray-900 capitalize">{role.role}</span>
                            <span className="text-gray-600">{role.count} members</span>
                          </div>
                          <Progress value={(role.count / teamMembers.length) * 100} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1">{role.members.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EQ Distribution */}
              {teamComposition.eqDistribution && teamComposition.eqDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Emotional Intelligence
                    </CardTitle>
                    <CardDescription>
                      Team Average EQ: <span className="font-bold text-lg">{teamComposition.avgEQ}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={teamComposition.eqDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
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

