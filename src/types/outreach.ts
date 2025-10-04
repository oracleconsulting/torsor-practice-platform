export interface Campaign {
  id: string;
  practice_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  type: 'email' | 'sms' | 'call' | 'meeting';
  target_audience?: string[];
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
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

export interface Schedule {
  id: string;
  practice_id: string;
  campaign_id?: string;
  contact_id?: string;
  type: 'email' | 'sms' | 'call' | 'meeting';
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduled_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  id: string;
  campaign_id: string;
  total_contacts: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  responses: number;
  updated_at: string;
}

export interface ContactStats {
  id: string;
  contact_id: string;
  campaigns_received: number;
  emails_opened: number;
  emails_clicked: number;
  responses: number;
  last_interaction: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  practice_id: string;
  name: string;
  company: string;
  position?: string;
  industry?: string;
  score?: number;
  status: 'new' | 'researched' | 'contacted' | 'responded' | 'converted';
  personalization_data?: {
    opening_hook?: string;
    pe_context?: string;
    research_insights?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface PEAcquisition {
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

export interface PEStats {
  id: string;
  practice_id: string;
  total_acquisitions: number;
  total_extracted_clients: number;
  total_converted_clients: number;
  monthly_acquisitions: number;
  updated_at: string;
} 