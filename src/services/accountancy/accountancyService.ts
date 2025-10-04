import { supabase } from '@/lib/supabase/client';
import { 
  Practice, 
  PracticeMember, 
  AccountingClient,
  HealthScore,
  Rescue,
  TeamMember,
  AdvisoryProgress,
  ClientService,
  ClientPortalAccess,
  ClientDocument,
  ClientActivity,
  ClientFinancials,
  ClientCompliance,
  ComplianceAction,
  ClientManagementSummary,
  ClientPortalStats
} from '@/types/accountancy';

// Re-export the API service for advanced features
export * from './accountancyApiService';

// Core practice management service
export const accountancyService = {
  // Practice Management
  async getCurrentPractice(): Promise<{ practice: Practice; role: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // First try to get practice where user is owner
      const { data: ownedPractice, error: ownerError } = await supabase
        .from('practices')
        .select('*')
        .eq('owner_id', user.id)  // Changed from any other field to owner_id
        .single();

      if (ownedPractice && !ownerError) {
        const practice: Practice = {
          id: ownedPractice.id,
          name: ownedPractice.name,
          email: ownedPractice.email,
          contactName: ownedPractice.name.split(' ')[0],
          teamSize: 1, // Will be updated when loading team
          subscription: (ownedPractice.subscription_tier || 'free') as any,
          createdAt: new Date(ownedPractice.created_at),
          updatedAt: new Date(ownedPractice.updated_at)
        };

        return { practice, role: 'owner' };
      }

      // If not owner, check if they're a team member via accountancy_users
      const { data: accountancyUser } = await supabase
        .from('accountancy_users')
        .select('practice_id')
        .eq('user_id', user.id)
        .single();

      if (accountancyUser?.practice_id) {
        const { data: practice } = await supabase
          .from('practices')
          .select('*')
          .eq('id', accountancyUser.practice_id)
          .single();

        if (practice) {
          const practiceData: Practice = {
            id: practice.id,
            name: practice.name,
            email: practice.email,
            contactName: practice.name.split(' ')[0],
            teamSize: 1,
            subscription: (practice.subscription_tier || 'free') as any,
            createdAt: new Date(practice.created_at),
            updatedAt: new Date(practice.updated_at)
          };

          return { practice: practiceData, role: 'member' };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current practice:', error);
      return null;
    }
  },

  async updatePractice(practiceId: string, updates: Partial<Practice>) {
    // Map Practice fields back to database fields
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.subscription !== undefined) dbUpdates.subscription_tier = updates.subscription;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('practices')
      .update(dbUpdates)
      .eq('id', practiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Team Management
  async getTeamMembers(practiceId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('practice_members')
      .select('*')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .order('role');

    if (error) throw error;

    // Map to TeamMember type
    return (data || []).map(member => ({
      id: member.id,
      name: member.user_id || 'Unknown',
      role: member.role,
      requiredHours: 40, // Default - should come from settings
      completedHours: 0, // Should come from time tracking
      deadline: new Date().toISOString(),
      status: 'active' as any
    }));
  },

  async inviteTeamMember(practiceId: string, email: string, role: 'admin' | 'member') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Add to practice
      const { data, error } = await supabase
        .from('practice_members')
        .insert({
          practice_id: practiceId,
          user_id: existingUser.id,
          role,
          invited_by: user.id
        });

      if (error) throw error;
      return data;
    } else {
      // Send invitation email (implement email service)
      // For now, just return a pending invitation
      return { status: 'invitation_sent', email, role };
    }
  },

  async updateTeamMember(practiceId: string, userId: string, updates: { role?: string; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('practice_members')
      .update(updates)
      .eq('practice_id', practiceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeTeamMember(practiceId: string, userId: string) {
    const { error } = await supabase
      .from('practice_members')
      .update({ is_active: false })
      .eq('practice_id', practiceId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Client Management
  async getClients(practiceId: string): Promise<AccountingClient[]> {
    const { data, error } = await supabase
      .from('accounting_clients')
      .select('*')
      .eq('practice_id', practiceId)
      .order('company_name');

    if (error) throw error;
    
    // Map database fields to AccountingClient type
    return (data || []).map(client => ({
      id: client.id,
      practiceId: client.practice_id,
      name: client.company_name,
      email: client.email || '',
      contactName: client.contact_name || '',
      phone: client.phone || '',
      companyNumber: client.company_number,
      vatNumber: client.tax_number,
      industry: client.industry || 'Other',
      size: 'small' as any, // Should be stored in DB
      status: 'active' as any, // Should be stored in DB
      services: [], // Should load from related table
      portalAccess: {
        enabled: client.portal_enabled,
        clientId: client.id,
        email: client.email || '',
        loginCount: 0,
        permissions: [],
        twoFactorEnabled: false,
        status: client.portal_enabled ? 'active' : 'pending_activation',
        documentsCount: 0,
        storageUsed: 0,
        storageLimit: 100
      } as ClientPortalAccess,
      documents: [], // Should load from related table
      activities: [], // Should load from related table
      financials: {} as ClientFinancials, // Should load from related table
      compliance: {} as ClientCompliance, // Should load from related table
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      lastActivity: client.updated_at
    }));
  },

  async getClient(clientId: string): Promise<AccountingClient | null> {
    const { data, error } = await supabase
      .from('accounting_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error getting client:', error);
      return null;
    }

    // Map to AccountingClient type (same as above)
    return {
      id: data.id,
      practiceId: data.practice_id,
      name: data.company_name,
      email: data.email || '',
      contactName: data.contact_name || '',
      phone: data.phone || '',
      companyNumber: data.company_number,
      vatNumber: data.tax_number,
      industry: data.industry || 'Other',
      size: 'small' as any,
      status: 'active' as any,
      services: [],
      portalAccess: {
        enabled: data.portal_enabled,
        clientId: data.id,
        email: data.email || '',
        loginCount: 0,
        permissions: [],
        twoFactorEnabled: false,
        status: data.portal_enabled ? 'active' : 'pending_activation',
        documentsCount: 0,
        storageUsed: 0,
        storageLimit: 100
      } as ClientPortalAccess,
      documents: [],
      activities: [],
      financials: {} as ClientFinancials,
      compliance: {} as ClientCompliance,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastActivity: data.updated_at
    };
  },

  async createClient(practiceId: string, clientData: Partial<AccountingClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Map AccountingClient fields to database fields
    const dbData = {
      practice_id: practiceId,
      company_name: clientData.name,
      contact_name: clientData.contactName,
      email: clientData.email,
      phone: clientData.phone,
      tax_number: clientData.vatNumber,
      company_number: clientData.companyNumber,
      portal_enabled: false,
      portal_id: crypto.randomUUID(),
      created_by: user?.id
    };

    const { data, error } = await supabase
      .from('accounting_clients')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateClient(clientId: string, updates: Partial<AccountingClient>) {
    // Map AccountingClient fields to database fields
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.company_name = updates.name;
    if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.companyNumber !== undefined) dbUpdates.company_number = updates.companyNumber;
    if (updates.vatNumber !== undefined) dbUpdates.tax_number = updates.vatNumber;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('accounting_clients')
      .update(dbUpdates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteClient(clientId: string) {
    const { error } = await supabase
      .from('accounting_clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  },

  // Client Portal Management
  async enableClientPortal(clientId: string) {
    const { data, error } = await supabase
      .from('accounting_clients')
      .update({
        portal_enabled: true,
        portal_id: crypto.randomUUID()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createClientPortalAccess(clientId: string, userData: { email: string; name: string }) {
    const { data, error } = await supabase
      .from('client_portal_access')
      .insert({
        client_id: clientId,
        user_email: userData.email,
        user_name: userData.name
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getClientPortalUsers(clientId: string) {
    const { data, error } = await supabase
      .from('client_portal_access')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Practice Analytics
  async getPracticeStats(practiceId: string) {
    try {
      // Get client count
      const { count: clientCount } = await supabase
        .from('accounting_clients')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId);

      // Get team size
      const { count: teamSize } = await supabase
        .from('practice_members')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .eq('is_active', true);

      // Get active portals
      const { count: activePortals } = await supabase
        .from('accounting_clients')
        .select('*', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .eq('portal_enabled', true);

      return {
        clientCount: clientCount || 0,
        teamSize: teamSize || 0,
        activePortals: activePortals || 0
      };
    } catch (error) {
      console.error('Error getting practice stats:', error);
      return {
        clientCount: 0,
        teamSize: 0,
        activePortals: 0
      };
    }
  },

  // Subscription Management
  async checkSubscription(practiceId: string) {
    const { data, error } = await supabase
      .from('practices')
      .select('subscription_tier, subscription_status')
      .eq('id', practiceId)
      .single();

    if (error) {
      console.error('Error checking subscription:', error);
      return { tier: 'free', status: 'active' };
    }

    return {
      tier: data.subscription_tier || 'free',
      status: data.subscription_status || 'active'
    };
  },

  async updateSubscription(practiceId: string, tier: string) {
    const { data, error } = await supabase
      .from('practices')
      .update({
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', practiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Health Score (Mock for now - replace with real implementation)
  async getHealthScore(practiceId: string): Promise<HealthScore> {
    // This would connect to your actual health score calculation
    return {
      overall: 75,
      compliance: 80,
      team: 70,
      advisory: 65,
      financial: 78,
      technology: 72,
      lastAssessed: new Date().toISOString()
    };
  },

  // Rescues (Mock for now - replace with real implementation)
  async getRescues(practiceId: string): Promise<Rescue[]> {
    // This would fetch actual rescue cases
    return [];
  },

  // Advisory Progress (Mock for now - replace with real implementation)
  async getAdvisoryProgress(practiceId: string): Promise<AdvisoryProgress | null> {
    return {
      currentMix: { compliance: 70, advisory: 30 },
      targetMix: { compliance: 50, advisory: 50 },
      monthlyTrend: []
    };
  },

  // Utility functions
  async verifyPracticeAccess(practiceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  }
};