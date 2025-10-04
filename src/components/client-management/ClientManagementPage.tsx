import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  ExternalLink,
  Mail,
  Shield,
  Activity,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  UserPlus
} from 'lucide-react';
import { 
  AccountingClient, 
  ClientManagementSummary,
  ClientPortalStats 
} from '../types/accountancy';
import { clientManagementService } from '../services/accountancy/clientManagementService';
import { Header } from '../Header';
import { ClientList } from './ClientList';
import { ClientDetails } from './ClientDetails';
import { ClientPortalView } from './ClientPortalView';
import { AddClientModal } from './AddClientModal';
import { InviteClientModal } from './InviteClientModal';
import { ClientStats } from './ClientStats';

interface ClientManagementPageProps {
  practiceId?: string; // Make optional since it comes from auth context
}

export const ClientManagementPage: React.FC<ClientManagementPageProps> = ({ practiceId }) => {
  const [clients, setClients] = useState<AccountingClient[]>([]);
  const [summary, setSummary] = useState<ClientManagementSummary | null>(null);
  const [selectedClient, setSelectedClient] = useState<AccountingClient | null>(null);
  const [portalStats, setPortalStats] = useState<ClientPortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'portal'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!practiceId) {
      console.error('No practice ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load clients
      const clients = await clientManagementService.getClients(practiceId);
      setClients(clients);
      
      // Create summary from clients data
      const summary: ClientManagementSummary = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        clientsWithPortals: clients.filter(c => c.portalAccess.enabled).length,
        portalAdoptionRate: clients.length > 0 ? (clients.filter(c => c.portalAccess.enabled).length / clients.length) * 100 : 0,
        recentActivity: [],
        upcomingDeadlines: [],
        revenueByClient: clients.map(c => ({
          clientId: c.id,
          clientName: c.name,
          annualRevenue: 0 // TODO: Get from financials
        })),
        complianceAlerts: 0,
        storageUsage: {
          totalUsed: 0,
          totalLimit: 1024 * 1024 * 1024 * clients.length, // 1GB per client
          averagePerClient: 0
        }
      };
      setSummary(summary);
    } catch (err) {
      console.error('Error loading data:', err);
      setClients([]);
      setSummary({
        totalClients: 0,
        activeClients: 0,
        clientsWithPortals: 0,
        portalAdoptionRate: 0,
        recentActivity: [],
        upcomingDeadlines: [],
        revenueByClient: [],
        complianceAlerts: 0,
        storageUsage: {
          totalUsed: 0,
          totalLimit: 1024 * 1024 * 1024,
          averagePerClient: 0
        }
      });
      if (!(err as any).message?.includes('authentication')) {
        setError('Failed to load client data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (client: AccountingClient) => {
    setSelectedClient(client);
    
    setViewMode('details');
  };

  const handleViewPortal = () => {
    setViewMode('portal');
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setPortalStats(null);
    setViewMode('list');
  };

  const handleAddClient = async (clientData: Partial<AccountingClient>) => {
    if (!practiceId) {
      setError('No practice ID available');
      return;
    }
    
    try {
      const newClient = await clientManagementService.createClient(practiceId, clientData);
      setClients(prev => [...prev, newClient]);
      setShowAddModal(false);
      // Reload data to get updated summary
      loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create client');
    }
  };

  const handleUpdateClient = async (clientId: string, clientData: Partial<AccountingClient>) => {
    // TODO: Implement update functionality
    console.log('Update client:', clientId, clientData);
    setError('Update functionality not yet implemented');
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      // TODO: Implement delete functionality
      console.log('Delete client:', clientId);
      setError('Delete functionality not yet implemented');
    }
  };

  const handleTogglePortalAccess = async (clientId: string, enabled: boolean) => {
    // TODO: Implement portal access toggle
    console.log('Toggle portal access:', clientId, enabled);
    setError('Portal access toggle not yet implemented');
  };

  const handleInviteClient = async (email: string, message: string, clientName?: string) => {
    try {
      console.log('handleInviteClient called with:', { email, message, clientName });
      
      // First create the client if name is provided
      if (clientName) {
        const clientData = {
          name: clientName,
          email: email,
          contactName: clientName,
          phone: "", // Add default phone
          industry: "Other", // Add default industry
          size: "small" as const, // Add default size with proper type
          status: 'prospect' as const
        };
        
        console.log('Creating client with data:', clientData);
        const createResponse = await clientManagementService.createClient(practiceId!, clientData);
        console.log('Create response:', createResponse);
        
        // CRITICAL: Add delay to ensure database transaction completes
        console.log('Waiting for database to commit...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Add the new client to the list
        setClients(prev => [...prev, createResponse]);
        await loadData();
        setShowInviteModal(false);
        setError(null);
      } else {
        // Just send invitation to email - need a client ID for this
        // For now, we'll require a client name
        setError('Client name is required to send invitation');
        return;
      }
    } catch (err) {
      console.error('Error in handleInviteClient:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite client');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 bg-[#f5f1e8]">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="relative group">
            <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
            <div className="relative bg-white border-2 border-[#1a2b4a] p-8 shadow-lg text-center">
              <div className="animate-spin w-10 h-10 border-4 border-[#ff6b35] border-t-transparent mx-auto mb-4" />
              <div className="text-[#1a2b4a] font-black uppercase text-lg">LOADING CLIENTS...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full p-6 bg-[#f5f1e8]">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="relative group">
            <div className="absolute -top-2 -left-2 w-full h-full border-2 border-[#ff6b35] group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300" />
            <div className="relative bg-white border-2 border-[#1a2b4a] p-8 shadow-lg text-center">
              <AlertTriangle className="w-10 h-10 text-[#ef4444] mx-auto mb-4" />
              <div className="text-[#1a2b4a] font-black uppercase text-lg mb-2">ERROR</div>
              <div className="text-[#1a2b4a] mb-4 font-bold">{error}</div>
              <button 
                onClick={loadData}
                className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-6 py-3 font-black uppercase transition-all duration-300"
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#f5f1e8]">
      <Header />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black uppercase text-[#1a2b4a] mb-2">CLIENT MANAGEMENT</h1>
              <p className="text-[#1a2b4a] font-bold uppercase">MANAGE YOUR CLIENTS AND THEIR PORTAL ACCESS</p>
            </div>
            
            {viewMode === 'list' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-6 py-3 font-black uppercase transition-all duration-300 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  ADD CLIENT
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#4a90e2] hover:bg-[#3a7bc8] text-white px-6 py-3 font-black uppercase transition-all duration-300 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  INVITE CLIENT
                </button>
              </div>
            )}
            
            {viewMode !== 'list' && (
              <button
                onClick={handleBackToList}
                className="bg-[#1a2b4a] hover:bg-[#0f172a] text-[#f5f1e8] px-6 py-3 font-black uppercase transition-all duration-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                BACK TO LIST
              </button>
            )}
          </div>

          {/* Stats Overview */}
          {viewMode === 'list' && summary && (
            <ClientStats summary={summary} />
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {viewMode === 'list' && (
            <ClientList
              clients={filteredClients}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onClientSelect={handleClientSelect}
              onDeleteClient={handleDeleteClient}
              onTogglePortalAccess={handleTogglePortalAccess}
            />
          )}

          {viewMode === 'details' && selectedClient && (
            <ClientDetails
              client={selectedClient}
              onUpdate={handleUpdateClient}
              onDelete={handleDeleteClient}
              onTogglePortalAccess={handleTogglePortalAccess}
              onViewPortal={handleViewPortal}
            />
          )}

          {viewMode === 'portal' && selectedClient && portalStats && (
            <ClientPortalView
              client={selectedClient}
              portalStats={portalStats}
              onBack={handleBackToList}
            />
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddClient}
        />
      )}

      {/* Invite Client Modal */}
      {showInviteModal && (
        <InviteClientModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteClient}
        />
      )}
    </div>
  );
};