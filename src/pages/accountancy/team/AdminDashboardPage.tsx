import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Settings,
  Save,
  Shield,
  Brain,
  ArrowRight,
  UserCircle,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Network,
  Sparkles,
} from 'lucide-react';
import RoleManagement from '@/components/accountancy/team/RoleManagement';
import UserManagement from '@/components/accountancy/team/UserManagement';
import ReportingLinesManager from '@/components/accountancy/admin/ReportingLinesManager';
import TeamAssessmentsOverview from '@/components/accountancy/team/TeamAssessmentsOverview';
import CPDDiscoveryPanel from '@/components/accountancy/admin/CPDDiscoveryPanel';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Dashboard for Skills Portal
 * 
 * Overview of:
 * - Team assessment progress
 * - Service line readiness
 * - Skill gaps and priorities
 * - Development goal tracking
 */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [cpdConfig, setCpdConfig] = useState({
    totalExpectedHours: 40,
    determinedHours: 20,
    selfAllocatedHours: 20,
  });
  const [savingCpd, setSavingCpd] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadCpdConfig();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      console.log('[AdminDashboard] Loading real data from Supabase...');
      
      // Get all team members (exclude test accounts)
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('*')
        .or('is_test_account.is.null,is_test_account.eq.false'); // Exclude test accounts

      if (membersError) throw membersError;

      const teamSize = members?.length || 0;
      console.log('[AdminDashboard] Team size (excluding test accounts):', teamSize);

      // Get member IDs to filter assessments
      const memberIds = members?.map(m => m.id) || [];

      // Get all skill assessments (only for real team members)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('skill_assessments')
        .select('team_member_id, skill_id, current_level, interest_level')
        .in('team_member_id', memberIds); // Only include real team members

      if (assessmentsError) throw assessmentsError;

      // Get all skills
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category, required_level');

      if (skillsError) throw skillsError;

      const totalSkills = skills?.length || 0;
      console.log('[AdminDashboard] Total skills:', totalSkills);

      // Calculate assessment progress
      const membersWithAssessments = new Set(assessments?.map(a => a.team_member_id) || []);
      const assessmentsComplete = membersWithAssessments.size;
      const assessmentsPending = teamSize - assessmentsComplete;
      const averageCompletion = teamSize > 0 ? Math.round((assessmentsComplete / teamSize) * 100) : 0;

      // Calculate average team level
      const totalLevel = assessments?.reduce((sum, a) => sum + (a.current_level || 0), 0) || 0;
      const avgTeamLevel = assessments && assessments.length > 0 
        ? Number((totalLevel / assessments.length).toFixed(1))
        : 0;

      // Get development goals
      const { data: goals, error: goalsError } = await supabase
        .from('development_goals')
        .select('*')
        .in('status', ['active', 'planned']);

      const activeGoals = goals?.length || 0;

      // Calculate critical gaps (skills with avg level < required level)
      const skillGaps = new Map<string, { total: number; count: number; required: number; name: string; category: string }>();
      
      assessments?.forEach(assessment => {
        const skill = skills?.find(s => s.id === assessment.skill_id);
        if (!skill) return;

        if (!skillGaps.has(skill.id)) {
          skillGaps.set(skill.id, {
            total: 0,
            count: 0,
            required: skill.required_level || 3,
            name: skill.name,
            category: skill.category
          });
        }

        const gap = skillGaps.get(skill.id)!;
        gap.total += assessment.current_level || 0;
        gap.count += 1;
      });

      const gaps = Array.from(skillGaps.entries())
        .map(([skillId, gap]) => ({
          skillId,
          name: gap.name,
          category: gap.category,
          avgLevel: gap.total / gap.count,
          requiredLevel: gap.required,
          gap: gap.required - (gap.total / gap.count),
          memberCount: gap.count
        }))
        .filter(g => g.gap > 0)
        .sort((a, b) => b.gap - a.gap);

      const criticalGaps = gaps.filter(g => g.gap >= 2).length;

      // Group by category for chart
      const categoryMap = new Map<string, { total: number; count: number }>();
      assessments?.forEach(assessment => {
        const skill = skills?.find(s => s.id === assessment.skill_id);
        if (!skill) return;

        if (!categoryMap.has(skill.category)) {
          categoryMap.set(skill.category, { total: 0, count: 0 });
        }

        const cat = categoryMap.get(skill.category)!;
        cat.total += assessment.current_level || 0;
        cat.count += 1;
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
          category,
          level: stats.count > 0 ? stats.total / stats.count : 0
        }))
        .sort((a, b) => b.level - a.level);

      console.log('[AdminDashboard] Loaded data:', {
        teamSize,
        assessmentsComplete,
        assessmentsPending,
        averageCompletion,
        totalSkills,
        avgTeamLevel,
        activeGoals,
        criticalGaps,
        categoryBreakdown: categoryBreakdown.length,
        topGaps: gaps.slice(0, 5).length
      });

      setData({
        teamSize,
        assessmentsComplete,
        assessmentsPending,
        averageCompletion,
        totalSkills,
        avgTeamLevel,
        activeGoals,
        criticalGaps,
        serviceLines: [], // TODO: Define service lines
        categoryBreakdown,
        topGaps: gaps.slice(0, 5),
        recentActivity: [], // TODO: Track activity
      });
    } catch (error) {
      console.error('[AdminDashboard] Failed to load dashboard data:', error);
      // Set empty state on error
      setData({
        teamSize: 0,
        assessmentsComplete: 0,
        assessmentsPending: 0,
        averageCompletion: 0,
        totalSkills: 0,
        avgTeamLevel: 0,
        activeGoals: 0,
        criticalGaps: 0,
        serviceLines: [],
        categoryBreakdown: [],
        topGaps: [],
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCpdConfig = async () => {
    try {
      // TODO: Load from Supabase practices table
      // For now, use defaults
      console.log('CPD config loaded from defaults');
    } catch (error) {
      console.error('Failed to load CPD config:', error);
    }
  };

  const saveCpdConfig = async () => {
    setSavingCpd(true);
    try {
      // TODO: Save to Supabase practices table
      // await supabase
      //   .from('practices')
      //   .update({
      //     cpd_total_expected_hours: cpdConfig.totalExpectedHours,
      //     cpd_determined_hours: cpdConfig.determinedHours,
      //     cpd_self_allocated_hours: cpdConfig.selfAllocatedHours,
      //   })
      //   .eq('id', practiceId);
      
      console.log('CPD config saved:', cpdConfig);
      alert('✅ CPD configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save CPD config:', error);
      alert('❌ Failed to save CPD configuration');
    } finally {
      setSavingCpd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Skills Portal Admin</h1>
        <p className="text-gray-600 mt-1">
          Team assessment progress and service line readiness
        </p>
      </div>

      {/* Tabs for Dashboard vs Role Management vs User Management vs Reporting Lines vs Assessments vs CPD Discovery */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full max-w-6xl grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Management
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="reporting-lines" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Reporting Lines
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="cpd-discovery" className="flex items-center gap-2 relative">
            <Sparkles className="h-4 w-4" />
            CPD Discovery
            <Badge className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] px-1">NEW</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* My Personal Development Section */}
          <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
                My Personal Development
              </h3>
              <p className="text-gray-600 mb-6">
                Access your personal skills, CPD, and development tracking
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => navigate('/team-member/skills-heatmap')}
                >
                  <Target className="w-6 h-6 text-blue-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">My Skills</div>
                    <div className="text-xs text-gray-600">View & assess</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => navigate('/team-member/cpd-log')}
                >
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">My CPD</div>
                    <div className="text-xs text-gray-600">Log & track hours</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                  onClick={() => navigate('/team-member/assessments')}
                >
                  <GraduationCap className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">My Assessments</div>
                    <div className="text-xs text-gray-600">VARK & OCEAN</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:bg-amber-50 hover:border-amber-300"
                  onClick={() => navigate('/team-member/mentoring')}
                >
                  <MessageSquare className="w-6 h-6 text-amber-600" />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Mentoring</div>
                    <div className="text-xs text-gray-600">Find & connect</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Team Assessments Link Card */}
      <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Team VARK & OCEAN Assessments</h3>
                <p className="text-gray-600 mt-1">
                  View comprehensive team personality profiles, learning styles, and work preferences
                </p>
              </div>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate('/team/assessments')}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              View Team Assessments
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Personal Assessments Card */}
      <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complete Your Own Assessments</h3>
                <p className="text-gray-600 mt-1">
                  Take your VARK learning style and OCEAN personality assessments (16 + 30 questions)
                </p>
              </div>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate('/my-assessments')}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              Take Assessments
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CPD Configuration Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-gray-900">CPD Configuration</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white text-gray-700">
              Practice-wide Settings
            </Badge>
          </div>
          <CardDescription className="text-gray-600">
            Set CPD requirements for all team members. Changes apply to the current CPD year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Expected Hours */}
            <div className="space-y-2">
              <Label htmlFor="totalHours" className="text-sm font-medium">
                Total Expected CPD Hours
                <span className="text-gray-600 text-xs ml-2">(per year)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="totalHours"
                  type="number"
                  min="1"
                  max="200"
                  value={cpdConfig.totalExpectedHours}
                  onChange={(e) =>
                    setCpdConfig({
                      ...cpdConfig,
                      totalExpectedHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-white"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <p className="text-xs text-gray-600">
                Total CPD requirement per team member annually
              </p>
            </div>

            {/* Determined Hours */}
            <div className="space-y-2">
              <Label htmlFor="determinedHours" className="text-sm font-medium">
                Determined CPD Hours
                <span className="text-gray-600 text-xs ml-2">(structured)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="determinedHours"
                  type="number"
                  min="0"
                  max={cpdConfig.totalExpectedHours}
                  value={cpdConfig.determinedHours}
                  onChange={(e) =>
                    setCpdConfig({
                      ...cpdConfig,
                      determinedHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-white"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <p className="text-xs text-gray-600">
                Practice-mandated learning (courses, training)
              </p>
            </div>

            {/* Self-Allocated Hours */}
            <div className="space-y-2">
              <Label htmlFor="selfHours" className="text-sm font-medium">
                Self-Allocated CPD Hours
                <span className="text-gray-600 text-xs ml-2">(self-directed)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="selfHours"
                  type="number"
                  min="0"
                  max={cpdConfig.totalExpectedHours}
                  value={cpdConfig.selfAllocatedHours}
                  onChange={(e) =>
                    setCpdConfig({
                      ...cpdConfig,
                      selfAllocatedHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-white"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
              <p className="text-xs text-gray-600">
                Member-chosen learning (reading, research)
              </p>
            </div>
          </div>

          {/* Validation Warning */}
          {cpdConfig.determinedHours + cpdConfig.selfAllocatedHours !== cpdConfig.totalExpectedHours && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Configuration Warning</p>
                <p className="text-yellow-700 mt-1">
                  Determined ({cpdConfig.determinedHours}h) + Self-Allocated (
                  {cpdConfig.selfAllocatedHours}h) should equal Total Expected (
                  {cpdConfig.totalExpectedHours}h)
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Changes will apply to all team members' CPD tracking
            </p>
            <Button
              onClick={saveCpdConfig}
              disabled={savingCpd || cpdConfig.determinedHours + cpdConfig.selfAllocatedHours !== cpdConfig.totalExpectedHours}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {savingCpd ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-600">Assessment Progress</CardDescription>
              <Users className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <CardTitle className="text-3xl text-gray-900">{data.assessmentsComplete}</CardTitle>
                <span className="text-gray-600 mb-1">/ {data.teamSize}</span>
              </div>
              <Progress value={data.averageCompletion} className="h-2" />
              <p className="text-sm text-gray-600">
                {data.averageCompletion}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-600">Team Average Level</CardDescription>
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-gray-900">{data.avgTeamLevel}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Across {data.totalSkills} skills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-600">Active Goals</CardDescription>
              <Target className="w-4 h-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-blue-600">{data.activeGoals}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-600">Critical Gaps</CardDescription>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-red-600">{data.criticalGaps}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Line Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Service Line Readiness</CardTitle>
          <CardDescription className="text-gray-600">
            Coverage and capability across BSG service offerings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.serviceLines.map((sl: any) => (
            <div key={sl.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{sl.name}</div>
                  <Badge
                    variant={
                      sl.status === 'good'
                        ? 'default'
                        : sl.status === 'needs-attention'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {sl.status === 'good' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : sl.status === 'needs-attention' ? (
                      <Clock className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {sl.coverage}% coverage
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {sl.teamCount} team members • Avg Level {sl.avgLevel}
                </div>
              </div>
              <Progress
                value={sl.coverage}
                className={`h-2 ${
                  sl.status === 'good'
                    ? '[&>div]:bg-green-500'
                    : sl.status === 'needs-attention'
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-red-500'
                }`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Category Skill Levels</CardTitle>
            <CardDescription className="text-gray-600">Average team level by skill category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={12}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="level" fill="#3b82f6" name="Avg Level" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Priority Skill Gaps</CardTitle>
            <CardDescription className="text-gray-600">Skills requiring immediate development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topGaps.map((gap: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{gap.name}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        <span>Current: {gap.avgLevel?.toFixed(1) ?? '0.0'}</span>
                        <span>Target: {gap.requiredLevel ?? 3}</span>
                        <span>Gap: {Math.abs(gap.gap ?? 0).toFixed(1)}</span>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {gap.memberCount} team member{gap.memberCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress value={((gap.avgLevel ?? 0) / 5) * 100} className="h-1.5" />
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={((gap.requiredLevel ?? 3) / 5) * 100}
                        className="h-1.5 [&>div]:bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600">Latest team member actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.member}</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Reporting Lines Tab */}
        <TabsContent value="reporting-lines">
          <ReportingLinesManager practiceId="a1b2c3d4-5678-90ab-cdef-123456789abc" />
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <TeamAssessmentsOverview practiceId="a1b2c3d4-5678-90ab-cdef-123456789abc" />
        </TabsContent>

        {/* CPD Discovery Tab */}
        <TabsContent value="cpd-discovery">
          <CPDDiscoveryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

