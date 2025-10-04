
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Calendar, TrendingUp, Clock,
  CheckCircle, Timer, Trophy
} from 'lucide-react';

interface SprintStats {
  completionPercentage: number;
  currentDay: number;
  totalDays: number;
  status: 'on-track' | 'behind' | 'ahead';
  endDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

interface SprintOverviewProps {
  stats: SprintStats;
}

export const SprintOverview = ({ stats }: SprintOverviewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'behind':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ahead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Target className="h-4 w-4" />;
      case 'behind':
        return <Clock className="h-4 w-4" />;
      case 'ahead':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Timer className="h-4 w-4" />;
    }
  };

  const progressRadius = 120;
  const progressStroke = 8;
  const normalizedRadius = progressRadius - progressStroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (stats.completionPercentage / 100) * circumference;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Main Progress Ring */}
      <Card className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-oracle-navy/5 to-oracle-navy/10">
        <CardHeader>
          <CardTitle className="text-center text-oracle-navy">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-4">
            <svg
              height={progressRadius * 2}
              width={progressRadius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={progressStroke}
                r={normalizedRadius}
                cx={progressRadius}
                cy={progressRadius}
              />
              <circle
                stroke="#f59e0b"
                fill="transparent"
                strokeWidth={progressStroke}
                strokeDasharray={strokeDasharray}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={progressRadius}
                cy={progressRadius}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-oracle-navy">
                {Math.round(stats.completionPercentage)}%
              </span>
              <span className="text-sm text-gray-600">Complete</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-oracle-navy">
              {stats.tasksCompleted} of {stats.totalTasks} tasks completed
            </p>
            <p className="text-sm text-gray-600">
              Day {stats.currentDay} of {stats.totalDays}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-oracle-navy flex items-center justify-center gap-2">
            {getStatusIcon(stats.status)}
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Badge 
            className={`${getStatusColor(stats.status)} text-lg px-4 py-2 font-semibold`}
          >
            {stats.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Ends {new Date(stats.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days Remaining */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-oracle-navy flex items-center justify-center gap-2">
            <Timer className="h-5 w-5" />
            Time Remaining
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold text-oracle-navy mb-2">
            {stats.totalDays - stats.currentDay}
          </div>
          <p className="text-sm text-gray-600">Days left</p>
          <div className="mt-4">
            <Progress 
              value={(stats.currentDay / stats.totalDays) * 100} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.currentDay / stats.totalDays) * 100)}% of sprint elapsed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
