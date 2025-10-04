import { 
  AccountingClient, 
  ClientManagementSummary, 
  ClientPortalStats,
  ClientService,
  ClientPortalAccess,
  ClientDocument,
  ClientActivity,
  ComplianceAction
} from '../../types/accountancy';
import { supabase } from '@/lib/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';

async function getAuthHeaders() {
  const session = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.data.session?.access_token || ''}`
  };
}

export const clientManagementService = {
  async getClients(practiceId: string): Promise<AccountingClient[]> {
    if (!practiceId) {
      console.error('[ClientService] No practice ID provided');
      return [];
    }

    try {
      console.log('[ClientService] Fetching clients for practice:', practiceId);
      
      // Direct Supabase query (more reliable)
      const { data, error } = await supabase
        .from('accounting_clients')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to AccountingClient type
      return (data || []).map(client => this.mapToAccountingClient(client));
    } catch (error) {
      console.error('[ClientService] Error fetching clients:', error);
      throw error;
    }
  },

  async createClient(practiceId: string, clientData: any): Promise<AccountingClient> {
    if (!practiceId) throw new Error('Practice ID is required');

    const newClient = {
      practice_id: practiceId,
      name: clientData.name,
      company_name: clientData.name,
      email: clientData.email,
      contact_name: clientData.contactName,
      phone: clientData.phone,
      company_number: clientData.companyNumber,
      vat_number: clientData.vatNumber,
      industry: clientData.industry || 'Other',
      size: clientData.size || 'small',
      status: 'active',
      portal_access_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('accounting_clients')
      .insert([newClient])
      .select()
      .single();

    if (error) throw error;
    
    // Map and return
    return this.mapToAccountingClient(data);
  },

  mapToAccountingClient(client: any): AccountingClient {
    return {
      id: client.id,
      practiceId: client.practice_id,
      name: client.name || client.company_name,
      email: client.email,
      contactName: client.contact_name || '',
      phone: client.phone || '',
      companyNumber: client.company_number,
      vatNumber: client.vat_number,
      industry: client.industry || 'Other',
      size: client.size || 'small',
      status: client.status || 'active',
      services: client.services || [],
      portalAccess: {
        enabled: client.portal_access_enabled || false,
        clientId: client.id,
        email: client.email,
        loginCount: 0,
        permissions: [],
        twoFactorEnabled: false,
        status: client.portal_access_enabled ? 'active' : 'pending_activation',
        documentsCount: 0,
        storageUsed: 0,
        storageLimit: 1024 * 1024 * 1024
      },
      documents: [],
      activities: [],
      financials: {
        annualTurnover: 0,
        annualProfit: 0,
        employeeCount: 0,
        vatRegistered: false,
        vat: { period: '', dueDate: '', amount: 0, status: 'pending' as const },
        corporationTax: { yearEnd: '', dueDate: '', amount: 0, status: 'pending' as const },
        payroll: { employees: 0, monthlyCost: 0, lastSubmission: new Date().toISOString() }
      },
      compliance: {
        mtdStatus: 'not_started' as const,
        esgStatus: 'not_assessed' as const,
        cyberSecurityStatus: 'not_assessed' as const,
        lastComplianceReview: new Date().toISOString(),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        outstandingActions: [],
        riskLevel: 'low' as const
      },
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      lastActivity: client.updated_at
    };
  }
}; 