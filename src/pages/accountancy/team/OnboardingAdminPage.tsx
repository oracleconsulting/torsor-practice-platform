/**
 * OnboardingAdmin Page
 * PROMPT 6: Onboarding Checklist System
 * 
 * Admin dashboard for onboarding metrics and management
 */

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, AlertCircle, Award, CheckCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// API
import {
  getAdminDashboardData,
  getLeaderboard,
  type OnboardingAdminDashboard
} from '@/lib/api/onboarding';

const OnboardingAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<OnboardingAdminDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // Mock practice ID (replace with actual practice context)
  const practiceId = 'practice-456';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const [dashboard, leaderboardData] = await Promise.all([
        getAdminDashboardData(practiceId),
        getLeaderboard(practiceId, 'all_time')
      ]);

      setDashboardData(dashboard);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      // Set empty data to prevent infinite loading
      setDashboardData(null);
      setLeaderboard(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding metrics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p>No onboarding data available.</p>
      </div>
    );
  }

  const stuckSteps = [
    { step: 1, rate: dashboardData.step_1_completion_rate, name: 'Profile Completion' },
    { step: 2, rate: dashboardData.step_2_completion_rate, name: 'Skills Assessment' },
    { step: 3, rate: dashboardData.step_3_completion_rate, name: 'VARK Assessment' },
    { step: 4, rate: dashboardData.step_4_completion_rate, name: 'CPD Review' },
    { step: 5, rate: dashboardData.step_5_completion_rate, name: 'Mentor Assignment' },
    { step: 6, rate: dashboardData.step_6_completion_rate, name: 'Development Plan' },
    { step: 7, rate: dashboardData.step_7_completion_rate, name: 'Team Introduction' }
  ].sort((a, b) => a.rate - b.rate); // Lowest completion rate first

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor onboarding completion rates, identify stuck points, and track engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{dashboardData.total_members}</div>
                <p className="text-xs text-muted-foreground mt-1">In onboarding</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(dashboardData.completion_rate)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.completed_count} completed
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={dashboardData.completion_rate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* Avg Time to Complete */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {Math.round(dashboardData.avg_time_minutes / 60)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(dashboardData.avg_time_minutes % 60)}m average
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardData.in_progress_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.not_started_count} not started
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stuck-points">Stuck Points</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Step Completion Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Completion Rates</CardTitle>
              <CardDescription>
                See how many members have completed each onboarding step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: 1, name: 'Profile Completion', rate: dashboardData.step_1_completion_rate },
                  { step: 2, name: 'Skills Assessment', rate: dashboardData.step_2_completion_rate },
                  { step: 3, name: 'VARK Assessment', rate: dashboardData.step_3_completion_rate },
                  { step: 4, name: 'CPD Review', rate: dashboardData.step_4_completion_rate },
                  { step: 5, name: 'Mentor Assignment', rate: dashboardData.step_5_completion_rate },
                  { step: 6, name: 'Development Plan', rate: dashboardData.step_6_completion_rate },
                  { step: 7, name: 'Team Introduction', rate: dashboardData.step_7_completion_rate }
                ].map((step) => (
                  <div key={step.step} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Step {step.step}: {step.name}</span>
                      <span className="text-muted-foreground">{Math.round(step.rate)}%</span>
                    </div>
                    <Progress value={step.rate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Avg Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Average Progress</CardTitle>
              <CardDescription>
                Overall completion percentage across all members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={dashboardData.avg_completion_percentage} className="h-4" />
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(dashboardData.avg_completion_percentage)}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Average points earned: {Math.round(dashboardData.avg_points)} / 700
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stuck Points Tab */}
        <TabsContent value="stuck-points" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle>Identified Stuck Points</CardTitle>
              </div>
              <CardDescription>
                Steps where members are having the most difficulty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stuckSteps.slice(0, 3).map((step, idx) => (
                  <div
                    key={step.step}
                    className="p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={idx === 0 ? 'destructive' : 'secondary'}>
                            {idx === 0 ? 'Highest Priority' : `Priority ${idx + 1}`}
                          </Badge>
                          <span className="font-semibold">Step {step.step}</span>
                        </div>
                        <h4 className="font-medium text-lg mb-1">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Only {Math.round(step.rate)}% completion rate
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Recommendations:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Review step instructions for clarity</li>
                            <li>Send targeted reminder emails</li>
                            <li>Offer 1-on-1 assistance</li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-orange-600">
                        {Math.round(step.rate)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Items */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Suggested Actions:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Schedule check-in calls with members stuck for 7+ days</li>
                  <li>Create FAQ documentation for common issues</li>
                  <li>Assign buddy/mentor to help with stuck steps</li>
                  <li>Review and simplify step requirements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <CardTitle>Top Performers</CardTitle>
              </div>
              <CardDescription>
                Members with the highest points and fastest completion times
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard && leaderboard.rankings && leaderboard.rankings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.rankings.map((entry: any) => (
                      <TableRow key={entry.member_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 && <span className="text-xl">🥇</span>}
                            {entry.rank === 2 && <span className="text-xl">🥈</span>}
                            {entry.rank === 3 && <span className="text-xl">🥉</span>}
                            {entry.rank > 3 && <span className="font-semibold">#{entry.rank}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{entry.member_name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{entry.points} pts</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Math.floor(entry.completion_time_minutes / 60)}h{' '}
                          {entry.completion_time_minutes % 60}m
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No completed onboardings yet</p>
                  <p className="text-sm mt-1">Leaderboard will appear once members complete onboarding</p>
                </div>
              )}

              {/* Stats */}
              {leaderboard && (
                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {leaderboard.total_participants}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round((leaderboard.average_completion_time_minutes || 0) / 60)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Average Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round((leaderboard.fastest_completion_minutes || 0) / 60)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Fastest Time</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OnboardingAdminPage;

