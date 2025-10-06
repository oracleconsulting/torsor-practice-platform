/**
 * Systems Audit Page - Business Operations Focus
 * Last Updated: 2025-01-20 20:15 UTC
 * Build Version: 2.0.3 - EXPLICIT COLOR VALUES
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CogIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../../contexts/AccountancyContext';

interface AuditItem {
  id: string;
  category: string;
  system: string;
  description: string;
  status: 'optimized' | 'needs_attention' | 'inefficient' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: string;
  recommendation?: string;
  potentialSavings?: string;
  efficiencyGain?: string;
}

interface SystemsAuditData {
  clientId: string;
  clientName: string;
  auditDate: string;
  overallScore: number;
  items: AuditItem[];
  summary: {
    optimized: number;
    needsAttention: number;
    inefficient: number;
    pending: number;
  };
  potentialSavings: {
    timeHoursPerMonth: number;
    costPerMonth: number;
    cashflowImprovement: number;
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
        auditDate: '2025-01-20',
        overallScore: 78,
        items: [
          {
            id: '1',
            category: 'Invoicing',
            system: 'Invoice Generation & Delivery',
            description: 'Manual invoice creation taking 2 hours per week',
            status: 'inefficient',
            priority: 'high',
            lastChecked: '2025-01-20',
            recommendation: 'Implement automated invoicing system (Xero/QuickBooks) to reduce time to 15 minutes per week',
            potentialSavings: '£400/month',
            efficiencyGain: '87% time saved'
          },
          {
            id: '2',
            category: 'Payments',
            system: 'Payment Collection',
            description: 'Average payment received in 45 days',
            status: 'needs_attention',
            priority: 'critical',
            lastChecked: '2025-01-20',
            recommendation: 'Implement automated payment reminders and online payment portal to reduce to 21 days',
            potentialSavings: 'Improved cashflow by £12,000',
            efficiencyGain: '53% faster payment'
          },
          {
            id: '3',
            category: 'Expense Management',
            system: 'Expense Tracking & Approval',
            description: 'Using spreadsheets, 4 hours monthly reconciliation',
            status: 'inefficient',
            priority: 'medium',
            lastChecked: '2025-01-20',
            recommendation: 'Deploy digital expense management system (Expensify/Receipt Bank) for real-time tracking',
            potentialSavings: '£250/month',
            efficiencyGain: '75% time saved'
          },
          {
            id: '4',
            category: 'Payroll',
            system: 'Payroll Processing',
            description: 'Efficient automated payroll system in use',
            status: 'optimized',
            priority: 'low',
            lastChecked: '2025-01-20',
            recommendation: 'Continue current practices'
          },
          {
            id: '5',
            category: 'Inventory Management',
            system: 'Stock Control',
            description: 'Manual stocktakes causing inventory discrepancies',
            status: 'needs_attention',
            priority: 'high',
            lastChecked: '2025-01-20',
            recommendation: 'Implement barcode scanning system for real-time inventory tracking',
            potentialSavings: '£800/month in reduced stock loss',
            efficiencyGain: '90% accuracy improvement'
          },
          {
            id: '6',
            category: 'Procurement',
            system: 'Purchase Order System',
            description: 'No formal purchase order process',
            status: 'inefficient',
            priority: 'medium',
            lastChecked: '2025-01-20',
            recommendation: 'Establish digital PO system with approval workflows to control spending',
            potentialSavings: '£600/month in prevented overspend',
            efficiencyGain: '100% visibility gained'
          },
          {
            id: '7',
            category: 'Banking',
            system: 'Bank Reconciliation',
            description: 'Manual reconciliation taking 3 hours monthly',
            status: 'needs_attention',
            priority: 'medium',
            lastChecked: '2025-01-20',
            recommendation: 'Enable automated bank feeds in accounting software',
            potentialSavings: '£200/month',
            efficiencyGain: '80% time saved'
          },
          {
            id: '8',
            category: 'Reporting',
            system: 'Financial Reporting',
            description: 'Monthly reports compiled manually from multiple sources',
            status: 'inefficient',
            priority: 'high',
            lastChecked: '2025-01-20',
            recommendation: 'Configure automated dashboards with real-time KPIs',
            potentialSavings: '£500/month',
            efficiencyGain: 'Real-time visibility'
          }
        ],
        summary: {
          optimized: 1,
          needsAttention: 3,
          inefficient: 4,
          pending: 0
        },
        potentialSavings: {
          timeHoursPerMonth: 32,
          costPerMonth: 2750,
          cashflowImprovement: 12000
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
              Business Systems Audit is available on Professional tier and above. This feature helps you identify inefficiencies in your clients' operational systems to save time, reduce costs, and improve cashflow.
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
      case 'optimized':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'needs_attention':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'inefficient':
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

  console.log('SystemsAuditPage rendering', { clientId, auditData: auditData ? 'loaded' : 'null' });

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2 flex items-center gap-2">
              <CogIcon className="h-8 w-8 text-blue-400" />
              Business Systems Audit
            </h1>
            <p className="text-gray-300">
              Operational systems efficiency analysis for {auditData?.clientName} • v2.0.4
            </p>
          </div>
          <Badge className="bg-orange-500 text-white font-semibold">NEW</Badge>
        </div>
      </div>

      {/* Overall Score & Potential Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Efficiency Score</h3>
                <p className="text-gray-300 text-sm">Last audited: {auditData?.auditDate}</p>
              </div>
              <div className={`text-6xl font-bold ${getScoreColor(auditData?.overallScore || 0)}`}>
                {auditData?.overallScore}
                <span className="text-2xl">/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 drop-shadow-md">Potential Savings</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium drop-shadow-sm">Time Saved:</span>
                <span className="text-2xl font-bold text-white drop-shadow-md">{auditData?.potentialSavings.timeHoursPerMonth}h/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-medium drop-shadow-sm">Cost Reduction:</span>
                <span className="text-2xl font-bold text-white drop-shadow-md">£{auditData?.potentialSavings.costPerMonth.toLocaleString()}/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-medium drop-shadow-sm">Cashflow Gain:</span>
                <span className="text-2xl font-bold text-white drop-shadow-md">£{auditData?.potentialSavings.cashflowImprovement.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gray-800 border-gray-700 hover:border-green-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-100">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              Optimized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {auditData?.summary.optimized}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:border-amber-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-100">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {auditData?.summary.needsAttention}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-100">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              Inefficient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {auditData?.summary.inefficient}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-100">
              <CogIcon className="h-5 w-5 text-gray-400" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {auditData?.summary.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            All Systems
          </button>
          <button
            onClick={() => setSelectedCategory('Invoicing')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Invoicing' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Invoicing
          </button>
          <button
            onClick={() => setSelectedCategory('Payments')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Payments' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setSelectedCategory('Expense Management')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Expense Management' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setSelectedCategory('Payroll')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Payroll' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Payroll
          </button>
          <button
            onClick={() => setSelectedCategory('Inventory Management')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Inventory Management' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setSelectedCategory('Procurement')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Procurement' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Procurement
          </button>
          <button
            onClick={() => setSelectedCategory('Banking')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Banking' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Banking
          </button>
          <button
            onClick={() => setSelectedCategory('Reporting')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCategory === 'Reporting' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-gray-700 border border-gray-600 text-gray-100 hover:bg-gray-600'
            }`}
          >
            Reporting
          </button>
        </div>
      </div>

      {/* Audit Items */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-100">Audit Findings</CardTitle>
            <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              Run New Audit
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditData?.items
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-850 rounded-lg border-l-4 hover:bg-gray-800 transition-colors"
                  style={{
                    borderLeftColor: 
                      item.status === 'optimized' ? '#10b981' :
                      item.status === 'needs_attention' ? '#f59e0b' :
                      item.status === 'inefficient' ? '#ef4444' : '#6b7280',
                    backgroundColor: '#1f2937'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusIcon(item.status)}
                        <h4 className="font-semibold text-gray-100">{item.system}</h4>
                        <Badge variant="outline" className="ml-2 border-gray-600 text-gray-200 bg-gray-700">{item.category}</Badge>
                        <Badge 
                          className={
                            item.priority === 'critical' ? 'bg-red-600 text-white' :
                            item.priority === 'high' ? 'bg-orange-600 text-white' :
                            'bg-gray-600 text-gray-200'
                          }
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{item.description}</p>
                      {item.potentialSavings && (
                        <div className="flex gap-4 mt-2 flex-wrap">
                          <Badge variant="outline" className="bg-green-700 text-green-100 border-green-600 font-medium">
                            💰 {item.potentialSavings}
                          </Badge>
                          {item.efficiencyGain && (
                            <Badge variant="outline" className="bg-blue-700 text-blue-100 border-blue-600 font-medium">
                              ⚡ {item.efficiencyGain}
                            </Badge>
                          )}
                        </div>
                      )}
                      {item.recommendation && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-600">
                          <p className="text-sm text-gray-200">
                            <strong className="text-gray-100">Recommendation:</strong> {item.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                    <button className="px-3 py-1.5 text-sm rounded-md bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 font-medium transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {(!auditData?.items || auditData.items.length === 0) && (
            <div className="text-center py-12">
              <CogIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300">No audit items found</p>
              <button className="mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                Run First Audit
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

