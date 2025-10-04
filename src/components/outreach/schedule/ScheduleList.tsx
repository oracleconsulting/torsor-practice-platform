import React, { useEffect, useState } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Schedule } from '@/types/outreach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Clock, Mail, Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export const ScheduleList = () => {
  const { practice } = useAccountancyContext();
  const [scheduleItems, setScheduleItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        if (practice?.id) {
          const data = await outreachService.getSchedule(practice.id);
          setScheduleItems(data);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [practice?.id]);

  const getTypeIcon = (type: Schedule['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'meeting':
        return <Video className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const filteredItems = scheduleItems.filter(item => {
    const itemDate = new Date(item.scheduled_date);
    return (
      itemDate.getDate() === selectedDate.getDate() &&
      itemDate.getMonth() === selectedDate.getMonth() &&
      itemDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  if (loading) {
    return <div>Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
        <Button onClick={() => navigate('new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Schedule Items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>

          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No events scheduled for this day</p>
                <Button 
                  onClick={() => navigate('new')} 
                  variant="outline"
                  className="mt-4"
                >
                  Schedule Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        item.type === 'email' ? 'bg-blue-100' :
                        item.type === 'call' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Event
                            </h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(item.scheduled_date), 'h:mm a')}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 