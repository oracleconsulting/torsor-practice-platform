import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Implement actual admin stats API
      // For now, show empty/zero state
      setData({
        teamSize: 16, // Your target team size
        assessmentsComplete: 0,
        assessmentsPending: 16,
        averageCompletion: 0,
        totalSkills: 85,
        avgTeamLevel: 0,
        activeGoals: 0,
        criticalGaps: 0,
        serviceLines: [],
        categoryBreakdown: [],
        topGaps: [],
        recentActivity: [],
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Skills Portal Admin</h1>
        <p className="text-muted-foreground mt-1">
          Team assessment progress and service line readiness
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Assessment Progress</CardDescription>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <CardTitle className="text-3xl">{data.assessmentsComplete}</CardTitle>
                <span className="text-muted-foreground mb-1">/ {data.teamSize}</span>
              </div>
              <Progress value={data.averageCompletion} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {data.averageCompletion}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Team Average Level</CardDescription>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{data.avgTeamLevel}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Across {data.totalSkills} skills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Active Goals</CardDescription>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-blue-600">{data.activeGoals}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
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
            <p className="text-sm text-muted-foreground mt-2">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Line Readiness */}
      <Card>
        <CardHeader>
          <CardTitle>Service Line Readiness</CardTitle>
          <CardDescription>
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
                <div className="text-sm text-muted-foreground">
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
            <CardTitle>Category Skill Levels</CardTitle>
            <CardDescription>Average team level by skill category</CardDescription>
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
                <Bar dataKey="avgLevel" fill="#3b82f6" name="Avg Level" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Skill Gaps</CardTitle>
            <CardDescription>Skills requiring immediate development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topGaps.map((gap: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{gap.skill}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Current: {gap.currentAvg.toFixed(1)}</span>
                        <span>Target: {gap.required}</span>
                        <span>Gap: {Math.abs(gap.gap).toFixed(1)}</span>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Interest: {gap.interest}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress value={(gap.currentAvg / 5) * 100} className="h-1.5" />
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={(gap.required / 5) * 100}
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
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest team member actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.member}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

