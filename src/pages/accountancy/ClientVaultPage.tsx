import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  DocumentIcon, 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyPoundIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../../contexts/AccountancyContext';
import { supabase } from '../../lib/supabase/client';
import ClientVaultDashboard from '../../components/accountancy/vault/ClientVaultDashboard';
import ComplianceCalendarWidget from '../../components/accountancy/vault/ComplianceCalendarWidget';
import PaymentScheduleTracker from '../../components/accountancy/vault/PaymentScheduleTracker';
import FilingDeadlineManager from '../../components/accountancy/vault/FilingDeadlineManager';
import DocumentVersionControl from '../../components/accountancy/vault/DocumentVersionControl';
import ClientSelector from '../../components/accountancy/vault/ClientSelector';

interface VaultData {
  clientId: string;
  clientName: string;
  companyNumber: string;
  vatNumber: string;
  upcomingDeadlines: Deadline[];
  paymentsDue: Payment[];
  documents: Document[];
  complianceItems: ComplianceItem[];
  alerts: Alert[];
}

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


interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completionPercentage: number;
  notes: string;
}

interface Alert {
  id: string;
  type: 'deadline' | 'payment' | 'compliance' | 'document';
  severity: 'info' | 'warning' | 'error';
  message: string;
  relatedId?: string;
  createdAt: string;
}

const ClientVaultPage = () => {
  const { practice } = useAccountancyContext();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deadlines' | 'payments' | 'documents' | 'compliance'>('overview');
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');

  useEffect(() => {
    console.log('ClientVaultPage mounted', { clientId, selectedClientId, practiceId: practice?.id });
    if (selectedClientId) {
      fetchVaultData();
    } else {
      setLoading(false);
    }
  }, [selectedClientId, practice?.id]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const [deadlines, payments, documents, compliance, client, alerts] = await Promise.all([
        fetch(`${apiUrl}/accountancy/vault/deadlines?clientId=${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => []),
        
        fetch(`${apiUrl}/accountancy/vault/payments?clientId=${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => []),
        
        fetch(`${apiUrl}/accountancy/vault/documents?clientId=${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => []),
        
        fetch(`${apiUrl}/accountancy/vault/compliance?clientId=${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => []),
        
        fetch(`${apiUrl}/accountancy/clients/${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ name: 'Unknown Client' })),
        
        fetch(`${apiUrl}/accountancy/vault/alerts?clientId=${selectedClientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => [])
      ]);

      setVaultData({
        clientId: selectedClientId,
        clientName: client.name,
        companyNumber: client.company_number || '',
        vatNumber: client.vat_number || '',
        upcomingDeadlines: deadlines || [],
        paymentsDue: payments || [],
        documents: documents || [],
        complianceItems: compliance || [],
        alerts: alerts || []
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate(`/accountancy/portal/client-vault/${clientId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client vault...</p>
        </div>
      </div>
    );
  }

  if (!selectedClientId) {
    return <ClientSelector onClientSelect={handleClientSelect} practiceId={practice?.id || ''} />;
  }

  if (!vaultData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No data available for this client</p>
      </div>
    );
  }

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: DocumentIcon, count: null },
    { id: 'deadlines', label: 'Deadlines', icon: CalendarIcon, count: vaultData.upcomingDeadlines.length },
    { id: 'payments', label: 'Payments', icon: CurrencyPoundIcon, count: vaultData.paymentsDue.length },
    { id: 'documents', label: 'Documents', icon: DocumentIcon, count: vaultData.documents.length },
    { id: 'compliance', label: 'Compliance', icon: CheckCircleIcon, count: vaultData.complianceItems.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/accountancy/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Client Vault</h1>
            <p className="mt-1 text-gray-600">
              {vaultData.clientName} - Single Source of Truth
              {vaultData.companyNumber && (
                <span className="ml-2 text-sm text-gray-500">
                  Company No: {vaultData.companyNumber}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setSelectedClientId('')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Change Client
          </button>
        </div>

        {/* Alert Banner */}
        {vaultData.alerts.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <BellIcon className="w-5 h-5 text-yellow-400 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  {vaultData.alerts.length} alert{vaultData.alerts.length !== 1 ? 's' : ''} require your attention
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {vaultData.alerts[0].message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <ClientVaultDashboard vaultData={vaultData} onRefresh={fetchVaultData} />
        )}
        {activeTab === 'deadlines' && (
          <FilingDeadlineManager 
            deadlines={vaultData.upcomingDeadlines} 
            clientId={selectedClientId} 
            clientName={vaultData.clientName}
            onUpdate={fetchVaultData} 
          />
        )}
        {activeTab === 'payments' && (
          <PaymentScheduleTracker 
            payments={vaultData.paymentsDue} 
            clientId={selectedClientId}
            clientName={vaultData.clientName}
            onUpdate={fetchVaultData} 
          />
        )}
        {activeTab === 'documents' && (
          <DocumentVersionControl 
            documents={vaultData.documents} 
            clientId={selectedClientId}
            clientName={vaultData.clientName}
            onUpdate={fetchVaultData} 
          />
        )}
        {activeTab === 'compliance' && (
          <ComplianceCalendarWidget 
            items={vaultData.complianceItems} 
            clientId={selectedClientId}
            clientName={vaultData.clientName}
            onUpdate={fetchVaultData} 
          />
        )}
      </div>
    </div>
  );
};

export default ClientVaultPage;
