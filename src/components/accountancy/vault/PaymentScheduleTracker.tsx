import { useState } from 'react';
import { 
  CurrencyPoundIcon, 
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'scheduled';
  recurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'annually';
  reference?: string;
}

interface PaymentScheduleTrackerProps {
  payments: Payment[];
  clientId: string;
  clientName: string;
  onUpdate: () => void;
}

const PaymentScheduleTracker = ({ payments }: PaymentScheduleTrackerProps) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusBadge = (payment: Payment) => {
    switch (payment.status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalDue = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter(p => p.status === 'overdue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Schedule</h2>
          <p className="text-gray-600 mt-1">
            Total Due: <span className="font-semibold text-gray-900">{formatCurrency(totalDue)}</span>
          </p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Alert for Overdue Payments */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Overdue Payments</h3>
                <p className="text-sm text-red-700 mt-1">
                  {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue totaling{' '}
                  {formatCurrency(overduePayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({payments.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({payments.filter(p => p.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          onClick={() => setFilter('overdue')}
        >
          Overdue ({overduePayments.length})
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          onClick={() => setFilter('paid')}
        >
          Paid ({payments.filter(p => p.status === 'paid').length})
        </Button>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CurrencyPoundIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className={payment.status === 'overdue' ? 'border-red-200' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{payment.description}</h3>
                      {getStatusBadge(payment)}
                      {payment.recurring && (
                        <Badge variant="outline">
                          Recurring {payment.frequency}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CurrencyPoundIcon className="h-4 w-4" />
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                      {payment.reference && (
                        <div>
                          Ref: {payment.reference}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {payment.status !== 'paid' && (
                      <Button size="sm">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    )}
                    {payment.status === 'paid' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Paid</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentScheduleTracker;

