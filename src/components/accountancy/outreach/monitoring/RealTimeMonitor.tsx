// src/components/accountancy/outreach/monitoring/RealTimeMonitor.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Phone,
  Calendar,
  BarChart3,
  RefreshCw,
  Zap,
  Eye
} from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface MetricCard {
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

interface ActivityItem {
  id: string;
  type: 'prospect_created' | 'email_sent' | 'research_completed' | 'campaign_launched' | 'pe_acquisition';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

interface AutomationStatus {
  ruleId: string;
  ruleName: string;
  status: 'running' | 'completed' | 'failed';
  executionCount: number;
  lastExecution: Date;
  successRate: number;
}

const RealTimeMonitor: React.FC = () => {
  const { practice } = useAccountancyContext();
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState({
    activeProspects: 0,
    emailsSent: 0,
    researchCompleted: 0,
    campaignsActive: 0,
    conversionRate: 0,
    responseRate: 0
  });
  const [automationStats, setAutomationStats] = useState<AutomationStatus[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (practice?.id) {
      connectWebSocket();
      loadInitialData();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [practice?.id]);

  const connectWebSocket = () => {
    const wsUrl = `${import.meta.env.VITE_WS_URL}/outreach/monitor?practice_id=${practice?.id}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };
  };

  const handleRealtimeUpdate = (data: any) => {
    switch (data.type) {
      case 'activity':
        setActivities(prev => [data.activity, ...prev].slice(0, 50));
        break;
      
      case 'metrics':
        setMetrics(data.metrics);
        break;
      
      case 'automation_update':
        updateAutomationStatus(data.automation);
        break;
      
      case 'time_series':
        updateTimeSeriesData(data.point);
        break;
    }
  };

  const loadInitialData = async () => {
    // Load initial metrics and activities using the new Phase 1-3 APIs
    try {
      // Get system health and performance metrics
      const [healthData, performanceData, systemMetrics] = await Promise.all([
        outreachService.getSystemHealth(),
        outreachService.getPerformanceMetrics(),
        outreachService.getSystemMetrics()
      ]);

      // Update metrics with real data
      setMetrics({
        activeProspects: performanceData.active_prospects,
        emailsSent: 0, // Will be updated via WebSocket
        researchCompleted: performanceData.research_completed,
        campaignsActive: performanceData.campaigns_active,
        conversionRate: 0, // Will be calculated
        responseRate: 0 // Will be updated via WebSocket
      });

      // Create mock activities for now (will be replaced with real WebSocket data)
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'prospect_created',
          title: 'New prospect added',
          description: 'ABC Company Ltd added to prospect list',
          timestamp: new Date(),
          status: 'success'
        },
        {
          id: '2',
          type: 'research_completed',
          title: 'Research completed',
          description: 'Deep research completed for XYZ Corp',
          timestamp: new Date(Date.now() - 300000),
          status: 'success'
        }
      ];
      setActivities(mockActivities);

      // Create mock automation stats
      const mockAutomationStats: AutomationStatus[] = [
        {
          ruleId: '1',
          ruleName: 'Auto Research High-Score Prospects',
          status: 'running',
          executionCount: 45,
          lastExecution: new Date(),
          successRate: 92
        },
        {
          ruleId: '2',
          ruleName: 'Follow-up Reminder',
          status: 'completed',
          executionCount: 12,
          lastExecution: new Date(Date.now() - 600000),
          successRate: 100
        }
      ];
      setAutomationStats(mockAutomationStats);

      // Create mock time series data
      const mockTimeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        responseTime: Math.random() * 200 + 50,
        activityCount: Math.floor(Math.random() * 10) + 1
      }));
      setTimeSeriesData(mockTimeSeriesData);

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const updateAutomationStatus = (automation: AutomationStatus) => {
    setAutomationStats(prev => {
      const index = prev.findIndex(a => a.ruleId === automation.ruleId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = automation;
        return updated;
      }
      return [...prev, automation];
    });
  };

  const updateTimeSeriesData = (point: any) => {
    setTimeSeriesData(prev => {
      const updated = [...prev, point];
      // Keep only last 24 hours of data
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);
      return updated.filter(p => new Date(p.timestamp) > cutoff);
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prospect_created': return Users;
      case 'email_sent': return Mail;
      case 'research_completed': return Eye;
      case 'campaign_launched': return Zap;
      case 'pe_acquisition': return TrendingUp;
      default: return Activity;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Active Prospects',
      value: metrics.activeProspects,
      change: 12,
      trend: 'up',
      icon: Users
    },
    {
      title: 'Emails Sent Today',
      value: metrics.emailsSent,
      change: 8,
      trend: 'up',
      icon: Mail
    },
    {
      title: 'Research Completed',
      value: metrics.researchCompleted,
      change: -3,
      trend: 'down',
      icon: Eye
    },
    {
      title: 'Active Campaigns',
      value: metrics.campaignsActive,
      change: 0,
      trend: 'neutral',
      icon: Zap
    }
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Real-time Monitor</h2>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 mr-1" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    ) : (
                      <span className="w-4 h-4 mr-1">-</span>
                    )}
                    <span className={`text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>
                <metric.icon className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className={`mt-0.5 ${getActivityColor(activity.status)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(activity.timestamp, 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationStats.map((automation) => (
                  <div key={automation.ruleId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{automation.ruleName}</h4>
                        <p className="text-sm text-gray-600">
                          Last run: {format(automation.lastExecution, 'HH:mm:ss')}
                        </p>
                      </div>
                      <Badge variant={
                        automation.status === 'running' ? 'default' :
                        automation.status === 'completed' ? 'secondary' :
                        'destructive'
                      }>
                        {automation.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Executions</span>
                        <span>{automation.executionCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{automation.successRate}%</span>
                      </div>
                      <Progress value={automation.successRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Response Time Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">API Response Time (ms)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity Volume Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Activity Volume</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="activityCount" 
                        stroke="#82ca9d" 
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Prospects Created</span>
                      <span className="text-sm font-medium">100%</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Researched</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <Progress value={75} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Contacted</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Responded</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Converted</span>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                    <Progress value={8} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Email Open', value: 68 },
                    { name: 'Email Click', value: 42 },
                    { name: 'Reply Rate', value: 18 },
                    { name: 'Meeting Booked', value: 12 },
                    { name: 'Proposal Sent', value: 8 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMonitor;