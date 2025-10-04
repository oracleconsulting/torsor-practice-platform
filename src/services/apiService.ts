import { supabase } from '@/lib/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async handleResponse(response: Response): Promise<ApiResponse> {
    const contentType = response.headers.get('content-type');
    
    // Check if response is HTML (error page)
    if (contentType?.includes('text/html')) {
      console.error('API returned HTML instead of JSON:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      let errorMessage = 'Server error';
      if (response.status === 404) {
        errorMessage = 'API endpoint not found';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed';
      } else if (response.status === 403) {
        errorMessage = 'Access denied';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error';
      }
      
      return {
        error: errorMessage,
        status: response.status
      };
    }

    // Try to parse JSON
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.detail || data.message || 'Request failed',
          status: response.status
        };
      }
      
      return {
        data,
        status: response.status
      };
    } catch (e) {
      console.error('Failed to parse response:', e);
      return {
        error: 'Invalid response format',
        status: response.status
      };
    }
  }

  async generateValueAnalysis(groupId: string, userId: string, part3Responses: any): Promise<ApiResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: 'Not authenticated', status: 401 };
      }

      console.log('Generating value analysis:', {
        url: `${API_URL}/api/generate-value-analysis`,
        groupId,
        userId,
        hasResponses: !!part3Responses
      });

      const response = await fetch(`${API_URL}/api/generate-value-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: userId,
          part3_responses: part3Responses
        })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Value analysis request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  async regenerateRoadmap(groupId: string, userId: string): Promise<ApiResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: 'Not authenticated', status: 401 };
      }

      console.log('Regenerating roadmap:', {
        url: `${API_URL}/api/generate-roadmap`,
        groupId,
        userId
      });

      const response = await fetch(`${API_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: userId,
          regenerate: true
        })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Regenerate roadmap request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  // Test endpoint to verify API connectivity
  async testConnection(): Promise<ApiResponse> {
    try {
      console.log('Testing API connection:', `${API_URL}/health`);
      
      const response = await fetch(`${API_URL}/health`);
      return this.handleResponse(response);
    } catch (error) {
      console.error('API connection test failed:', error);
      return {
        error: 'Cannot connect to API server',
        status: 0
      };
    }
  }

  // Debug endpoint to check routes
  async debugRoutes(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/api/debug/routes`);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Debug routes request failed:', error);
      return {
        error: 'Cannot fetch debug info',
        status: 0
      };
    }
  }
}

export const apiService = new ApiService(); 