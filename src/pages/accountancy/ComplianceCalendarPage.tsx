import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, Filter, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccountancyContext } from '@/contexts/AccountancyContext';

interface ComplianceEvent {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: 'tax' | 'regulatory' | 'audit' | 'filing' | 'deadline';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
  clientId?: string;
  clientName?: string;
  reminderSent: boolean;
  autoReminder: boolean;
}

const ComplianceCalendarPage: React.FC = () => {
  const context = useAccountancyContext();
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);

  const tier = context?.subscriptionTier || 'free';
  const isFreeTier = tier === 'free';

  useEffect(() => {
    loadComplianceEvents();
  }, []);

  const loadComplianceEvents = async () => {
    try {
      // Mock data for development - replace with actual API call
      const mockEvents: ComplianceEvent[] = [
        {
          id: '1',
          title: 'VAT Return Submission',
          description: 'Submit VAT return for Q1 2024',
          dueDate: '2024-04-30',
          category: 'tax',
          priority: 'high',
          status: 'pending',
          clientId: 'client-1',
          clientName: 'ABC Ltd',
          reminderSent: false,
          autoReminder: true
        },
        {
          id: '2',
          title: 'Annual Accounts Filing',
          description: 'File annual accounts with Companies House',
          dueDate: '2024-05-31',
          category: 'filing',
          priority: 'high',
          status: 'pending',
          clientId: 'client-2',
          clientName: 'XYZ Corp',
          reminderSent: true,
          autoReminder: true
        },
        {
          id: '3',
          title: 'Corporation Tax Payment',
          description: 'Pay corporation tax for year ending 31 March 2024',
          dueDate: '2024-04-01',
          category: 'tax',
          priority: 'high',
          status: 'overdue',
          clientId: 'client-3',
          clientName: 'DEF Ltd',
          reminderSent: true,
          autoReminder: true
        },
        {
          id: '4',
          title: 'Confirmation Statement',
          description: 'Submit confirmation statement to Companies House',
          dueDate: '2024-06-30',
          category: 'filing',
          priority: 'medium',
          status: 'pending',
          clientId: 'client-4',
          clientName: 'GHI Ltd',
          reminderSent: false,
          autoReminder: true
        },
        {
          id: '5',
          title: 'P11D Forms',
          description: 'Submit P11D forms for benefits in kind',
          dueDate: '2024-07-06',
          category: 'regulatory',
          priority: 'medium',
          status: 'pending',
          clientId: 'client-5',
          clientName: 'JKL Corp',
          reminderSent: false,
          autoReminder: true
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading compliance events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryConfig = (category: string) => {
    const configs = {
      tax: { name: 'Tax', color: 'bg-red-500', icon: AlertTriangle },
      regulatory: { name: 'Regulatory', color: 'bg-blue-500', icon: AlertTriangle },
      audit: { name: 'Audit', color: 'bg-purple-500', icon: CheckCircle },
      filing: { name: 'Filing', color: 'bg-green-500', icon: CheckCircle },
      deadline: { name: 'Deadline', color: 'bg-orange-500', icon: Clock }
    };
    return configs[category as keyof typeof configs] || configs.deadline;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const filteredEvents = events.filter(event => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || event.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const overdueEvents = events.filter(event => event.status === 'overdue');
  const upcomingEvents = events.filter(event => 
    event.status === 'pending' && new Date(event.dueDate) > new Date()
  );

  const renderCalendarView = () => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
    
    const calendarDays = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-800 border border-gray-700" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.dueDate);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === selectedMonth.getMonth() && 
               eventDate.getFullYear() === selectedMonth.getFullYear();
      });
      
      calendarDays.push(
        <div key={day} className="h-24 bg-gray-800 border border-gray-700 p-2">
          <div className="text-sm text-gray-400 mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => {
              const config = getCategoryConfig(event.category);
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded ${config.color} text-white truncate cursor-pointer hover:opacity-80`}
                  title={event.title}
                >
                  <Icon className="w-3 h-3 inline mr-1" />
                  {event.title}
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-300">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-4">
        {filteredEvents.map(event => {
          const config = getCategoryConfig(event.category);
          const dueDate = new Date(event.dueDate);
          const isOverdue = dueDate < new Date() && event.status !== 'completed';
          const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card key={event.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(event.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{event.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {config.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Client: {event.clientName || 'N/A'}</span>
                        <span>Priority: <span className={getPriorityColor(event.priority)}>{event.priority}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${isOverdue ? 'text-red-500' : 'text-gray-300'}`}>
                      {dueDate.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `in ${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading Compliance Calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] relative">
      {/* Page Header */}
      <div className="relative bg-[#1a2b4a] py-16 overflow-hidden border-b-4 border-[#ff6b35]">
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-5xl font-black uppercase text-[#f5f1e8] mb-2">COMPLIANCE CALENDAR</h1>
          <p className="text-xl text-[#f5f1e8]/80 font-bold uppercase">Track regulatory deadlines and compliance requirements</p>
        </div>
      </div>
      
      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-red-900/20 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-300">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overdueEvents.length}</div>
            <p className="text-xs text-red-400">tasks require immediate attention</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-900/20 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-300">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{upcomingEvents.length}</div>
            <p className="text-xs text-yellow-400">in the next 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{events.filter(e => e.status === 'completed').length}</div>
            <p className="text-xs text-green-400">tasks finished on time</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-300">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <p className="text-xs text-blue-400">in the calendar</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="filing">Filing</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')} className="ml-4">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4" /> Calendar</TabsTrigger>
              <TabsTrigger value="list"><Filter className="mr-2 h-4 w-4" /> List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isFreeTier && (
        <Card className="mb-6 bg-yellow-900/20 border-yellow-500 text-yellow-300">
          <CardContent className="p-4 flex items-center justify-between">
            <p>
              You are on the Free tier. Upgrade to Professional to unlock automated reminders and client association.
            </p>
            <Button variant="secondary">Upgrade Now</Button>
          </CardContent>
        </Card>
      )}

      {view === 'calendar' ? renderCalendarView() : renderListView()}
      </div>
    </div>
  );
};

export default ComplianceCalendarPage;