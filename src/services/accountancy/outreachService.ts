import { supabase } from '@/lib/supabase/client';

// Enhanced Types for Phase 1-3
interface Campaign {
  id: string;
  practice_id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'call' | 'meeting';
  status: 'draft' | 'active' | 'completed' | 'archived';
  target_audience?: string[];
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  practice_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface Prospect {
  id: string;
  practice_id: string;
  company_number: string;
  company_name: string;
  industry?: string;
  turnover_range?: string;
  employee_count?: number;
  location?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_role?: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  source: string;
  brand_target: string;
  prospect_score: number;
  status: string;
  research_completed: boolean;
  research_date?: string;
  personalization_ready: boolean;
  created_at: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  converted_at?: string;
  updated_at: string;
}

// Phase 2: Enhanced Search Types
interface SearchSuggestion {
  type: 'prospect' | 'company' | 'industry';
  text: string;
  secondary?: string;
  score?: number;
}

interface AdvancedSearchRequest {
  query?: string;
  status?: string;
  brand_target?: string;
  source?: string;
  research_completed?: boolean;
  min_score?: number;
  max_score?: number;
  industry?: string;
  location?: string;
  created_after?: string;
  created_before?: string;
  last_contacted_after?: string;
  last_contacted_before?: string;
  has_email?: boolean;
  has_phone?: boolean;
  has_linkedin?: boolean;
  employee_count_min?: number;
  employee_count_max?: number;
  turnover_range?: string[];
  tags?: string[];
  exclude_tags?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Enhanced Companies House Types
interface CompanySearchResult {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation?: string;
  registered_office_address: {
    premises?: string;
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
  };
  sic_codes?: string[];
  officers?: CompanyOfficer[];
  filing_history?: FilingHistoryItem[];
  charges?: CompanyCharge[];
  persons_with_significant_control?: PSCItem[];
  address_validation?: AddressValidation;
  address_similarity?: number;
}

interface CompanyOfficer {
  name: string;
  role: string;
  appointed_on?: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
  address: string;
}

interface FilingHistoryItem {
  date: string;
  type: string;
  description: string;
  category: string;
}

interface CompanyCharge {
  charge_code: string;
  charge_type: string;
  created: string;
  status: string;
  amount?: string;
}

interface PSCItem {
  name: string;
  kind: string;
  natures_of_control: string[];
  notified_on?: string;
  address: string;
}

interface AddressValidation {
  address: string;
  postcode_valid: boolean;
  address_exists: boolean;
  confidence_score: number;
  validation_sources: string[];
  alternative_addresses: string[];
  postcode_data?: any;
}

interface RegisteredOfficeSearchRequest {
  target_address: string;
  similarity_threshold?: number;
  max_results?: number;
}

interface AdvancedFilterRequest {
  company_status?: string[];
  company_type?: string[];
  sic_codes?: string[];
  incorporated_from?: string;
  incorporated_to?: string;
  dissolved_from?: string;
  dissolved_to?: string;
  location?: string;
  officer_name?: string;
  has_charges?: boolean;
  max_results?: number;
}

// Phase 3: Research Types
interface ResearchRequest {
  depth: 'basic' | 'standard' | 'deep' | 'full';
  include_web_intelligence: boolean;
  include_news_analysis: boolean;
  include_pe_connections: boolean;
  include_financial_analysis: boolean;
}

interface ResearchData {
  id: string;
  prospect_id: string;
  research_type: string;
  source: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CompanyProfile {
  company_number: string;
  company_name: string;
  status: string;
  type: string;
  incorporated_on?: string;
  registered_office?: Record<string, any>;
  sic_codes: string[];
  officers: Record<string, any>[];
  filing_history: Record<string, any>[];
  charges: Record<string, any>[];
  accounts?: Record<string, any>;
}

interface ComprehensiveResearch {
  prospect: Record<string, any>;
  research: {
    company_data: Record<string, any>;
    web_presence: Record<string, any>;
    news_mentions: Record<string, any>[];
    key_personnel: Record<string, any>[];
    financial_indicators: Record<string, any>;
    pe_connections: Record<string, any>;
    last_updated?: string;
  };
  personalization: {
    opening_hooks: string[];
    pe_context?: string;
    research_insights: string[];
  };
}

// Phase 1: Monitoring Types
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  checks: Record<string, any>;
  last_updated: string;
  recommendations: string[];
}

interface PerformanceMetrics {
  total_prospects: number;
  active_prospects: number;
  research_completed: number;
  campaigns_active: number;
  avg_response_time: number;
  cache_hit_rate: number;
  database_connections: number;
}

interface PEAcquisition {
  id: string;
  practice_id: string;
  acquiring_firm: string;
  target_firm: string;
  acquisition_date: string;
  estimated_clients: number;
  status: 'new' | 'processing' | 'extracted' | 'completed';
  deal_value?: string;
  sector?: string;
  created_at: string;
  updated_at: string;
}

interface SearchOptions {
  query: string;
  filters?: {
    type?: ('prospect' | 'contact' | 'campaign' | 'pe_acquisition')[];
    status?: string[];
    industry?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    score?: {
      min: number;
      max: number;
    };
  };
  limit?: number;
  offset?: number;
}

interface IVCIntegrationConfig {
  apiUrl: string;
  apiKey: string;
  practiceId: string;
}

// API Base URL - Force production URL if VITE_API_URL is not available
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';

// Debug logging
console.log('Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  ALL_ENV_VARS: Object.keys(import.meta.env)
});

// Mock data for demo mode
const MOCK_COMPANY_DATA = [
  {
    company_number: "08145618",
    company_name: "ALPHA ACCOUNTING LIMITED",
    company_status: "active",
    registered_office_address: {
      address_line_1: "15 Westferry Circus",
      locality: "London",
      postal_code: "E14 4HD",
      country: "England"
    },
    date_of_creation: "2012-05-14",
    company_type: "ltd",
    sic_codes: ["69201"]
  },
  {
    company_number: "09234567",
    company_name: "BETA BUSINESS SOLUTIONS LTD",
    company_status: "active",
    registered_office_address: {
      address_line_1: "20 Churchill Way",
      locality: "Cardiff",
      postal_code: "CF10 2DX",
      country: "Wales"
    },
    date_of_creation: "2014-09-20",
    company_type: "ltd",
    sic_codes: ["69202"]
  }
];

// Helper function for authenticated API requests
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  console.log('Making authenticated request to:', url);
  console.log('Request options:', { ...options, body: options.body ? 'BODY_PRESENT' : 'NO_BODY' });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  let token = session?.access_token;
  
