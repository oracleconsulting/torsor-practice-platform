import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  analyticsService,
  type AlignmentAnalytics
} from '../../services/alignmentEnhancementsService';

interface AnalyticsDashboardProps {
  practiceId: string;
  oracleGroupId: string;
}

export function AnalyticsDashboard({ practiceId, oracleGroupId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AlignmentAnalytics | null>(null);
  const [history, setHistory] = useState<AlignmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadAnalytics();
  }, [oracleGroupId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [latest, historyData] = await Promise.all([
        analyticsService.getLatestAnalytics(oracleGroupId),
        analyticsService.getAnalyticsHistory(oracleGroupId, timeRange)
      ]);

      setAnalytics(latest);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateNow = async () => {
    setCalculating(true);
    try {
      const result = await analyticsService.calculateAnalytics(practiceId, oracleGroupId);
      if (result) {
        setAnalytics(result);
      }
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
          <p className="text-gray-600 mb-4">
            Analytics will be generated automatically as client makes progress.
          </p>
          <Button onClick={handleCalculateNow} disabled={calculating}>
            {calculating ? 'Calculating...' : 'Calculate Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {new Date(analytics.updated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === days
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculateNow}
            disabled={calculating}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <MetricCard
          title="Completion Rate"
          value={`${analytics.completion_rate.toFixed(1)}%`}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="green"
          subtitle={`${analytics.completed_tasks} of ${analytics.total_tasks} tasks`}
        />

        {/* Current Week */}
        <MetricCard
          title="Current Week"
          value={`Week ${analytics.current_week}`}
          icon={<ClockIcon className="w-6 h-6" />}
          color="blue"
          subtitle={`${analytics.weeks_on_track} on track, ${analytics.weeks_behind} behind`}
        />

        {/* Weekly Velocity */}
        <MetricCard
          title="Weekly Velocity"
          value={analytics.weekly_velocity?.toFixed(1) || '0'}
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          color="purple"
          subtitle="tasks per week"
          trend={analytics.momentum_score}
        />

        {/* Issues */}
        <MetricCard
          title="Issues"
          value={analytics.blocked_tasks + analytics.overdue_tasks}
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          color="red"
          subtitle={`${analytics.blocked_tasks} blocked, ${analytics.overdue_tasks} overdue`}
        />
      </div>

      {/* Progress Chart */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={history} />
          </CardContent>
        </Card>
      )}

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week Activity */}
        <Card>
          <CardHeader>
            <CardTitle>This Week's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatRow
                label="Tasks Completed"
                value={analytics.tasks_completed_this_week}
                total={analytics.total_tasks}
              />
              <StatRow
                label="Notes Added"
                value={analytics.notes_added_this_week}
                total={null}
              />
              <StatRow
                label="Calls This Week"
                value={analytics.calls_this_week}
                total={null}
              />
            </div>
          </CardContent>
        </Card>

        {/* Momentum & Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Momentum & Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Momentum Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Momentum Score</span>
                  <MomentumBadge score={analytics.momentum_score} />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (analytics.momentum_score || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.abs(analytics.momentum_score || 0) * 10)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(analytics.momentum_score || 0) > 0 
                    ? 'Progress is accelerating' 
                    : 'Progress is slowing down'}
                </p>
              </div>

              {/* Estimated Completion */}
              {analytics.estimated_completion_date && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Estimated Completion</span>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(analytics.estimated_completion_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {analytics.confidence_score && (
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.confidence_score}% confidence
                    </p>
                  )}
                </div>
              )}

              {/* Average Completion Time */}
              {analytics.average_completion_time_days && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Avg. Completion Time</span>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {analytics.average_completion_time_days.toFixed(1)} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">per task</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks & Issues */}
        {(analytics.blocked_tasks > 0 || analytics.overdue_tasks > 0 || analytics.stalled_weeks > 0) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Bottlenecks & Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.blocked_tasks > 0 && (
                  <IssueCard
                    title="Blocked Tasks"
                    count={analytics.blocked_tasks}
                    description="Tasks cannot proceed"
                    severity="high"
                  />
                )}
                {analytics.overdue_tasks > 0 && (
                  <IssueCard
                    title="Overdue Tasks"
                    count={analytics.overdue_tasks}
                    description="Past their due date"
                    severity="medium"
                  />
                )}
                {analytics.stalled_weeks > 0 && (
                  <IssueCard
                    title="Stalled Weeks"
                    count={analytics.stalled_weeks}
                    description="No progress made"
                    severity="medium"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsSection analytics={analytics} history={history} />
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'red' | 'yellow';
  subtitle?: string;
  trend?: number | null;
}

function MetricCard({ title, value, icon, color, subtitle, trend }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <Card className={`border-2 ${colorClasses[color].split(' ')[2]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend !== undefined && trend !== null && (
                <span className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Progress Chart (using divs, not recharts for simplicity)
function ProgressChart({ data }: { data: AlignmentAnalytics[] }) {
  const maxValue = Math.max(...data.map(d => d.completion_rate), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between h-48 space-x-2">
        {data.slice(-14).map((item, index) => {
          const height = (item.completion_rate / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end group">
              <div className="relative w-full">
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap pointer-events-none z-10">
                  {item.completion_rate.toFixed(1)}%
                  <br />
                  {new Date(item.analysis_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {/* Bar */}
                <div
                  className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors cursor-pointer"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
              </div>
              {/* Date Label */}
              <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                {new Date(item.analysis_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// Stat Row Component
function StatRow({ label, value, total }: { label: string; value: number; total: number | null }) {
  const percentage = total ? (value / total) * 100 : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {value}{total ? ` / ${total}` : ''}
        </span>
      </div>
      {percentage !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Momentum Badge
function MomentumBadge({ score }: { score?: number | null }) {
  if (!score) return <Badge className="bg-gray-100 text-gray-600">No data</Badge>;

  if (score > 5) return <Badge className="bg-green-100 text-green-800">🚀 Accelerating</Badge>;
  if (score > 0) return <Badge className="bg-blue-100 text-blue-800">📈 Positive</Badge>;
  if (score > -5) return <Badge className="bg-yellow-100 text-yellow-800">📉 Slowing</Badge>;
  return <Badge className="bg-red-100 text-red-800">⚠️ Stalled</Badge>;
}

// Issue Card
function IssueCard({ 
  title, 
  count, 
  description, 
  severity 
}: { 
  title: string; 
  count: number; 
  description: string; 
  severity: 'high' | 'medium' | 'low' 
}) {
  const severityColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-yellow-300 bg-yellow-50',
    low: 'border-blue-300 bg-blue-50'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${severityColors[severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className="text-2xl font-bold text-gray-900">{count}</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Insights Section
function InsightsSection({ analytics, history }: { analytics: AlignmentAnalytics; history: AlignmentAnalytics[] }) {
  const insights: string[] = [];

  // Generate insights based on data
  if (analytics.completion_rate > 80) {
    insights.push("🎉 Excellent progress! Client is on track to complete ahead of schedule.");
  } else if (analytics.completion_rate < 30) {
    insights.push("⚠️ Progress is below expectations. Consider scheduling a check-in call.");
  }

  if (analytics.blocked_tasks > 3) {
    insights.push(`🚧 ${analytics.blocked_tasks} tasks are blocked. Client may need additional support.`);
  }

  if ((analytics.momentum_score || 0) < -5) {
    insights.push("📉 Momentum is declining. Client engagement may be dropping - reach out proactively.");
  } else if ((analytics.momentum_score || 0) > 5) {
    insights.push("🚀 Momentum is increasing! Great time to introduce additional advisory services.");
  }

  if (analytics.tasks_completed_this_week === 0 && analytics.current_week > 2) {
    insights.push("⏸️ No tasks completed this week. Follow up to identify barriers.");
  }

  if (analytics.calls_this_week > 0) {
    insights.push(`📞 ${analytics.calls_this_week} call(s) this week. Regular communication is building trust.`);
  }

  if (history.length >= 7) {
    const recentAvg = history.slice(-7).reduce((sum, h) => sum + h.completion_rate, 0) / 7;
    const previousAvg = history.slice(-14, -7).reduce((sum, h) => sum + h.completion_rate, 0) / 7;
    const change = recentAvg - previousAvg;

    if (Math.abs(change) > 5) {
      insights.push(
        change > 0
          ? `📈 Completion rate improved by ${change.toFixed(1)}% over the past week.`
          : `📉 Completion rate declined by ${Math.abs(change).toFixed(1)}% over the past week.`
      );
    }
  }

  if (insights.length === 0) {
    insights.push("✅ Progress is steady. Continue current engagement level.");
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-1">
            <p className="text-sm text-gray-800">{insight}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

