import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { useAccountancyContext } from '../../contexts/AccountancyContext';
import { outreachService } from '../../services/accountancy/outreachService';
import JamesStoryBanner from './JamesStoryBanner';
import PEMonitor from './pe/PEMonitor';
import ProspectCard from './prospects/ProspectCard';
import { Mail, Users, Calendar, TrendingUp, ArrowUp, ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Plus, Filter, ArrowRight } from 'lucide-react';
import { toast } from '../../ui/use-toast';

export const OutreachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    campaigns: { total: 0, active: 0, completed: 0, success_rate: 0 },
    contacts: { total: 0, active: 0, engaged: 0, conversion_rate: 0 },
    pe: { acquisitions: 0, extracted_clients: 0, converted_clients: 0, success_rate: 0 }
  });
  const [recentProspects, setRecentProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    if (practice?.id) {
      loadDashboardData();
    }
  }, [practice?.id]);

  const loadDashboardData = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel with timeouts and safe fallbacks
      const withTimeout = (p: Promise<any>, ms = 4000) => Promise.race([
        p,
        new Promise((_r, reject) => setTimeout(() => reject(new Error('timeout')), ms))
      ]).catch(() => null);

      const [campaignStats, contactStats, peStats, prospects, campaignsData] = await Promise.all([
        withTimeout(outreachService.getCampaignStats?.(practice.id) ?? Promise.resolve([])),
        withTimeout(outreachService.getContactStats?.(practice.id) ?? Promise.resolve([])),
        withTimeout(outreachService.getPEStats?.(practice.id) ?? Promise.resolve([])),
        withTimeout((outreachService as any).getProspects?.(practice.id) ?? Promise.resolve([])),
        withTimeout(outreachService.getCampaigns?.(practice.id) ?? Promise.resolve([]))
      ]);

      // Process campaign stats
      const campaignArray = Array.isArray(campaignStats) ? campaignStats : (campaignStats ? [campaignStats] : []);
      const campaignData = campaignArray.filter(Boolean);
      const activeCampaigns = campaignData.filter((s: any) => s?.status === 'active');
      const completedCampaigns = campaignData.filter((s: any) => s?.status === 'completed');

      // Process contact stats - they come as array of { status, count }
      const contactData = (Array.isArray(contactStats) ? contactStats : []).filter(Boolean);
      const totalContacts = contactData.reduce((sum, item) => sum + (item?.count || 0), 0);
      const activeContacts = contactData.find(item => item?.status === 'active')?.count || 0;
      const engagedContacts = contactData.find(item => item?.status === 'engaged')?.count || 0;

      // Process PE stats - they come as array of { status, count }
      const peData = (Array.isArray(peStats) ? peStats : []).filter(Boolean);
      const totalAcquisitions = peData.reduce((sum, item) => sum + (item?.count || 0), 0);
      const extractedClients = peData.find(item => item?.status === 'extracted')?.count || 0;
      const convertedClients = peData.find(item => item?.status === 'converted')?.count || 0;

      setStats({
        campaigns: {
          total: campaignData.length,
          active: activeCampaigns.length,
          completed: completedCampaigns.length,
          success_rate: calculateSuccessRate(campaignData)
        },
        contacts: {
          total: totalContacts,
          active: activeContacts,
          engaged: engagedContacts,
          conversion_rate: totalContacts > 0 ? (engagedContacts / totalContacts) * 100 : 0
        },
        pe: {
          acquisitions: totalAcquisitions,
          extracted_clients: extractedClients,
          converted_clients: convertedClients,
          success_rate: extractedClients > 0 ? (convertedClients / extractedClients) * 100 : 0
        }
      });

      // Get most recent prospects
      setRecentProspects(
        (prospects || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
      );

      // Set campaigns data
      setCampaigns(campaignsData || []);

      // Set segments to empty array - not implemented yet
      setSegments([]);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // Don't block the page; show empty state instead
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = (stats: any[]) => {
    const completed = stats.filter(s => s.status === 'completed');
    return completed.length > 0
      ? (completed.filter(s => s.responses > 0).length / completed.length) * 100
      : 0;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="relative bg-white py-16 border-b-4 border-[#ff6b35]">
          <div className="relative z-10 container mx-auto px-6">
            <h1 className="text-5xl font-black uppercase text-[#1a2b4a]">
              CLIENT OUTREACH
            </h1>
            <p className="text-xl text-[#1a2b4a]/80 font-bold uppercase">
              Loading outreach tools...
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin mr-2 text-[#ff6b35]" />
            <span className="text-[#1a2b4a]">Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white relative">
        <div className="relative bg-white py-16 border-b-4 border-[#ff6b35]">
          <div className="relative z-10 container mx-auto px-6">
            <h1 className="text-5xl font-black uppercase text-[#1a2b4a]">
              CLIENT OUTREACH
            </h1>
          </div>
        </div>
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-[#1a2b4a]">Failed to Load Dashboard</h3>
            <p className="text-[#1a2b4a] mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
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
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Campaign Success Rate',
      value: `${stats.campaigns.success_rate.toFixed(1)}%`,
      change: 5,
      icon: Calendar,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
      green: { bg: 'bg-green-100', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', icon: 'text-orange-600' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'call':
        return <Calendar className="w-5 h-5 text-green-600" />;
      default:
        return <Mail className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* James's Story Banner */}
      <JamesStoryBanner />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prospects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Prospects</h2>
            <Button
              onClick={() => navigate('/accountancy/outreach/prospects')}
              variant="outline"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentProspects.map((prospect: any) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                onGenerateOutreach={(id) => navigate(`/accountancy/outreach/prospects/${id}/outreach`)}
                onViewDetails={(id) => navigate(`/accountancy/outreach/prospects/${id}`)}
              />
            ))}
            {recentProspects.length === 0 && (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-gray-500">No prospects yet. Start by adding your first prospect.</p>
                  <Button
                    onClick={() => navigate('/accountancy/outreach/prospects/new')}
                    className="mt-4"
                  >
                    Add Prospect
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* PE Monitor */}
        <div>
          <PEMonitor />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/accountancy/outreach/prospects/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Prospect
            </Button>
            <Button
              onClick={() => navigate('/accountancy/outreach/campaigns/new')}
              variant="outline"
            >
              Create Campaign
            </Button>
            <Button
              onClick={() => navigate('/accountancy/outreach/research')}
              variant="outline"
            >
              Research Firms
            </Button>
            <Button
              onClick={() => navigate('/accountancy/outreach/analytics')}
              variant="outline"
            >
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns and Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              Track your ongoing outreach campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active campaigns</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first campaign to start reaching prospects
                  </p>
                  <Button
                    onClick={() => navigate('/accountancy/outreach/campaigns/new')}
                    className="mt-4"
                  >
                    Create Campaign
                  </Button>
                </div>
              ) : (
                campaigns.slice(0, 3).map((campaign: any) => (
                  <div key={campaign.id} className="p-4 border-2 border-[#1a2b4a] hover:border-[#ff6b35] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(campaign.type)}
                        <div>
                          <h4 className="font-black text-[#1a2b4a] uppercase">{campaign.name}</h4>
                          <p className="text-sm text-[#1a2b4a]/60 font-bold uppercase">
                            {campaign.status}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(campaign.status)} text-white font-black uppercase`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[#1a2b4a]/60 font-bold uppercase">CREATED</p>
                        <p className="font-black text-[#ff6b35]">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#1a2b4a]/60 font-bold uppercase">TYPE</p>
                        <p className="font-black text-[#ff6b35]">{campaign.type}</p>
                      </div>
                      <div>
                        <p className="text-[#1a2b4a]/60 font-bold uppercase">STATUS</p>
                        <p className="font-black text-[#ff6b35]">{campaign.status}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Client Segments</CardTitle>
            <CardDescription>
              Manage your prospect segments and targeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segments.map((segment: any) => (
                <div key={segment.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{segment.name}</h4>
                      <p className="text-sm text-gray-600">{segment.criteria}</p>
                    </div>
                    <Badge variant="secondary">{segment.clientCount} clients</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Last updated: {segment.lastUpdated}</span>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 