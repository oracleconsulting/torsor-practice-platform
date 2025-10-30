/**
 * Team Assessments Overview for Admin Portal
 * Shows completion status and summary statistics for all 7 assessments across the team
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { 
  Brain, BookOpen, Briefcase, Users as UsersIcon, Zap, Shield, 
  CheckCircle2, Clock, TrendingUp, Target, AlertCircle
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from 'recharts';

interface TeamMemberAssessment {
  id: string;
  name: string;
  email: string;
  vark: boolean;
  ocean: boolean;
  workingPrefs: boolean;
  belbin: boolean;
  motivational: boolean;
  eq: boolean;
  conflict: boolean;
  total: number;
}

export const TeamAssessmentsOverview: React.FC<{ practiceId: string }> = ({ practiceId }) => {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamMemberAssessment[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    fullyCompleted: 0,
    partiallyCompleted: 0,
    notStarted: 0,
    varkCompleted: 0,
    oceanCompleted: 0,
    workingPrefsCompleted: 0,
    belbinCompleted: 0,
    motivationalCompleted: 0,
    eqCompleted: 0,
    conflictCompleted: 0
  });

  useEffect(() => {
    loadTeamAssessments();
  }, [practiceId]);

  const loadTeamAssessments = async () => {
    setLoading(true);
    try {
      // Get all team members
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('id, name, email, vark_assessment_completed')
        .eq('practice_id', practiceId)
        .order('name');

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setLoading(false);
        return;
      }

      // Check all assessments for all members in parallel
      const assessmentPromises = members.map(async (member) => {
        const [personality, workingPrefs, belbin, motivational, eq, conflict] = await Promise.all([
          supabase.from('personality_assessments').select('id').eq('team_member_id', member.id).single(),
          supabase.from('working_preferences').select('id').eq('practice_member_id', member.id).single(),
          supabase.from('belbin_assessments').select('id').eq('practice_member_id', member.id).single(),
          supabase.from('motivational_drivers').select('id').eq('practice_member_id', member.id).single(),
          supabase.from('eq_assessments').select('id').eq('practice_member_id', member.id).single(),
          supabase.from('conflict_style_assessments').select('id').eq('practice_member_id', member.id).single()
        ]);

        const completion = {
          vark: member.vark_assessment_completed || false,
          ocean: !!personality.data,
          workingPrefs: !!workingPrefs.data,
          belbin: !!belbin.data,
          motivational: !!motivational.data,
          eq: !!eq.data,
          conflict: !!conflict.data
        };

        const total = Object.values(completion).filter(Boolean).length;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          ...completion,
          total
        };
      });

      const assessments = await Promise.all(assessmentPromises);
      setTeamData(assessments);

      // Calculate stats
      const totalMembers = assessments.length;
      const fullyCompleted = assessments.filter(a => a.total === 7).length;
      const partiallyCompleted = assessments.filter(a => a.total > 0 && a.total < 7).length;
      const notStarted = assessments.filter(a => a.total === 0).length;

      setStats({
        totalMembers,
        fullyCompleted,
        partiallyCompleted,
        notStarted,
        varkCompleted: assessments.filter(a => a.vark).length,
        oceanCompleted: assessments.filter(a => a.ocean).length,
        workingPrefsCompleted: assessments.filter(a => a.workingPrefs).length,
        belbinCompleted: assessments.filter(a => a.belbin).length,
        motivationalCompleted: assessments.filter(a => a.motivational).length,
        eqCompleted: assessments.filter(a => a.eq).length,
        conflictCompleted: assessments.filter(a => a.conflict).length
      });

      console.log('[TeamAssessments] Loaded assessments for', totalMembers, 'members');
    } catch (error) {
      console.error('[TeamAssessments] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionChartData = [
    { name: 'VARK', completed: stats.varkCompleted, total: stats.totalMembers },
    { name: 'OCEAN', completed: stats.oceanCompleted, total: stats.totalMembers },
    { name: 'Working Prefs', completed: stats.workingPrefsCompleted, total: stats.totalMembers },
    { name: 'Belbin', completed: stats.belbinCompleted, total: stats.totalMembers },
    { name: 'Motivational', completed: stats.motivationalCompleted, total: stats.totalMembers },
    { name: 'EQ', completed: stats.eqCompleted, total: stats.totalMembers },
    { name: 'Conflict', completed: stats.conflictCompleted, total: stats.totalMembers }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team assessments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Team Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
              <UsersIcon className="w-10 h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fully Complete</p>
                <p className="text-3xl font-bold text-green-600">{stats.fullyCompleted}</p>
                <p className="text-xs text-gray-500">{Math.round((stats.fullyCompleted / stats.totalMembers) * 100)}% of team</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partially Complete</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.partiallyCompleted}</p>
                <p className="text-xs text-gray-500">{Math.round((stats.partiallyCompleted / stats.totalMembers) * 100)}% of team</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Started</p>
                <p className="text-3xl font-bold text-red-600">{stats.notStarted}</p>
                <p className="text-xs text-gray-500">{Math.round((stats.notStarted / stats.totalMembers) * 100)}% of team</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Completion by Type</CardTitle>
          <CardDescription>Number of team members who have completed each assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
              <Bar dataKey="total" fill="#e5e7eb" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Member Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Assessment Status</CardTitle>
          <CardDescription>Individual completion status for all assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamData.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      member.total === 7 ? 'bg-green-600' :
                      member.total >= 4 ? 'bg-blue-600' :
                      member.total >= 2 ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }>
                      {member.total}/7 Complete
                    </Badge>
                  </div>
                </div>
                <Progress value={(member.total / 7) * 100} className="mb-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  <div className={`text-center p-2 rounded ${member.vark ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <BookOpen className={`w-4 h-4 mx-auto mb-1 ${member.vark ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">VARK</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.ocean ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <Brain className={`w-4 h-4 mx-auto mb-1 ${member.ocean ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">OCEAN</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.workingPrefs ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <Briefcase className={`w-4 h-4 mx-auto mb-1 ${member.workingPrefs ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">Working</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.belbin ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <UsersIcon className={`w-4 h-4 mx-auto mb-1 ${member.belbin ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">Belbin</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.motivational ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <Zap className={`w-4 h-4 mx-auto mb-1 ${member.motivational ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">Motiv</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.eq ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <Brain className={`w-4 h-4 mx-auto mb-1 ${member.eq ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">EQ</p>
                  </div>
                  <div className={`text-center p-2 rounded ${member.conflict ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border`}>
                    <Shield className={`w-4 h-4 mx-auto mb-1 ${member.conflict ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-xs font-medium text-gray-900">Conflict</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAssessmentsOverview;

