/**
 * ConsultingAI Service
 * Handles API calls to the ConsultingAI integration endpoints
 */

export interface BusinessRoadmap {
  id: string;
  client_id: string;
  vision?: string;
  mission?: string;
  strategic_objectives: StrategicObjective[];
  milestones: any[];
  kpis: KPI[];
  timeline: any;
  created_at: string;
  updated_at: string;
}

export interface StrategicObjective {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_date?: string;
}

export interface KPI {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface GoalCreate {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  target_date?: string;
  kpis?: any[];
  dependencies?: string[];
}

export interface FinancialData {
  period: string;
  revenue?: number;
  profit_margin?: number;
  cash_flow?: number;
  key_metrics?: Record<string, any>;
}

export interface ClientIntelligence {
  financial_health: Record<string, any>;
  market_position: Record<string, any>;
  risk_profile: Record<string, any>;
  opportunities: any[];
}

export interface SyncStatus {
  sync_type: string;
  last_sync?: string;
  status: string;
  error_message?: string;
}

class ConsultingAIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/consulting-ai';
  }

  /**
   * Get client roadmap
   */
  async getClientRoadmap(clientId: string): Promise<BusinessRoadmap | null> {
    try {
      const response = await fetch(`${this.baseUrl}/roadmaps/${clientId}`);
      
      if (response.status === 404) {
        return null; // No roadmap exists
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roadmap: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching client roadmap:', error);
      throw error;
    }
  }

  /**
   * Create a new roadmap
   */
  async createRoadmap(roadmapData: Partial<BusinessRoadmap>): Promise<BusinessRoadmap> {
    try {
      const response = await fetch(`${this.baseUrl}/roadmaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roadmapData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create roadmap: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  /**
   * Get client goals
   */
  async getClientGoals(clientId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/goals/${clientId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching client goals:', error);
      throw error;
    }
  }

  /**
   * Create goals for a client
   */
  async createGoals(clientId: string, goals: GoalCreate[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/goals/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goals),
      });

      if (!response.ok) {
        throw new Error(`Failed to create goals: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating goals:', error);
      throw error;
    }
  }

  /**
   * Get client KPIs
   */
  async getClientKPIs(clientId: string): Promise<KPI[]> {
    try {
      const response = await fetch(`${this.baseUrl}/kpis/${clientId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching client KPIs:', error);
      throw error;
    }
  }

  /**
   * Update financial actuals
   */
  async updateFinancialActuals(clientId: string, financialData: FinancialData): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/financials/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(financialData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update financial data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating financial data:', error);
      throw error;
    }
  }

  /**
   * Get client intelligence
   */
  async getClientIntelligence(clientId: string): Promise<ClientIntelligence> {
    try {
      const response = await fetch(`${this.baseUrl}/intelligence/${clientId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch client intelligence: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching client intelligence:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(clientId: string): Promise<SyncStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sync-status/${clientId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sync status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sync status:', error);
      throw error;
    }
  }

  /**
   * Health check for ConsultingAI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('ConsultingAI health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const consultingAIService = new ConsultingAIService(); 