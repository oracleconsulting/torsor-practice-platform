import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class AccountancyApiService {
  private static baseUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
  
  private static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If error response is not JSON
      }
      
      return {
        error: errorMessage,
        status: response.status
      };
    }

    try {
      const data = await response.json();
      return {
        data,
        status: response.status
      };
    } catch {
      return {
        data: undefined,
        status: response.status
      };
    }
  }

  static async fetchPractices() {
    const token = await this.getAuthToken();
    if (!token) return { error: 'Not authenticated', status: 401 };

    try {
      const response = await fetch(`${this.baseUrl}/api/accountancy/practices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(response);
    } catch (error) {
      return { error: 'Network error', status: 0 };
    }
  }

  static async fetchClients() {
    const token = await this.getAuthToken();
    if (!token) return { error: 'Not authenticated', status: 401 };

    try {
      const response = await fetch(`${this.baseUrl}/api/accountancy/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(response);
    } catch (error) {
      return { error: 'Network error', status: 0 };
    }
  }

  static async fetchValidationSessions() {
    const token = await this.getAuthToken();
    if (!token) return { error: 'Not authenticated', status: 401 };

    try {
      const response = await fetch(`${this.baseUrl}/api/accountancy/validation-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(response);
    } catch (error) {
      return { error: 'Network error', status: 0 };
    }
  }

  static async fetchPracticeHealth() {
    const token = await this.getAuthToken();
    if (!token) return { error: 'Not authenticated', status: 401 };

    try {
      // First get the user's practice
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated', status: 401 };

      // Get practice data with health score
      const { data: practice, error: practiceError } = await supabase
        .from('practices')
        .select('*, practice_health_progress!owner_id(*)')
        .eq('owner_id', user.id)
        .single();

      if (practiceError) {
        return { error: practiceError.message, status: 400 };
      }

      // Transform data to expected format
      const healthData = {
        practice_id: practice.id,
        overall_score: practice.health_score || 50,
        assessment_date: new Date().toISOString(),
        category_scores: practice.practice_health_progress?.[0]?.answers?.category_scores || {
          efficiency: 50,
          client_satisfaction: 50,
          team_wellness: 50
        },
        improvements: practice.practice_health_progress?.[0]?.answers?.improvements || [],
        recommendations: practice.practice_health_progress?.[0]?.answers?.recommendations || [
          "Complete practice health assessment",
          "Review client engagement metrics"
        ]
      };

      return { data: healthData, status: 200 };
    } catch (error) {
      return { error: 'Failed to fetch practice health', status: 500 };
    }
  }
}