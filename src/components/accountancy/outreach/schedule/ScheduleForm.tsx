import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Schedule, Contact, Campaign } from '@/types/outreach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash } from 'lucide-react';

interface ScheduleFormProps {
  scheduleId?: string;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ scheduleId }) => {
  const { practice } = useAccountancyContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [schedule, setSchedule] = useState<Partial<Schedule>>({
    type: 'email',
    status: 'scheduled',
    scheduled_date: new Date().toISOString(),
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!practice?.id) return;

      try {
        setLoading(true);
        
        // Load contacts and campaigns
        const [contactsData, campaignsData] = await Promise.all([
          outreachService.getContacts(practice.id),
          outreachService.getCampaigns(practice.id)
        ]);
        
        setContacts(contactsData);
        setCampaigns(campaignsData);

        // Load schedule item if editing
        if (scheduleId && scheduleId !== 'new') {
          const scheduleData = await outreachService.getSchedule(practice.id);
          const found = scheduleData.find((s: Schedule) => s.id === scheduleId);
          if (found) {
            setSchedule(found);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [practice?.id, scheduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practice?.id) return;

    try {
      setLoading(true);
      if (scheduleId && scheduleId !== 'new') {
        await outreachService.updateScheduleItem(scheduleId, schedule);
      } else {
        await outreachService.createScheduleItem(practice.id, schedule);
      }
      navigate('/accountancy/outreach/schedule');
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduleId || scheduleId === 'new' || !confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setLoading(true);
      // Add delete method to service
      navigate('/accountancy/outreach/schedule');
    } catch (error) {
      console.error('Error deleting schedule:', error);
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
          onClick={() => navigate('/accountancy/outreach/schedule')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schedule
        </Button>
        {scheduleId && scheduleId !== 'new' && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Delete Event
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{scheduleId === 'new' ? 'Schedule Event' : 'Edit Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <Select
                  value={schedule.type}
                  onValueChange={(value) => setSchedule({ ...schedule, type: value as Schedule['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={schedule.status}
                  onValueChange={(value) => setSchedule({ ...schedule, status: value as Schedule['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <Select
                  value={schedule.contact_id}
                  onValueChange={(value) => setSchedule({ ...schedule, contact_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Campaign (Optional)</label>
                <Select
                  value={schedule.campaign_id}
                  onValueChange={(value) => setSchedule({ ...schedule, campaign_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={schedule.scheduled_date?.slice(0, 16)}
                  onChange={(e) => setSchedule({ ...schedule, scheduled_date: new Date(e.target.value).toISOString() })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={schedule.notes || ''}
                  onChange={(e) => setSchedule({ ...schedule, notes: e.target.value })}
                  placeholder="Add any notes or details about this event"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/accountancy/outreach/schedule')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 