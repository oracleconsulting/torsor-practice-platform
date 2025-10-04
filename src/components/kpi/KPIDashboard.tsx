import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, Users, 
  Clock, Shield, Target, BarChart3, ArrowUpRight, ArrowDownRight, Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { kpiService } from '../services/accountancy/kpiService';
import { useAccountancyContext } from '@/contexts/AccountancyContext';

interface KPIData {
  definition: {
    id: string;
    name: string;
    formula?: string;
    category: string;
  };
  currentValue?: {
    value: number;
    date: string;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  history?: Array<{
    value: number;
    date: string;
  }>;
}

interface KPICategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  kpis: KPIData[];
}

export const KPIDashboard: React.FC = () => {
  const context = useAccountancyContext();
  const [categories, setCategories] = useState<KPICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('financial');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  
  const tier = context?.subscriptionTier || 'free';
  const isFreeTier = tier === 'free';

  useEffect(() => {
    loadKPIData();
    loadInsights();
  }, []);

  const loadKPIData = async () => {
    try {
      const data = await kpiService.getKPIDashboard();
      
      // Transform data into categories
      const categoryConfig = {
        financial: { name: 'Financial', icon: DollarSign, color: 'text-green-500' },
        operational: { name: 'Operational', icon: Clock, color: 'text-blue-500' },
        client: { name: 'Client', icon: Users, color: 'text-purple-500' },
        team: { name: 'Team', icon: Users, color: 'text-pink-500' },
        compliance: { name: 'Compliance', icon: Shield, color: 'text-yellow-500' },
        technology: { name: 'Technology', icon: BarChart3, color: 'text-cyan-500' },
        strategic: { name: 'Strategic', icon: Target, color: 'text-orange-500' }
      };

      const formattedCategories = Object.entries(data).map(([key, kpis]) => ({
        id: key,
        name: categoryConfig[key as keyof typeof categoryConfig]?.name || key,
        icon: categoryConfig[key as keyof typeof categoryConfig]?.icon || BarChart3,
        color: categoryConfig[key as keyof typeof categoryConfig]?.color || 'text-gray-500',
        kpis: Object.values(kpis as any) as KPIData[]
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      // Set mock data for development
      setCategories(getMockKPIData());
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const insights = await kpiService.getPracticeInsights();
      setInsights(insights);
    } catch (error) {
      console.error('Error loading insights:', error);
      // Set mock insights for development
      setInsights(getMockInsights());
    }
  };

  const getMockKPIData = (): KPICategory[] => {
    return [
      {
        id: 'financial',
        name: 'Financial',
        icon: DollarSign,
        color: 'text-green-500',
        kpis: [
          {
            definition: {
              id: '1',
              name: 'Revenue Growth',
              formula: '((Current Revenue - Previous Revenue) / Previous Revenue) × 100',
              category: 'financial'
            },
            currentValue: { value: 15.2, date: '2024-01-01' },
            trend: { direction: 'up', percentage: 12.5 },
            history: [
              { value: 12.5, date: '2023-10-01' },
              { value: 13.8, date: '2023-11-01' },
              { value: 14.2, date: '2023-12-01' },
              { value: 15.2, date: '2024-01-01' }
            ]
          },
          {
            definition: {
              id: '2',
              name: 'Profit Margin',
              formula: '(Net Profit / Revenue) × 100',
              category: 'financial'
            },
            currentValue: { value: 28.5, date: '2024-01-01' },
            trend: { direction: 'up', percentage: 3.2 },
            history: [
              { value: 25.3, date: '2023-10-01' },
              { value: 26.1, date: '2023-11-01' },
              { value: 27.2, date: '2023-12-01' },
              { value: 28.5, date: '2024-01-01' }
            ]
          },
          {
            definition: {
              id: '3',
              name: 'Cash Flow',
              formula: 'Operating Cash Flow - Capital Expenditures',
              category: 'financial'
            },
            currentValue: { value: 45000, date: '2024-01-01' },
            trend: { direction: 'down', percentage: 5.1 },
            history: [
              { value: 52000, date: '2023-10-01' },
              { value: 48000, date: '2023-11-01' },
              { value: 47000, date: '2023-12-01' },
              { value: 45000, date: '2024-01-01' }
            ]
          }
        ]
      },
      {
        id: 'operational',
        name: 'Operational',
        icon: Clock,
        color: 'text-blue-500',
        kpis: [
          {
            definition: {
              id: '4',
              name: 'Client Response Time',
              formula: 'Average time to respond to client inquiries',
              category: 'operational'
            },
            currentValue: { value: 2.5, date: '2024-01-01' },
            trend: { direction: 'up', percentage: 8.3 },
            history: [
              { value: 2.7, date: '2023-10-01' },
              { value: 2.6, date: '2023-11-01' },
              { value: 2.5, date: '2023-12-01' },
              { value: 2.5, date: '2024-01-01' }
            ]
          }
        ]
      }
    ];
  };

  const getMockInsights = () => {
    return {
      health_score: {
        overall: 78,
        categories: {
          financial: 85,
          operational: 72,
          security: 80,
          team: 75,
          growth: 82
        },
        trend: 'improving'
      },
      recommendations: [
        {
          priority: 'high',
          title: 'Improve Cash Flow Management',
          description: 'Your cash flow has decreased by 5.1% this month. Consider reviewing payment terms and outstanding invoices.',
          impact: 'Potential 15% improvement in cash flow'
        },
        {
          priority: 'medium',
          title: 'Optimise Client Response Times',
          description: 'Response times are trending upward. Consider implementing automated responses for common inquiries.',
          impact: 'Potential 20% reduction in response time'
        }
      ]
    };
  };

  const renderKPICard = (kpi: KPIData) => {
    const TrendIcon = kpi.trend.direction === 'up' ? ArrowUpRight : 
                      kpi.trend.direction === 'down' ? ArrowDownRight : Minus;
    const trendColor = kpi.trend.direction === 'up' ? 'text-green-500' : 
                       kpi.trend.direction === 'down' ? 'text-red-500' : 'text-gray-500';

    return (
      <Card key={kpi.definition.id} className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">
              {kpi.definition.name}
            </CardTitle>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.abs(kpi.trend.percentage)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-white">
              {formatKPIValue(kpi.currentValue?.value, kpi.definition.name)}
            </div>
            
            {kpi.definition.formula && (
              <p className="text-xs text-gray-400">
                {kpi.definition.formula}
              </p>
            )}
            
            {/* Simple trend indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                kpi.trend.direction === 'up' ? 'bg-green-500' : 
                kpi.trend.direction === 'down' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-400">
                {kpi.trend.direction === 'up' ? 'Improving' : 
                 kpi.trend.direction === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatKPIValue = (value: number | undefined, kpiName: string): string => {
    if (value === undefined) return 'N/A';
    
    // Format based on KPI type
    if (kpiName.includes('revenue') || kpiName.includes('value') || kpiName.includes('cash')) {
      return `£${value.toLocaleString()}`;
    } else if (kpiName.includes('percentage') || kpiName.includes('rate') || kpiName.includes('margin')) {
      return `${value.toFixed(1)}%`;
    } else if (kpiName.includes('days') || kpiName.includes('time')) {
      return `${value} days`;
    } else {
      return value.toLocaleString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading KPI Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Health Score */}
      {insights && (
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Practice Health Score
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-white">
                    {insights.health_score.overall}%
                  </div>
                  <Badge variant={insights.health_score.trend === 'improving' ? 'default' : 'secondary'}>
                    {insights.health_score.trend}
                  </Badge>
                </div>
              </div>
              
              {/* Health Score Breakdown */}
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(insights.health_score.categories).map(([category, score]) => (
                  <div key={category} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      {category as string}
                    </div>
                    <Progress value={score as number} className="h-2 mb-1" />
                    <div className="text-sm font-medium text-white">
                      {score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Tier Limit Notice */}
      {isFreeTier && (
        <Card className="bg-yellow-900/20 border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-yellow-500" />
                <p className="text-yellow-200">
                  You're viewing 3 core KPIs. Upgrade to Professional to unlock all 35+ KPIs across 7 categories.
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-yellow-700 text-yellow-200 hover:bg-yellow-900/50"
                onClick={() => window.location.href = '/accountancy/pricing'}
              >
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-gray-800 border-gray-700">
          {categories.map((category) => {
            const Icon = category.icon;
            const isLocked = isFreeTier && !['financial'].includes(category.id);
            
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                disabled={isLocked}
                className="data-[state=active]:bg-gray-700"
              >
                <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                {category.name}
                {isLocked && <Lock className="w-3 h-3 ml-1" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.kpis.map((kpi) => renderKPICard(kpi))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Insights & Recommendations */}
      {insights && insights.recommendations && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Based on your practice data and industry benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.recommendations.map((rec: any, index: number) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-white font-medium">{rec.title}</p>
                      <p className="text-sm text-gray-400">{rec.description}</p>
                      {rec.impact && (
                        <p className="text-xs text-purple-400">
                          Potential impact: {rec.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 