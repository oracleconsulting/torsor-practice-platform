import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Edit,
  Plus,
  ArrowRight,
  Target,
  Calendar,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface TeamMemberStats {
  totalSkills: number;
  assessedSkills: number;
  averageLevel: number;
  cpdHours: number;
  cpdActivities: number;
  mentoringActive: boolean;
}

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const { practiceMember } = useAccountancyContext();
  
  const [stats, setStats] = useState<TeamMemberStats>({
    totalSkills: 0,
    assessedSkills: 0,
    averageLevel: 0,
    cpdHours: 0,
    cpdActivities: 0,
    mentoringActive: false
  });
  const [loading, setLoading] = useState(true);
  const [recentCPD, setRecentCPD] = useState<any[]>([]);

  useEffect(() => {
    if (practiceMember?.id) {
      loadDashboardData();
    }
  }, [practiceMember?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get skill assessments
      const { data: assessments, error: assessError } = await supabase
        .from('skill_assessments')
        .select('current_level, skill_id')
        .eq('team_member_id', practiceMember?.id);

      // Get total skills count
      const { count: totalSkillsCount } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true });

      // Get CPD activities
      const { data: cpdData, error: cpdError } = await supabase
        .from('cpd_activities')
        .select('hours_claimed, activity_date, title, activity_type')
        .eq('practice_member_id', practiceMember?.id)
        .order('activity_date', { ascending: false })
        .limit(5);

      // Calculate stats
      const assessedCount = assessments?.length || 0;
      const avgLevel = assessments?.reduce((sum, a) => sum + (a.current_level || 0), 0) / (assessedCount || 1);
      const totalHours = cpdData?.reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;

      setStats({
        totalSkills: totalSkillsCount || 0,
        assessedSkills: assessedCount,
        averageLevel: avgLevel,
        cpdHours: totalHours,
        cpdActivities: cpdData?.length || 0,
        mentoringActive: false // TODO: Check mentoring status
      });

      setRecentCPD(cpdData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = (stats.assessedSkills / Math.max(stats.totalSkills, 1)) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {practiceMember?.name || 'Team Member'}!
          </h1>
          <p className="text-gray-600">
            Here's your personal development overview
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Skills Assessed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.assessedSkills}
                    <span className="text-lg text-gray-500">/{stats.totalSkills}</span>
                  </p>
                </div>
                <Target className="h-10 w-10 text-amber-600" />
              </div>
              <Progress value={completionPercentage} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Level</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.averageLevel.toFixed(1)}
                    <span className="text-lg text-gray-500">/5</span>
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">CPD Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.cpdHours}</p>
                </div>
                <Award className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.cpdActivities} activities logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mentoring</p>
                  <Badge variant={stats.mentoringActive ? 'default' : 'secondary'}>
                    {stats.mentoringActive ? 'Active' : 'Not Active'}
                  </Badge>
                </div>
                <Users className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Skills */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>My Skills Assessment</CardTitle>
                    <CardDescription>
                      View and update your skill levels
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Completion</span>
                  <span className="font-bold text-gray-900">{completionPercentage.toFixed(0)}%</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate('/accountancy/team/skills-assessment')}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Assessment
                  </Button>
                  <Button 
                    onClick={() => navigate('/accountancy/team/skills-dashboard')}
                    variant="outline"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My CPD */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>My CPD</CardTitle>
                    <CardDescription>
                      Log and track your professional development
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Total Hours</span>
                  <span className="font-bold text-gray-900">{stats.cpdHours} hrs</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate('/accountancy/team-member/cpd/log')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log CPD
                  </Button>
                  <Button 
                    onClick={() => navigate('/accountancy/team-member/cpd')}
                    variant="outline"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mentoring */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Mentoring</CardTitle>
                    <CardDescription>
                      Connect with mentors and peers
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Status</span>
                  <Badge variant={stats.mentoringActive ? 'default' : 'secondary'}>
                    {stats.mentoringActive ? 'Active' : 'Available'}
                  </Badge>
                </div>
                <Button 
                  onClick={() => navigate('/accountancy/team-portal/mentoring')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  View Opportunities
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Knowledge Base</CardTitle>
                    <CardDescription>
                      Access resources and leadership library
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  Books, guides, articles, and training materials
                </div>
                <Button 
                  onClick={() => navigate('/accountancy/team/knowledge-base')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Browse Resources
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent CPD Activity */}
        {recentCPD.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent CPD Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCPD.map((cpd, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{cpd.title || 'CPD Activity'}</p>
                        <p className="text-sm text-gray-600">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(cpd.activity_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{cpd.hours_claimed} hrs</p>
                      <Badge variant="outline" className="text-xs">
                        {cpd.activity_type || 'Training'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

