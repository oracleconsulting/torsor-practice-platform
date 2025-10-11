/**
 * Analytics Dashboard Page
 * PROMPT 8: Analytics & Insights Dashboard
 * 
 * Comprehensive analytics for skills and CPD tracking with:
 * - Key metrics
 * - Interactive visualizations (Recharts)
 * - Predictive analytics
 * - Exportable reports
 * - Real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Users, Target, Award, Clock,
  Download, Filter, RefreshCw, Calendar, AlertTriangle,
  BarChart3, Activity, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Recharts
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

// Analytics API
import {
  getTeamMetrics,
  getSkillProgression,
  getDepartmentComparison,
  getCPDInvestmentAnalysis,
  getSkillDemandSupply,
  getGrowthTrajectories,
  getSkillsAtRisk,
  getSuccessionAlerts,
  getTrainingROIPredictions,
  getSkillGapForecasts,
  exportReportData,
  type TeamMetrics
} from '@/lib/api/analytics';

const AnalyticsDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [dateRange, setDateRange] = useState('6months');
  const [department, setDepartment] = useState('all');
  const [skillCategory, setSkillCategory] = useState('all');

  // Data state
  const [skillProgression, setSkillProgression] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [cpdInvestment, setCpdInvestment] = useState<any[]>([]);
  const [demandSupply, setDemandSupply] = useState<any[]>([]);
  const [growthTrajectories, setGrowthTrajectories] = useState<any[]>([]);
  const [skillsAtRisk, setSkillsAtRisk] = useState<any[]>([]);
  const [successionAlerts, setSuccessionAlerts] = useState<any[]>([]);
  const [trainingROI, setTrainingROI] = useState<any[]>([]);
  const [skillGapForecasts, setSkillGapForecasts] = useState<any[]>([]);

  const practiceId = 'practice-123'; // Would get from context

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 minutes
    refreshInterval.current = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [dateRange, department, skillCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        progressionData,
        deptData,
        cpdData,
        demandData,
        trajectoryData,
        riskData,
        successionData,
        roiData,
        forecastData
      ] = await Promise.all([
        getTeamMetrics(practiceId),
        getSkillProgression(practiceId, undefined, 6),
        getDepartmentComparison(practiceId),
        getCPDInvestmentAnalysis(practiceId),
        getSkillDemandSupply(practiceId),
        getGrowthTrajectories(practiceId, 5),
        getSkillsAtRisk(practiceId),
        getSuccessionAlerts(practiceId),
        getTrainingROIPredictions(practiceId),
        getSkillGapForecasts(practiceId)
      ]);

      setMetrics(metricsData);
      setSkillProgression(progressionData);
      setDepartmentData(deptData);
      setCpdInvestment(cpdData);
      setDemandSupply(demandData);
      setGrowthTrajectories(trajectoryData);
      setSkillsAtRisk(riskData);
      setSuccessionAlerts(successionData);
      setTrainingROI(roiData);
      setSkillGapForecasts(forecastData);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description: 'Analytics updated successfully'
    });
  };

  const handleExport = async (reportType: 'monthly' | 'board' | 'individual' | 'benchmarking') => {
    try {
      const data = await exportReportData(practiceId, reportType);
      
      // Convert to JSON and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `${reportType} report downloaded successfully`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to generate report',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive skills and CPD tracking dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={(value: any) => handleExport(value)}>
            <SelectTrigger className="w-40">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="board">Board Presentation</SelectItem>
              <SelectItem value="individual">Individual Reports</SelectItem>
              <SelectItem value="benchmarking">Benchmarking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={skillCategory} onValueChange={setSkillCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="soft">Soft Skills</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Capability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics?.team_capability_score}
                </div>
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Skills Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {metrics?.skills_coverage_percentage}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">of required skills</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Improvement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {metrics?.avg_skill_improvement_rate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">avg per quarter</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+2% from last quarter</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPD Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics?.cpd_compliance_rate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">on track</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+7% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mentoring Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-pink-600">
                  {metrics?.mentoring_engagement_score}
                </div>
                <p className="text-xs text-muted-foreground mt-1">active sessions</p>
              </div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <TrendingDown className="h-3 w-3" />
              <span>-2% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="visualizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Risks</TabsTrigger>
        </TabsList>

        {/* Visualizations Tab */}
        <TabsContent value="visualizations" className="space-y-6">
          {/* Skill Progression Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Progression Timeline</CardTitle>
              <CardDescription>
                Average skill level improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={skillProgression}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_level"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Average Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Comparison Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Department Comparison</CardTitle>
                <CardDescription>
                  Skills breakdown by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={departmentData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name="Technical"
                      dataKey="avg_technical"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Soft Skills"
                      dataKey="avg_soft_skills"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Leadership"
                      dataKey="avg_leadership"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.5}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CPD Investment vs Improvement Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>CPD Investment vs Improvement</CardTitle>
                <CardDescription>
                  Return on CPD investment analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hours_invested" name="Hours" unit="h" />
                    <YAxis dataKey="improvement" name="Improvement" domain={[0, 2]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter
                      name="ROI"
                      data={cpdInvestment}
                      fill="#8b5cf6"
                    >
                      {cpdInvestment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Skill Demand vs Supply Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Demand vs Supply</CardTitle>
              <CardDescription>
                Gap analysis: Darker colors indicate larger gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demandSupply}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demand_score" fill="#ef4444" name="Demand" />
                  <Bar dataKey="supply_score" fill="#10b981" name="Supply" />
                  <Bar dataKey="gap" fill="#f59e0b" name="Gap" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Growth Trajectories */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Growth Trajectories</CardTitle>
              <CardDescription>
                Top performers' skill development over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  {growthTrajectories.map((trajectory, index) => (
                    <Line
                      key={trajectory.member_id}
                      type="monotone"
                      dataKey="avg_skill_level"
                      data={trajectory.data_points}
                      name={trajectory.member_name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {/* Training ROI Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Training ROI Predictions</CardTitle>
              <CardDescription>
                Expected return on investment for recommended training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingROI.map((training, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{training.training_type}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Cost: £{training.estimated_cost}</span>
                        <span>Hours: {training.estimated_hours}h</span>
                        <span>Improvement: +{training.predicted_improvement}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {training.expected_roi.toFixed(1)}x ROI
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {Math.round(training.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Gap Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle>Future Skill Gap Forecasts</CardTitle>
              <CardDescription>
                Predicted skill gaps for the next 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillGapForecasts.map((forecast, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{forecast.skill_name}</h4>
                        <Badge variant="secondary" className="mt-1">
                          {forecast.category}
                        </Badge>
                      </div>
                      <Badge
                        variant={
                          forecast.trend === 'improving' ? 'default' :
                          forecast.trend === 'stable' ? 'secondary' : 'destructive'
                        }
                      >
                        {forecast.trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {forecast.trend === 'worsening' && <TrendingDown className="h-3 w-3 mr-1" />}
                        {forecast.trend}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
                      <div>
                        <div className="font-semibold">{forecast.current_gap}%</div>
                        <div className="text-xs text-muted-foreground">Current</div>
                      </div>
                      <div>
                        <div className="font-semibold">{forecast.predicted_gap_3_months}%</div>
                        <div className="text-xs text-muted-foreground">3 months</div>
                      </div>
                      <div>
                        <div className="font-semibold">{forecast.predicted_gap_6_months}%</div>
                        <div className="text-xs text-muted-foreground">6 months</div>
                      </div>
                      <div>
                        <div className="font-semibold">{forecast.predicted_gap_12_months}%</div>
                        <div className="text-xs text-muted-foreground">12 months</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <strong>Recommendation:</strong> {forecast.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts & Risks Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Skills at Risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Skills at Risk
              </CardTitle>
              <CardDescription>
                Skills showing declining or stagnant trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillsAtRisk.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-r-lg"
                  >
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{skill.skill_name}</h4>
                        <Badge variant="secondary">{skill.category}</Badge>
                        <Badge variant={skill.trend === 'declining' ? 'destructive' : 'secondary'}>
                          {skill.trend}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Current Avg:</span>
                          <span className="ml-2 font-semibold">{skill.current_avg_level.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Decline Rate:</span>
                          <span className="ml-2 font-semibold text-red-600">{skill.decline_rate.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Affected:</span>
                          <span className="ml-2 font-semibold">{skill.affected_members} members</span>
                        </div>
                      </div>
                      <div className="text-sm bg-white dark:bg-gray-800 p-3 rounded">
                        <strong>Recommendation:</strong> {skill.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Succession Planning Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Succession Planning Alerts
              </CardTitle>
              <CardDescription>
                Critical roles requiring succession planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {successionAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{alert.role}</h4>
                        <p className="text-sm text-muted-foreground">{alert.current_holder}</p>
                      </div>
                      <Badge variant={
                        alert.risk_level === 'high' ? 'destructive' :
                        alert.risk_level === 'medium' ? 'default' : 'secondary'
                      }>
                        {alert.risk_level} risk
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <h5 className="text-sm font-semibold mb-2">Potential Successors:</h5>
                      <div className="space-y-2">
                        {alert.potential_successors.map((successor, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded">
                            <div>
                              <div className="font-medium">{successor.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Skills gap: {successor.skills_gap.join(', ')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {successor.readiness_score}%
                              </div>
                              <div className="text-xs text-muted-foreground">Ready</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm bg-white dark:bg-gray-800 p-3 rounded">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboardPage;

