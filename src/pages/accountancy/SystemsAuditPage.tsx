import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CogIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../contexts/AccountancyContext';

interface AuditItem {
  id: string;
  category: string;
  system: string;
  description: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: string;
  recommendation?: string;
}

interface SystemsAuditData {
  clientId: string;
  clientName: string;
  auditDate: string;
  overallScore: number;
  items: AuditItem[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    pending: number;
  };
}

export default function SystemsAuditPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { practice, subscriptionTier } = useAccountancyContext();
  const [auditData, setAuditData] = useState<SystemsAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAuditData();
  }, [clientId, practice?.id]);

  const loadAuditData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: SystemsAuditData = {
        clientId: clientId || 'all',
        clientName: clientId ? 'Sample Client Ltd' : 'All Clients',
        auditDate: '2024-01-20',
        overallScore: 78,
        items: [
          {
            id: '1',
            category: 'Security',
            system: 'Password Policy',
            description: 'Strong password requirements enforced',
            status: 'pass',
            priority: 'high',
            lastChecked: '2024-01-20'
          },
          {
            id: '2',
            category: 'Backup',
            system: 'Data Backup',
            description: 'Regular backups not configured',
            status: 'fail',
            priority: 'critical',
            lastChecked: '2024-01-20',
            recommendation: 'Configure automated daily backups with off-site storage'
          },
          {
            id: '3',
            category: 'Access Control',
            system: 'User Permissions',
            description: 'Some users have excessive permissions',
            status: 'warning',
            priority: 'medium',
            lastChecked: '2024-01-20',
            recommendation: 'Review and restrict user permissions following principle of least privilege'
          }
        ],
        summary: {
          passed: 12,
          warnings: 5,
          failed: 3,
          pending: 2
        }
      };

      setAuditData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading audit data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isProfessionalPlus = ['professional', 'excellence', 'enterprise'].includes(subscriptionTier);

  if (!isProfessionalPlus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockClosedIcon className="h-6 w-6 text-amber-500" />
              Professional Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Systems Audit is available on Professional tier and above.
            </p>
            <Button onClick={() => navigate('/accountancy/manage-subscription')}>
              Upgrade Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'fail':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CogIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <CogIcon className="h-8 w-8 text-blue-400" />
              Systems Audit
            </h1>
            <p className="text-gray-400">
              IT systems and security audit for {auditData?.clientName}
            </p>
          </div>
          <Badge className="bg-orange-500">NEW</Badge>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Overall Security Score</h3>
              <p className="text-gray-400 text-sm">Last audited: {auditData?.auditDate}</p>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(auditData?.overallScore || 0)}`}>
              {auditData?.overallScore}
              <span className="text-2xl">/100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {auditData?.summary.passed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {auditData?.summary.warnings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {auditData?.summary.failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CogIcon className="h-5 w-5 text-gray-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {auditData?.summary.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          <Button
            variant={selectedCategory === 'Security' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Security')}
          >
            Security
          </Button>
          <Button
            variant={selectedCategory === 'Backup' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Backup')}
          >
            Backup
          </Button>
          <Button
            variant={selectedCategory === 'Access Control' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('Access Control')}
          >
            Access Control
          </Button>
        </div>
      </div>

      {/* Audit Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Findings</CardTitle>
            <Button>Run New Audit</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditData?.items
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-800 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: 
                      item.status === 'pass' ? '#10b981' :
                      item.status === 'warning' ? '#f59e0b' :
                      item.status === 'fail' ? '#ef4444' : '#6b7280'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <h4 className="font-semibold text-white">{item.system}</h4>
                        <Badge variant="outline" className="ml-2">{item.category}</Badge>
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
                      <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                      {item.recommendation && (
                        <div className="mt-2 p-2 bg-gray-900 rounded">
                          <p className="text-xs text-gray-300">
                            <strong>Recommendation:</strong> {item.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
          </div>

          {(!auditData?.items || auditData.items.length === 0) && (
            <div className="text-center py-12">
              <CogIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No audit items found</p>
              <Button className="mt-4">Run First Audit</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

