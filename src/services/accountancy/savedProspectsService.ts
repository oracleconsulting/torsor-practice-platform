/**
 * Saved Prospects Service
 * 
 * Manages saved companies, advanced filtering, and AI research
 */

import { supabase } from '@/lib/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';

// Helper function for authenticated API requests
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  let token = session?.access_token;
  
  if (!session) {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    if (error || !newSession) {
      // Use demo token for live API access
      token = 'demo-token-' + Date.now();
    } else {
      token = newSession.access_token;
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response;
}

export interface SavedProspect {
  id: string;
  company_number: string;
  company_name: string;
  company_type?: string;
  company_status?: string;
  date_of_creation?: string;
  registered_office_address?: any;
  sic_codes?: string[];
  status: string;
  research_completed: boolean;
  research_date?: string;
  created_at: string;
  prospect_score: number;
}

export interface AdvancedFilters {
  company_status?: string[];
  company_type?: string[];
  sic_codes?: string[];
  location?: string;
  date_of_creation_from?: string;
  date_of_creation_to?: string;
  has_charges?: boolean;
  research_completed?: boolean;
  status?: string[];
  search_term?: string;
}

export const savedProspectsService = {
  /**
   * Save a single company from search results
   */
  async saveCompany(companyData: any): Promise<{ success: boolean; prospect_id?: string; message: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/saved-prospects/save`,
      {
        method: 'POST',
        body: JSON.stringify({
          company_number: companyData.company_number,
          company_name: companyData.company_name || companyData.title,
          company_type: companyData.company_type,
          company_status: companyData.company_status,
          date_of_creation: companyData.date_of_creation,
          registered_office_address: companyData.address,
          sic_codes: companyData.sic_codes,
          accounts: companyData.accounts,
          links: companyData.links,
          source: 'companies_house_search'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to save company');
    }
    
    return await response.json();
  },
  
  /**
   * Bulk save multiple companies
   */
  async bulkSaveCompanies(companies: any[]): Promise<{ saved: number; skipped: number; errors: any[] }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/saved-prospects/bulk-save`,
      {
        method: 'POST',
        body: JSON.stringify({
          companies: companies.map(c => ({
            company_number: c.company_number,
            company_name: c.company_name || c.title,
            company_type: c.company_type,
            company_status: c.company_status,
            date_of_creation: c.date_of_creation,
            registered_office_address: c.address,
            sic_codes: c.sic_codes,
            accounts: c.accounts,
            links: c.links
          })),
          source: 'companies_house_search'
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to bulk save companies');
    }
    
    return await response.json();
  },
  
  /**
   * Get saved prospects with advanced filtering
   */
  async filterProspects(
    filters: AdvancedFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ prospects: SavedProspect[]; total: number; total_pages: number }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/saved-prospects/filter?page=${page}&page_size=${pageSize}`,
      {
        method: 'POST',
        body: JSON.stringify(filters)
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to filter prospects');
    }
    
    return await response.json();
  },
  
  /**
   * Conduct AI-powered research on a prospect
   */
  async conductResearch(prospectId: string): Promise<{ success: boolean; research: any }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/saved-prospects/${prospectId}/research`,
      {
        method: 'POST'
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to conduct research');
    }
    
    return await response.json();
  },
  
  /**
   * Get registered office history for a company
   * Useful for identifying accountant switches
   */
  async getOfficeHistory(prospectId: string): Promise<{
    address_history: any[];
    total_changes: number;
    analysis: any;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/saved-prospects/${prospectId}/office-history`,
      {
        method: 'GET'
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to get office history');
    }
    
    return await response.json();
  }
};

