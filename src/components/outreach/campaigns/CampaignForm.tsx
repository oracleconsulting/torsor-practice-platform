import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Campaign } from '@/types/outreach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Trash } from 'lucide-react';

interface CampaignFormProps {
  campaignId?: string;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ campaignId }) => {
  const { practice } = useAccountancyContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
  });

  useEffect(() => {
    const loadCampaign = async () => {
      if (campaignId && campaignId !== 'new' && practice?.id) {
        try {
          setLoading(true);
          const data = await outreachService.getCampaigns(practice.id);
          const found = data.find((c: Campaign) => c.id === campaignId);
          if (found) {
            setCampaign(found);
          }
        } catch (error) {
          console.error('Error loading campaign:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCampaign();
  }, [campaignId, practice?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practice?.id) return;

    try {
      setLoading(true);
      if (campaignId && campaignId !== 'new') {
        await outreachService.updateCampaign(campaignId, campaign);
      } else {
        await outreachService.createCampaign(practice.id, campaign);
      }
      navigate('/accountancy/outreach/campaigns');
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignId || campaignId === 'new' || !confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      setLoading(true);
      // Add delete method to service
      navigate('/accountancy/outreach/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/accountancy/outreach/campaigns')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
        {campaignId && campaignId !== 'new' && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Delete Campaign
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{campaignId === 'new' ? 'Create Campaign' : 'Edit Campaign'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                <Input
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  placeholder="Enter campaign name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={campaign.description || ''}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                  placeholder="Enter campaign description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select
                    value={campaign.type}
                    onValueChange={(value) => setCampaign({ ...campaign, type: value as Campaign['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={campaign.status}
                    onValueChange={(value) => setCampaign({ ...campaign, status: value as Campaign['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                <Input
                  type="datetime-local"
                  value={campaign.scheduled_date || ''}
                  onChange={(e) => setCampaign({ ...campaign, scheduled_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/accountancy/outreach/campaigns')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Campaign'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 