  if (!session) {
    console.log('No session found, attempting to refresh...');
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    if (error || !newSession) {
      console.warn('No session - using DEMO MODE token for live API access');
      // Use a demo token - backend is mocked and accepts any token
      token = 'demo-token-' + Date.now();
    } else {
      token = newSession.access_token;
      console.log('Session refreshed successfully');
    }
  }
  
  console.log('Making request with token:', token ? 'TOKEN_PRESENT' : 'NO_TOKEN');
  
  // Determine if body is FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  // Build headers
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    'Authorization': `Bearer ${token}`,
  };
  
  // Only set Content-Type for non-FormData requests
  // FormData needs the browser to set multipart/form-data with boundary automatically
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  console.log('Response status:', response.status, response.statusText);
  
  if (response.status === 401) {
    console.log('401 received, attempting token refresh...');
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession) {
      console.log('Token refreshed, retrying request...');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${refreshedSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  return response;
}

export const outreachService = {
  // ===== PHASE 1: OPTIMIZED PROSPECTS API =====
  
  async getProspectsOptimized(
    practiceId: string,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    filters?: {
      status?: string;
      brand_target?: string;
      source?: string;
      research_completed?: boolean;
      min_score?: number;
      max_score?: number;
    }
  ): Promise<PaginatedResponse<Prospect>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder
    });

    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/prospects-optimized/${practiceId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch prospects: ${response.statusText}`);
    }

    return response.json();
  },

  async createProspectOptimized(practiceId: string, prospect: Partial<Prospect>): Promise<Prospect> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/prospects-optimized/${practiceId}`,
      {
        method: 'POST',
        body: JSON.stringify(prospect)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create prospect: ${response.statusText}`);
    }

    return response.json();
  },

  async updateProspectOptimized(
    practiceId: string,
    prospectId: string,
    updates: Partial<Prospect>
  ): Promise<Prospect> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/prospects-optimized/${practiceId}/${prospectId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update prospect: ${response.statusText}`);
    }

    return response.json();
  },

  async getProspectOptimized(practiceId: string, prospectId: string): Promise<Prospect> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/prospects-optimized/${practiceId}/${prospectId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch prospect: ${response.statusText}`);
    }

    return response.json();
  },

  async getPracticeStats(practiceId: string): Promise<{
    total_prospects: number;
    active_prospects: number;
    high_score_prospects: number;
    research_completed: number;
    converted_prospects: number;
    average_score: number;
    conversion_rate: number;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/prospects-optimized/${practiceId}/stats`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch practice stats: ${response.statusText}`);
    }

    return response.json();
  },

  // ===== PHASE 2: ENHANCED SEARCH API =====

  async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (query.length < 2) return [];

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to get search suggestions');
    }

    return response.json();
  },

  async advancedSearch(
    practiceId: string,
    searchRequest: AdvancedSearchRequest,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<Prospect>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort_by: sortBy,
      sort_order: sortOrder
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/search/advanced?${params}`,
      {
        method: 'POST',
        body: JSON.stringify(searchRequest)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to perform advanced search: ${response.statusText}`);
    }

    return response.json();
  },

  async exportSearchResults(
    practiceId: string,
    searchRequest: AdvancedSearchRequest,
    format: 'csv' | 'json' = 'csv',
    includeFields?: string[],
    excludeFields?: string[]
  ): Promise<void> {
    const exportRequest = {
      search_params: searchRequest,
      format,
      include_fields: includeFields,
      exclude_fields: excludeFields
    };

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/search/export`,
      {
        method: 'POST',
        body: JSON.stringify(exportRequest)
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async getSearchFilters(): Promise<{
    statuses: string[];
    brand_targets: string[];
    sources: string[];
    industries: string[];
    turnover_ranges: string[];
    score_range: { min: number; max: number; average: number };
    date_ranges: {
      created: { earliest?: string; latest?: string };
      contacted: { earliest?: string; latest?: string };
    };
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/search/filters`
    );

    if (!response.ok) {
      throw new Error('Failed to get search filters');
    }

    return response.json();
  },

  async getSearchStats(): Promise<{
    total_prospects: number;
    status_distribution: Record<string, number>;
    source_distribution: Record<string, number>;
    top_industries: Record<string, number>;
    score_distribution: Record<string, number>;
    recent_activity: { last_30_days: number; last_7_days: number };
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/search/stats`
    );

    if (!response.ok) {
      throw new Error('Failed to get search stats');
    }

    return response.json();
  },

  // ===== PHASE 3: RESEARCH ENHANCEMENT API =====

  async triggerProspectResearch(
    prospectId: string,
    researchRequest: ResearchRequest
  ): Promise<{
    status: 'processing' | 'cached';
    message: string;
    research_id?: string;
    estimated_time?: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/research-enhanced/${prospectId}/research`,
      {
        method: 'POST',
        body: JSON.stringify(researchRequest)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to trigger research: ${response.statusText}`);
    }

    return response.json();
  },

  async getProspectResearch(prospectId: string): Promise<ComprehensiveResearch> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/research-enhanced/${prospectId}/research`
    );

    if (!response.ok) {
      throw new Error(`Failed to get research data: ${response.statusText}`);
    }

    return response.json();
  },

  async getResearchStatus(prospectId: string): Promise<{
    status: 'not_started' | 'recent' | 'stale' | 'outdated';
    message: string;
    last_updated?: string;
    research_types?: string[];
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/research-enhanced/${prospectId}/status`
    );

    if (!response.ok) {
      throw new Error(`Failed to get research status: ${response.statusText}`);
    }

    return response.json();
  },

  async getCompaniesHouseData(companyNumber: string): Promise<{
    profile: CompanyProfile;
    officers: Record<string, any>[];
    filing_history: Record<string, any>[];
    charges: Record<string, any>[];
    last_updated: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/research-enhanced/companies-house/${companyNumber}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get Companies House data: ${response.statusText}`);
    }

    return response.json();
  },

  // ===== PHASE 1: MONITORING API =====

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/monitoring/health`
    );

    if (!response.ok) {
      throw new Error(`Failed to get system health: ${response.statusText}`);
    }

    return response.json();
  },

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/monitoring/performance`
    );

    if (!response.ok) {
      throw new Error(`Failed to get performance metrics: ${response.statusText}`);
    }

    return response.json();
  },

  async getSystemMetrics(): Promise<{
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    response_time_avg: number;
    error_rate: number;
    uptime: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/monitoring/metrics`
    );

    if (!response.ok) {
      throw new Error(`Failed to get system metrics: ${response.statusText}`);
    }

    return response.json();
  },

  async getDatabasePerformance(): Promise<{
    table_sizes: Record<string, number>;
    recent_activity: Record<string, number>;
    index_usage: Record<string, string>;
    query_performance: Record<string, any>;
    recommendations: string[];
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/monitoring/database`
    );

    if (!response.ok) {
      throw new Error(`Failed to get database performance: ${response.statusText}`);
    }

    return response.json();
  },

  async getOptimizationRecommendations(): Promise<{
    priority: string;
    recommendations: Array<{
      category: string;
      title: string;
      description: string;
      priority: string;
      impact: string;
    }>;
    total_count: number;
    last_updated: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/monitoring/recommendations`
    );

    if (!response.ok) {
      throw new Error(`Failed to get optimization recommendations: ${response.statusText}`);
    }

    return response.json();
  },

  // ===== LEGACY METHODS (for backward compatibility) =====

  // Campaign methods
  async getCampaigns(practiceId: string) {
    try {
      // Don't use mock practice IDs
      if (practiceId.startsWith('practice-')) {
        console.warn('[OutreachService] Mock practice ID detected, skipping API call');
        return [];
      }
      
      const { data, error } = await supabase
        .from('outreach_campaigns') // Using the view
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OutreachService] Campaign error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check for specific error types
        if (error.code === 'PGRST301') {
          console.error('[OutreachService] Column not found - check table structure');
        } else if (error.code === '42501') {
          console.error('[OutreachService] Permission denied - check RLS policies');
        }
        
        // Return empty array instead of throwing
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('[OutreachService] Unexpected error:', err);
      return [];
    }
  },

  async createCampaign(practiceId: string, campaign: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('outreach_campaigns')  // USE VIEW NAME
      .insert([{ ...campaign, practice_id: practiceId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCampaign(campaignId: string, updates: Partial<Campaign>) {
    const { data, error } = await supabase
      .from('outreach_campaigns')  // USE VIEW NAME
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Contact methods
  async getContacts(practiceId: string) {
    try {
      // Don't use mock practice IDs
      if (practiceId.startsWith('practice-')) {
        console.warn('[OutreachService] Mock practice ID detected, skipping API call');
        return [];
      }
      
      const { data, error } = await supabase
        .from('outreach_contacts')  // USE VIEW NAME
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OutreachService] Contact error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check for specific error types
        if (error.code === 'PGRST301') {
          console.error('[OutreachService] Column not found - check table structure');
        } else if (error.code === '42501') {
          console.error('[OutreachService] Permission denied - check RLS policies');
        }
        
        // Return empty array instead of throwing
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('[OutreachService] Unexpected error:', err);
      return [];
    }
  },

  async createContact(practiceId: string, contact: Partial<Contact>) {
    const { data, error } = await supabase
      .from('outreach_contacts')  // USE VIEW NAME
      .insert([{ ...contact, practice_id: practiceId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContact(contactId: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('outreach_contacts')  // USE VIEW NAME
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Legacy prospect methods (fallback to Supabase)
  async getProspects(practiceId: string, filters?: any) {
    try {
      // Don't use mock practice IDs
      if (practiceId.startsWith('practice-')) {
        console.warn('[OutreachService] Mock practice ID detected, skipping API call');
        return [];
      }
      
      let query = supabase
        .from('outreach_prospects')  // USE VIEW NAME
        .select('*')
        .eq('practice_id', practiceId);

      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.industry) {
          query = query.eq('industry', filters.industry);
        }
        if (filters.minScore !== undefined) {
          query = query.gte('prospect_score', filters.minScore);
        }
        if (filters.maxScore !== undefined) {
          query = query.lte('prospect_score', filters.maxScore);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[OutreachService] Prospect error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check for specific error types
        if (error.code === 'PGRST301') {
          console.error('[OutreachService] Column not found - check table structure');
        } else if (error.code === '42501') {
          console.error('[OutreachService] Permission denied - check RLS policies');
        }
        
        // Return empty array instead of throwing
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('[OutreachService] Unexpected error:', err);
      return [];
    }
  },

  async createProspect(practiceId: string, prospect: Partial<Prospect>) {
    const { data, error } = await supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .insert([{ ...prospect, practice_id: practiceId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProspect(prospectId: string, updates: Partial<Prospect>) {
    const { data, error } = await supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .update(updates)
      .eq('id', prospectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // PE Acquisition methods
  async getPEAcquisitions(practiceId: string) {
    try {
      // Don't use mock practice IDs
      if (practiceId.startsWith('practice-')) {
        console.warn('[OutreachService] Mock practice ID detected, skipping API call');
        return [];
      }
      
      const { data, error } = await supabase
        .from('outreach_pe_acquisitions')  // USE VIEW NAME
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[OutreachService] PE Acquisition error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check for specific error types
        if (error.code === 'PGRST301') {
          console.error('[OutreachService] Column not found - check table structure');
        } else if (error.code === '42501') {
          console.error('[OutreachService] Permission denied - check RLS policies');
        }
        
        // Return empty array instead of throwing
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('[OutreachService] Unexpected error:', err);
      return [];
    }
  },

  async createPEAcquisition(practiceId: string, acquisition: Partial<PEAcquisition>) {
    const { data, error } = await supabase
      .from('outreach_pe_acquisitions')  // USE VIEW NAME
      .insert([{ ...acquisition, practice_id: practiceId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePEAcquisition(acquisitionId: string, updates: Partial<PEAcquisition>) {
    const { data, error } = await supabase
      .from('outreach_pe_acquisitions')  // USE VIEW NAME
      .update(updates)
      .eq('id', acquisitionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Legacy search methods
  async searchAll(practiceId: string, options: SearchOptions) {
    const { data, error } = await supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .select('*')
      .eq('practice_id', practiceId)
      .or(`company_name.ilike.%${options.query}%,primary_contact_name.ilike.%${options.query}%`)
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

    if (error) throw error;
    return data;
  },

  async searchProspects(practiceId: string, query: string, filters?: any) {
    let searchQuery = supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .select('*')
      .eq('practice_id', practiceId)
      .or(`company_name.ilike.%${query}%,primary_contact_name.ilike.%${query}%`);

    if (filters) {
      if (filters.status) {
        searchQuery = searchQuery.eq('status', filters.status);
      }
      if (filters.industry) {
        searchQuery = searchQuery.eq('industry', filters.industry);
      }
      if (filters.minScore !== undefined) {
        searchQuery = searchQuery.gte('prospect_score', filters.minScore);
      }
      if (filters.maxScore !== undefined) {
        searchQuery = searchQuery.lte('prospect_score', filters.maxScore);
      }
    }

    const { data, error } = await searchQuery.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Analytics methods
  async getCampaignStats(practiceId: string) {
    const { data, error } = await supabase
      .from('outreach_campaigns')  // USE VIEW NAME
      .select('status')
      .eq('practice_id', practiceId);

    if (error) throw error;
    
    // Count statuses manually
    const stats = data?.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  },

  async getContactStats(practiceId: string) {
    const { data, error } = await supabase
      .from('outreach_contacts')  // USE VIEW NAME
      .select('status')
      .eq('practice_id', practiceId);

    if (error) throw error;
    
    // Count statuses manually
    const stats = data?.reduce((acc, contact) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  },

  async getPEStats(practiceId: string) {
    const { data, error } = await supabase
      .from('outreach_pe_acquisitions')  // USE VIEW NAME
      .select('status')
      .eq('practice_id', practiceId);

    if (error) throw error;
    
    // Count statuses manually
    const stats = data?.reduce((acc, acquisition) => {
      acc[acquisition.status] = (acc[acquisition.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return Object.entries(stats).map(([status, count]) => ({ status, count }));
  },

  async getProspectAnalytics(practiceId: string, dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .select('created_at, status, prospect_score')
      .eq('practice_id', practiceId);

    if (dateRange) {
      query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // IVC Integration methods
  async syncWithIVCAccounting(config: IVCIntegrationConfig, data: {
    campaigns?: Campaign[];
    prospects?: Prospect[];
  }) {
    // Implementation for IVC sync
    console.log('IVC sync not yet implemented');
    return { success: true, synced_count: 0 };
  },

  async importFromIVCAccounting(config: IVCIntegrationConfig) {
    // Implementation for IVC import
    console.log('IVC import not yet implemented');
    return { success: true, imported_count: 0 };
  },

  // Bulk operations
  async bulkUpdateProspectStatus(prospectIds: string[], status: Prospect['status']) {
    const { data, error } = await supabase
      .from('outreach_prospects')  // USE VIEW NAME
      .update({ status })
      .in('id', prospectIds)
      .select();

    if (error) throw error;
    return data;
  },

  async bulkAssignTags(contactIds: string[], tags: string[]) {
    const { data, error } = await supabase
      .from('outreach_contacts')  // USE VIEW NAME
      .update({ tags })
      .in('id', contactIds)
      .select();

    if (error) throw error;
    return data;
  },

  // Automation methods
  async createAutomationRule(practiceId: string, rule: {
    name: string;
    trigger: 'prospect_created' | 'prospect_scored' | 'pe_acquisition_detected';
    conditions: Record<string, any>;
    actions: Array<{
      type: 'research' | 'personalize' | 'create_campaign' | 'send_notification';
      params: Record<string, any>;
    }>;
  }) {
    // Implementation for automation rules
    console.log('Automation rules not yet implemented');
    return { success: true, rule_id: 'temp-id' };
  },

  async getAutomationRules(practiceId: string) {
    // Implementation for getting automation rules
    console.log('Automation rules not yet implemented');
    return [];
  },

  // ===== ENHANCED COMPANIES HOUSE SEARCH =====

  async searchByCompanyNumber(companyNumber: string): Promise<CompanySearchResult> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/company-number`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_number: companyNumber })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search company: ${response.statusText}`);
    }

    const data = await response.json();
    return data.company;
  },

  async findCompaniesByRegisteredOffice(request: RegisteredOfficeSearchRequest): Promise<{
    companies: CompanySearchResult[];
    total_found: number;
    target_address: string;
    similarity_threshold: number;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/registered-office-matching`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_address: request.target_address,
          similarity_threshold: request.similarity_threshold || 0.8,
          max_results: request.max_results || 50
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search by registered office: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      companies: data.companies,
      total_found: data.total_found,
      target_address: data.target_address,
      similarity_threshold: data.similarity_threshold
    };
  },

  async advancedFilterSearch(filters: AdvancedFilterRequest): Promise<{
    companies: CompanySearchResult[];
    total_found: number;
    filters_applied: any;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/advanced-filter`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to perform advanced search: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      companies: data.companies,
      total_found: data.total_found,
      filters_applied: data.filters_applied
    };
  },

  async validateCompanyAddress(companyData: any): Promise<AddressValidation> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/validate-address`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_data: companyData })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to validate address: ${response.statusText}`);
    }

    const data = await response.json();
    return data.validation;
  },

  async findAccountingFirmClients(registeredOffice: string, maxResults: number = 50): Promise<{
    clients: CompanySearchResult[];
    potential_clients_found: number;
    accounting_firm_address: string;
  }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/accounting-firm-clients?registered_office=${encodeURIComponent(registeredOffice)}&max_results=${maxResults}`
    );

    if (!response.ok) {
      throw new Error(`Failed to find accounting firm clients: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      clients: data.clients,
      potential_clients_found: data.potential_clients_found,
      accounting_firm_address: data.accounting_firm_address
    };
  },

  async getSicCodes(): Promise<Record<string, Record<string, string>>> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/sic-codes`
    );

    if (!response.ok) {
      throw new Error(`Failed to get SIC codes: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sic_codes;
  },

  async getCompanyTypes(): Promise<Record<string, string>> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/company-types`
    );

    if (!response.ok) {
      throw new Error(`Failed to get company types: ${response.statusText}`);
    }

    const data = await response.json();
    return data.company_types;
  },

  async getCompanyStatuses(): Promise<Record<string, string>> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/outreach/enhanced-search/company-statuses`
    );

    if (!response.ok) {
      throw new Error(`Failed to get company statuses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.company_statuses;
  },

  // Basic search method
  async basicCompanySearch(query: string, maxResults: number = 20): Promise<CompanySearchResult[]> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/basic-search`, {
      method: 'POST',
      body: JSON.stringify({ query, max_results: maxResults }),
    });

    if (!response.ok) {
      throw new Error(`Basic search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.companies || [];
  },

  // Companies House search method (alias for basicCompanySearch)
  async searchCompaniesHouse(query: string, maxResults: number = 20): Promise<CompanySearchResult[]> {
    return this.basicCompanySearch(query, maxResults);
  },

  // Address matching method with exact matching
  async searchByRegisteredOffice(address: string, similarityThreshold: number = 80, maxResults: number = 50, exactMatch: boolean = true, excludeDissolved: boolean = true): Promise<CompanySearchResult[]> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/registered-office-matching`, {
      method: 'POST',
      body: JSON.stringify({ 
        address, 
        similarity_threshold: similarityThreshold, 
        max_results: maxResults,
        exact_match: exactMatch,
        exclude_dissolved: excludeDissolved
      }),
    });

    if (!response.ok) {
      throw new Error(`Address matching failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.companies || [];
  },

  // Comprehensive export method
  async comprehensiveExport(address: string): Promise<any> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/comprehensive-export`, {
      method: 'POST',
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.export_data;
  },

  // DATE RANGE COMPARISON FEATURES
  async searchByAddressWithDateRange(
    address: string,
    startDate: string,
    endDate: string,
    similarityThreshold: number = 80,
    maxResults: number = 1000
  ): Promise<CompanySearchResult[]> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/address-date-range`, {
      method: 'POST',
      body: JSON.stringify({ 
        address, 
        start_date: startDate,
        end_date: endDate,
        similarity_threshold: similarityThreshold, 
        max_results: maxResults
      }),
    });

    if (!response.ok) {
      throw new Error(`Date range search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.companies || [];
  },

  async compareDateRanges(
    address: string,
    dateRange1: { start: string; end: string },
    dateRange2: { start: string; end: string },
    similarityThreshold: number = 80
  ): Promise<{
    range1_only: CompanySearchResult[];
    range2_only: CompanySearchResult[];
    in_both: CompanySearchResult[];
    left_firms: CompanySearchResult[];
    new_firms: CompanySearchResult[];
  }> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/compare-date-ranges`, {
      method: 'POST',
      body: JSON.stringify({ 
        address,
        date_range_1: dateRange1,
        date_range_2: dateRange2,
        similarity_threshold: similarityThreshold
      }),
    });

    if (!response.ok) {
      throw new Error(`Date range comparison failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  // Timeline Snapshot Comparison - CSV-based (THE CORRECT METHOD!)
  async compareTimelineSnapshots(
    address: string,
    historicalDate: string,
    similarityThreshold: number = 80,
    maxCompanies: number = 500
  ): Promise<{
    companies_left: CompanySearchResult[];
    companies_arrived?: CompanySearchResult[];
    companies_stable?: CompanySearchResult[];
    companies_still_there?: CompanySearchResult[];
    companies_dissolved?: CompanySearchResult[];
    summary: {
      companies_left: number;
      companies_arrived?: number;
      companies_stable?: number;
      companies_still_there?: number;
      companies_dissolved?: number;
      companies_in_snapshot?: number;
      total_movement?: number;
    };
    historical_date?: string;
    today_date?: string;
    snapshot_date?: string;
    csv_date?: string;
  }> {
    // Use CSV-based endpoint for accurate historical comparison
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/timeline-csv/compare-with-snapshot`, {
      method: 'POST',
      body: JSON.stringify({ 
        address,
        csv_date: "2025-02-01",  // CSV snapshot date
        similarity_threshold: similarityThreshold / 100  // Convert 80 to 0.8
      }),
    });

    if (!response.ok) {
      throw new Error(`Timeline comparison failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  // SEARCH HISTORY FEATURES
  async saveSearchHistory(searchData: {
    search_type: 'address_match' | 'date_range' | 'date_comparison';
    address?: string;
    date_range?: { start: string; end: string };
    date_ranges?: { range1: { start: string; end: string }; range2: { start: string; end: string } };
    results_count: number;
    filters?: any;
  }): Promise<{ id: string; saved_at: string }> {
    const { data, error } = await supabase
      .from('outreach_search_history')
      .insert([searchData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSearchHistory(practiceId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('outreach_search_history')
      .select('*')
      .eq('practice_id', practiceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async deleteSearchHistory(historyId: string): Promise<void> {
    const { error } = await supabase
      .from('outreach_search_history')
      .delete()
      .eq('id', historyId);

    if (error) throw error;
  },

  async loadSearchFromHistory(historyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('outreach_search_history')
      .select('*')
      .eq('id', historyId)
      .single();

    if (error) throw error;
    return data;
  },

  // LLM ADDRESS VERIFICATION
  async verifyAddressWithLLM(companyData: {
    company_name: string;
    company_number: string;
    registered_office_address: any;
  }): Promise<{
    trading_address: string | null;
    contact_address: string | null;
    confidence_score: number;
    sources: string[];
    notes: string;
    verified_at: string;
  }> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/llm-verify-address`, {
      method: 'POST',
      body: JSON.stringify({ company_data: companyData }),
    });

    if (!response.ok) {
      throw new Error(`LLM address verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.verification;
  },

  async batchVerifyAddresses(companies: Array<{
    company_name: string;
    company_number: string;
    registered_office_address: any;
  }>): Promise<Array<{
    company_number: string;
    trading_address: string | null;
    contact_address: string | null;
    confidence_score: number;
  }>> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/llm-verify-addresses-batch`, {
      method: 'POST',
      body: JSON.stringify({ companies }),
    });

    if (!response.ok) {
      throw new Error(`Batch address verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.verifications || [];
  },

  // ENHANCED COMPREHENSIVE EXPORT WITH ALL FIELDS
  async comprehensiveExportWithAllFields(
    address: string,
    includeLLMVerification: boolean = false
  ): Promise<Blob> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/outreach/enhanced-search/export-all-fields`, {
      method: 'POST',
      body: JSON.stringify({ 
        address,
        include_llm_verification: includeLLMVerification
      }),
    });

    if (!response.ok) {
      throw new Error(`Enhanced export failed: ${response.statusText}`);
    }

    // Return the blob for download
    return await response.blob();
  }
};