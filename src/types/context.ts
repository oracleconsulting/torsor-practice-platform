export interface ClientContext {
  clientId?: string;
  industry?: string;
  businessType?: string;
  businessStage?: string;
  revenue?: number;
  challenges?: string[];
  goals?: string[];
  stage?: 'roadmap' | 'sprint' | 'vision' | 'board_meeting' | string;
  yearsInBusiness?: number;
  location?: string;
  urgency?: string;
  currentFocus?: any[];
}

export interface EnrichmentConfig {
  type?: 'general' | 'assessment' | 'validation' | 'sprint' | 'progress';
  minRelevance?: number;
  limit?: number;
}

export interface EnrichmentResult {
  enrichments: Array<{
    content: string;
    source: string;
    relevance: number;
    context: string;
    category?: string;
    actionability?: number;
  }>;
  signalsUsed: string[] | any;
  enhancedSignals?: any;
} 