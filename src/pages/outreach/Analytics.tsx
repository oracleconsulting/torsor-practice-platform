import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Mail, Calendar, Building2, ArrowUp, ArrowDown } from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';

const Analytics: React.FC = () => {
  const { practice } = useAccountancyContext();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    campaigns: { total: 0, active: 0, completed: 0, success_rate: 0 },
    contacts: { total: 0, active: 0, engaged: 0, conversion_rate: 0 },
    pe: { acquisitions: 0, extracted_clients: 0, converted_clients: 0, success_rate: 0 }
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!practice?.id) return;

      try {
        const [campaignStats, contactStats, peStats] = await Promise.all([
          outreachService.getCampaignStats(practice.id),
          outreachService.getContactStats(practice.id),
          outreachService.getPEStats(practice.id)
        ]);

        setStats({
          campaigns: {
            total: campaignStats.length,
            active: campaignStats.filter((s: any) => s.status === 'active').length,
            completed: campaignStats.filter((s: any) => s.status === 'completed').length,
            success_rate: calculateSuccessRate(campaignStats)
          },
          contacts: {
            total: contactStats.length,
            active: contactStats.filter((s: any) => s.status === 'active').length,
            engaged: contactStats.filter((s: any) => s.responses > 0).length,
            conversion_rate: calculateConversionRate(contactStats)
          },
          pe: {
            acquisitions: peStats[0]?.total_acquisitions || 0,
            extracted_clients: peStats[0]?.total_extracted_clients || 0,
            converted_clients: peStats[0]?.total_converted_clients || 0,
            success_rate: peStats[0]?.total_extracted_clients > 0 
              ? (peStats[0]?.total_converted_clients / peStats[0]?.total_extracted_clients) * 100 
              : 0
          }
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [practice?.id, timeframe]);

  const calculateSuccessRate = (stats: any[]) => {
    const completed = stats.filter(s => s.status === 'completed');
    return completed.length > 0
      ? (completed.filter(s => s.responses > 0).length / completed.length) * 100
      : 0;
  };

  const calculateConversionRate = (stats: any[]) => {
    return stats.length > 0
      ? (stats.filter(s => s.responses > 0).length / stats.length) * 100
      : 0;
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  const metricCards = [
    {
      title: 'Active Campaigns',
      value: stats.campaigns.active,
      change: 12, // This would come from actual data
      icon: Mail,
      color: 'blue'
    },
    {
      title: 'Engaged Contacts',
      value: stats.contacts.engaged,
      change: 8,
      icon: Users,
      color: 'green'
    },
    {
      title: 'PE Acquisitions',
      value: stats.pe.acquisitions,
      change: 15,
      icon: Building2,
      color: 'purple'
    },
    {
      title: 'Campaign Success Rate',
      value: `${stats.campaigns.success_rate.toFixed(1)}%`,
      change: 5,
      icon: TrendingUp,
      color: 'orange'
    },
    {
      title: 'Client Conversion Rate',
      value: `${stats.pe.success_rate.toFixed(1)}%`,
      change: -2,
      icon: TrendingDown,
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
      green: { bg: 'bg-green-100', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
      indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track your outreach performance</p>
        </div>
        <Select
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as 'week' | 'month' | 'quarter')}
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metricCards.map((metric, index) => {
          const colors = getColorClasses(metric.color);
          const Icon = metric.icon;
          const isPositive = metric.change > 0;

          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`${colors.bg} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Campaigns</p>
                  <p className="text-2xl font-bold">{stats.campaigns.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-lg font-medium text-blue-600">{stats.campaigns.active}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Completed Campaigns</p>
                  <p className="text-2xl font-bold">{stats.campaigns.completed}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-lg font-medium text-green-600">
                    {stats.campaigns.success_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PE Acquisition Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Acquisitions</p>
                  <p className="text-2xl font-bold">{stats.pe.acquisitions}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Extracted Clients</p>
                  <p className="text-lg font-medium text-purple-600">{stats.pe.extracted_clients}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Converted Clients</p>
                  <p className="text-2xl font-bold">{stats.pe.converted_clients}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-lg font-medium text-green-600">
                    {stats.pe.success_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics; 