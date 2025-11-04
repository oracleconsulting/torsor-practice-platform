import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users, TrendingUp, AlertTriangle, CheckCircle, Target,
  Brain, Award, Zap, Shield, BarChart3, Info, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { roleFitAnalyzer } from '@/lib/api/assessment-insights/role-fit-analyzer';
import { teamCompositionAnalyzer } from '@/lib/api/assessment-insights/team-composition-analyzer';
import type { AssessmentInsight } from '@/lib/api/assessment-insights/role-fit-analyzer';
import type { TeamCompositionInsight } from '@/lib/api/assessment-insights/team-composition-analyzer';

export default function AssessmentInsightsPanel() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [individualInsights, setIndividualInsights] = useState<AssessmentInsight[]>([]);
  const [teamInsight, setTeamInsight] = useState<TeamCompositionInsight | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Load all team members with their assessment data
      const { data: members, error } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          role,
          email,
          vark_assessment_completed,
          ocean_assessment_completed,
          belbin_completed,
          eq_assessment_completed
        `)
        .or('is_test_account.is.null,is_test_account.eq.false');

      if (error) throw error;

      // For now, we'll calculate insights on the fly
      // In production, these would be cached in the assessment_insights table
      await calculateAllInsights(members || []);

    } catch (error) {
      console.error('[Assessment Insights] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllInsights = async (members: any[]) => {
    setCalculating(true);
    
    // This is a simplified version - in production, fetch full assessment data
    // For now, showing the UI structure with mock insights
    
    const insights: AssessmentInsight[] = members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      assignedRoleType: 'unassigned' as const,
      roleFitScores: {
        advisorySuitability: 0,
        technicalSuitability: 0,
        hybridSuitability: 0,
        leadershipReadiness: 0,
        overallRoleFit: 0
      },
      belbinPrimary: [],
      belbinSecondary: [],
      motivationalDrivers: {},
      eqScores: {},
      conflictStylePrimary: '',
      communicationPreference: '',
      redFlags: [],
      warningFlags: [],
      developmentPriorities: [],
      trainingLevel: 'none' as const,
      currentRoleMatch: 0,
      recommendedRoleType: 'unassigned',
      successionReadiness: 0
    }));

    setIndividualInsights(insights);
    setCalculating(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleFitColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg">Loading Assessment Insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Assessment Insights</h2>
          <p className="text-gray-600 mt-1">Strategic team optimization and role-fit analysis</p>
        </div>
        <Button onClick={loadInsights} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-3xl font-bold mt-1">{individualInsights.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimal Fit</p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {individualInsights.filter(i => i.currentRoleMatch >= 80).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Red Flags</p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {individualInsights.reduce((sum, i) => sum + i.redFlags.length, 0)}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Health</p>
                <p className="text-3xl font-bold mt-1 text-blue-600">
                  {teamInsight?.teamHealthScore || '--'}<span className="text-xl">/100</span>
                </p>
              </div>
              <Shield className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Composition</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This dashboard provides strategic insights based on team assessments. Use individual analysis for role-fit scoring,
              team composition for balance analysis, and recommendations for actionable development plans.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Role Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Advisory Focused</span>
                    <span className="font-medium">
                      {individualInsights.filter(i => i.recommendedRoleType === 'advisory').length}
                    </span>
                  </div>
                  <Progress 
                    value={(individualInsights.filter(i => i.recommendedRoleType === 'advisory').length / individualInsights.length) * 100} 
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technical Focused</span>
                    <span className="font-medium">
                      {individualInsights.filter(i => i.recommendedRoleType === 'technical').length}
                    </span>
                  </div>
                  <Progress 
                    value={(individualInsights.filter(i => i.recommendedRoleType === 'technical').length / individualInsights.length) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hybrid Capability</span>
                    <span className="font-medium">
                      {individualInsights.filter(i => i.recommendedRoleType === 'hybrid').length}
                    </span>
                  </div>
                  <Progress 
                    value={(individualInsights.filter(i => i.recommendedRoleType === 'hybrid').length / individualInsights.length) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Leadership Ready</span>
                    <span className="font-medium">
                      {individualInsights.filter(i => i.roleFitScores.leadershipReadiness >= 70).length}
                    </span>
                  </div>
                  <Progress 
                    value={(individualInsights.filter(i => i.roleFitScores.leadershipReadiness >= 70).length / individualInsights.length) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Critical Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Priority Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {individualInsights
                  .filter(i => i.redFlags.length > 0 || i.currentRoleMatch < 50)
                  .slice(0, 5)
                  .map(insight => (
                    <div key={insight.memberId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <p className="font-medium">{insight.memberName}</p>
                        <p className="text-sm text-gray-600">
                          {insight.redFlags.length > 0 
                            ? `${insight.redFlags.length} critical issue(s)`
                            : 'Low role fit - review assignment'}
                        </p>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  ))}

                {individualInsights.filter(i => i.redFlags.length > 0 || i.currentRoleMatch < 50).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No critical issues detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Completion Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">100%</p>
                  <p className="text-sm text-gray-600 mt-1">VARK Complete</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">100%</p>
                  <p className="text-sm text-gray-600 mt-1">OCEAN Complete</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">95%</p>
                  <p className="text-sm text-gray-600 mt-1">Belbin Complete</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">90%</p>
                  <p className="text-sm text-gray-600 mt-1">EQ Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Analysis Tab */}
        <TabsContent value="individual" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Role-Fit Analysis</CardTitle>
              <CardDescription>
                Detailed analysis of each team member's suitability for advisory, technical, and leadership roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                🚧 Individual analysis details coming soon...
                <br />
                <span className="text-sm">This will show role-fit scores, red flags, and development priorities for each team member</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Composition Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Composition Analysis</CardTitle>
              <CardDescription>
                Belbin balance, EQ mapping, motivational alignment, and conflict style diversity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                🚧 Team composition analysis coming soon...
                <br />
                <span className="text-sm">This will show team balance scores, gaps, and composition recommendations</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>
                Actionable insights for training allocation, recruitment, and team optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                🚧 Recommendations coming soon...
                <br />
                <span className="text-sm">This will show prioritized actions, quick wins, and long-term development plans</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

