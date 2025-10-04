import { 
  CalendarIcon, 
  CurrencyPoundIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface VaultData {
  clientId: string;
  clientName: string;
  companyNumber: string;
  vatNumber: string;
  upcomingDeadlines: any[];
  paymentsDue: any[];
  documents: any[];
  complianceItems: any[];
  alerts: any[];
}

interface ClientVaultDashboardProps {
  vaultData: VaultData;
  onRefresh: () => void;
}

const ClientVaultDashboard = ({ vaultData, onRefresh }: ClientVaultDashboardProps) => {
  const upcomingDeadlines = vaultData.upcomingDeadlines
    .filter(d => d.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const overduePayments = vaultData.paymentsDue.filter(p => p.status === 'overdue');
  const pendingCompliance = vaultData.complianceItems.filter(c => c.status !== 'completed');
  const recentDocuments = vaultData.documents.slice(0, 5);

  const statsCards = [
    {
      title: 'Upcoming Deadlines',
      value: upcomingDeadlines.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Payments Due',
      value: vaultData.paymentsDue.filter(p => p.status === 'pending').length,
      icon: CurrencyPoundIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Documents',
      value: vaultData.documents.length,
      icon: DocumentIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Compliance Items',
      value: pendingCompliance.length,
      icon: CheckCircleIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  const getDeadlineStatus = (dueDate: string) => {
    const days = Math.floor((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (days <= 7) return { label: `${days} days`, color: 'text-amber-600', bgColor: 'bg-amber-50' };
    return { label: `${days} days`, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical Alerts */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Overdue Payments</h3>
                <p className="text-sm text-red-700 mt-1">
                  {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue - 
                  immediate action required
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No upcoming deadlines</p>
              ) : (
                upcomingDeadlines.map((deadline) => {
                  const status = getDeadlineStatus(deadline.dueDate);
                  return (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{deadline.type}</p>
                        <p className="text-sm text-gray-600">{deadline.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={`${status.bgColor} ${status.color} border-0`}>
                          {status.label}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(deadline.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DocumentIcon className="h-5 w-5" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No documents uploaded</p>
              ) : (
                recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          v{doc.version} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{doc.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      {pendingCompliance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              Compliance Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCompliance.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.completionPercentage}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Due {new Date(item.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.priority === 'critical' ? 'destructive' :
                        item.priority === 'high' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={onRefresh} variant="outline">
          <ClockIcon className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default ClientVaultDashboard;

