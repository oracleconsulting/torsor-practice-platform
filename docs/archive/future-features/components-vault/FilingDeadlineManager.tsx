import { useState } from 'react';
import { 
  CalendarIcon, 
  PlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface Deadline {
  id: string;
  type: 'VAT' | 'Corporation Tax' | 'PAYE' | 'Accounts Filing' | 'Confirmation Statement' | 'Self Assessment';
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  clientId: string;
  remindersSent: number;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface FilingDeadlineManagerProps {
  deadlines: Deadline[];
  clientId: string;
  clientName: string;
  onUpdate: () => void;
}

const FilingDeadlineManager = ({ deadlines }: FilingDeadlineManagerProps) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('all');

  const getDaysUntilDue = (dueDate: string) => {
    return Math.floor((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (deadline: Deadline) => {
    const days = getDaysUntilDue(deadline.dueDate);
    
    if (deadline.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (days < 0 || deadline.status === 'overdue') {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    if (days <= 7) {
      return <Badge className="bg-amber-100 text-amber-800">Due Soon</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
  };

  const filteredDeadlines = deadlines.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'pending') return d.status === 'pending' || d.status === 'in_progress';
    if (filter === 'overdue') return d.status === 'overdue' || getDaysUntilDue(d.dueDate) < 0;
    return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Filing Deadlines</h2>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({deadlines.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({deadlines.filter(d => d.status === 'pending' || d.status === 'in_progress').length})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          onClick={() => setFilter('overdue')}
        >
          Overdue ({deadlines.filter(d => d.status === 'overdue' || getDaysUntilDue(d.dueDate) < 0).length})
        </Button>
      </div>

      {/* Deadlines List */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deadlines found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDeadlines.map((deadline) => {
            const days = getDaysUntilDue(deadline.dueDate);
            return (
              <Card key={deadline.id} className={days < 0 && deadline.status !== 'completed' ? 'border-red-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{deadline.type}</h3>
                        {getStatusBadge(deadline)}
                        <Badge variant={
                          deadline.priority === 'critical' ? 'destructive' :
                          deadline.priority === 'high' ? 'destructive' :
                          'secondary'
                        }>
                          {deadline.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{deadline.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
                          {days >= 0 && deadline.status !== 'completed' && (
                            <span className="ml-1">({days} days)</span>
                          )}
                        </div>
                        {deadline.assignedTo && (
                          <div className="flex items-center gap-1">
                            <span>Assigned to: {deadline.assignedTo}</span>
                          </div>
                        )}
                        {deadline.remindersSent > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{deadline.remindersSent} reminder{deadline.remindersSent !== 1 ? 's' : ''} sent</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {deadline.status !== 'completed' && (
                        <>
                          <Button variant="outline" size="sm">
                            Send Reminder
                          </Button>
                          <Button size="sm">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        </>
                      )}
                      {deadline.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FilingDeadlineManager;

