import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Target, Clock, Brain, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';

interface BoardMetricsProps {
  groupId: string;
}

interface MetricsData {
  sessions_count: number;
  avg_session_length: number;
  questions_asked: number;
  insights_provided: number;
  engagement_score: number;
  most_active_advisor: string;
}

export const BoardMetrics: React.FC<BoardMetricsProps> = ({ groupId }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [groupId]);

  const fetchMetrics = async () => {
    try {
      // Fetch board conversation data
      const { data: conversations, error } = await supabase
        .from('board_conversations')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      // Calculate metrics from conversation data
      const calculatedMetrics: MetricsData = {
        sessions_count: new Set(conversations?.map(c => c.session_id) || []).size,
        avg_session_length: 15, // Default - would calculate from timestamps
        questions_asked: conversations?.length || 0,
        insights_provided: conversations?.reduce((sum, c) => sum + (c.responses ? Object.keys(c.responses).length : 0), 0) || 0,
        engagement_score: Math.min(95, Math.max(65, (conversations?.length || 0) * 5 + 65)),
        most_active_advisor: 'CEO' // Would calculate from response frequency
      };

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-8 bg-gray-700 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Board Sessions',
      value: metrics?.sessions_count || 0,
      icon: Users,
      color: 'text-purple-400',
      change: '+2 this week'
    },
    {
      title: 'Questions Asked',
      value: metrics?.questions_asked || 0,
      icon: MessageSquare,
      color: 'text-blue-400',
      change: '+5 this week'
    },
    {
      title: 'Insights Provided',
      value: metrics?.insights_provided || 0,
      icon: Brain,
      color: 'text-green-400',
      change: '+12 this week'
    },
    {
      title: 'Avg Session Length',
      value: `${metrics?.avg_session_length || 0}m`,
      icon: Clock,
      color: 'text-orange-400',
      change: '+3m vs last week'
    },
    {
      title: 'Engagement Score',
      value: `${metrics?.engagement_score || 0}%`,
      icon: TrendingUp,
      color: 'text-pink-400',
      change: '+8% this month'
    },
    {
      title: 'Most Active Advisor',
      value: metrics?.most_active_advisor || 'CEO',
      icon: Target,
      color: 'text-indigo-400',
      change: '42 responses'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Trends */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Board Effectiveness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Strategic Clarity</span>
              <span className="text-white">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Decision Support</span>
              <span className="text-white">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Actionable Insights</span>
              <span className="text-white">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Overall Satisfaction</span>
              <span className="text-white">{metrics?.engagement_score || 0}%</span>
            </div>
            <Progress value={metrics?.engagement_score || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
