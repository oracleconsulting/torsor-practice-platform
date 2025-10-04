import React, { useEffect, useState } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Campaign } from '@/types/outreach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Phone, Calendar, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CampaignList = () => {
  const { practice } = useAccountancyContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        if (practice?.id) {
          const data = await outreachService.getCampaigns(practice.id);
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [practice?.id]);

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'meeting':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'draft':
        return 'text-gray-500';
      case 'completed':
        return 'text-blue-500';
      case 'archived':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <Button onClick={() => navigate('new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card 
            key={campaign.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(campaign.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                {campaign.name}
              </CardTitle>
              {getTypeIcon(campaign.type)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 line-clamp-2">
                  {campaign.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                  {campaign.scheduled_date && (
                    <span className="text-sm text-gray-500">
                      {new Date(campaign.scheduled_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No campaigns yet</h3>
            <p className="text-gray-500 mt-1">Create your first campaign to get started</p>
            <Button 
              onClick={() => navigate('new')} 
              variant="outline"
              className="mt-4"
            >
              Create Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 