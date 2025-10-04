
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Target, Calendar } from 'lucide-react';

interface SprintProgressWidgetProps {
  groupId: string;
}

interface SprintStats {
  completionPercentage: number;
  currentDay: number;
  totalDays: number;
  status: 'on-track' | 'behind' | 'ahead';
  endDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

export const SprintProgressWidget = ({ groupId }: SprintProgressWidgetProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [groupId]);

  const loadStats = async () => {
    try {
      // Use mock data instead of external API call
      const mockStats: SprintStats = {
        completionPercentage: 35,
        currentDay: 30,
        totalDays: 90,
        status: 'on-track',
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        tasksCompleted: 15,
        totalTasks: 42
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading sprint stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-oracle-gold/30">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'behind':
        return 'text-red-600';
      case 'ahead':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (stats.completionPercentage / 100) * circumference;

  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg border-oracle-gold/30 hover:border-oracle-gold/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-oracle-navy text-center flex items-center justify-center gap-2">
          <Target className="h-5 w-5 text-oracle-gold" />
          90-Day Sprint Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#f59e0b"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-oracle-navy">
                {Math.round(stats.completionPercentage)}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-lg font-semibold text-oracle-navy">
            {Math.round(stats.completionPercentage)}% Complete
          </p>
          <p className="text-sm text-gray-600">
            Day {stats.currentDay} of {stats.totalDays}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            stats.status === 'on-track' ? 'bg-green-500' :
            stats.status === 'behind' ? 'bg-red-500' : 'bg-blue-500'
          }`}></div>
          <span className={`text-sm font-medium ${getStatusColor(stats.status)}`}>
            {stats.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span>Tasks:</span>
            <span>{stats.tasksCompleted} / {stats.totalTasks}</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-1" />
        </div>

        <Button
          onClick={() => navigate('/roadmap/progress')}
          className="w-full bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
          size="sm"
        >
          View Progress
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
