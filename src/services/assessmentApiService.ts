// This service handles ONLY backend processing operations
// All CRUD operations should use assessmentDatabaseService.ts

import { AssessmentApiData } from '@/types/assessment';
import { getAuthHeaders } from '../utils/authHeaders';
import { supabase } from '@/lib/supabase/client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://oracle-api-server-production.up.railway.app';

export class AssessmentApiService {
  static async checkPart2Status(groupId: string): Promise<{
    has_board: boolean;
    has_roadmap: boolean;
    status: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/client-intake-part2/check-status/${groupId}`, {
      headers: await getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to check assessment status');
    }

    return response.json();
  }

  static async confirmIntake(groupId: string): Promise<{
    interpreted_data: any;
    confidence_scores: any;
    clarification_questions: any[];
    can_proceed: boolean;
  }> {
    const response = await fetch(`${API_BASE_URL}/intake/confirm`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ group_id: groupId })
    });

    if (!response.ok) {
      throw new Error('Failed to confirm intake data');
    }

    return response.json();
  }

  static async completeAssessmentPart1(groupId: string, email: string, responses: any): Promise<any> {
    console.log('[AssessmentApiService] Completing assessment part 1:', { groupId, email });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/client-intake/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          group_id: groupId,
          email: email,
          responses: responses
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AssessmentApiService] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssessmentApiService] Completion response:', data);
      return data;
    } catch (error) {
      console.error('[AssessmentApiService] Error completing assessment:', error);
      throw error;
    }
  }

  static async completeAssessment(groupId: string): Promise<void> {
    try {
      console.log('[AssessmentApiService] Completing assessment for group:', groupId);
      
      const response = await fetch(`${API_BASE_URL}/api/client-intake-part2/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ 
          group_id: groupId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[AssessmentApiService] API Error:', errorData);
        throw new Error(errorData.message || errorData.detail || `API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AssessmentApiService] Assessment completion result:', result);
      
      return result;
    } catch (error) {
      console.error('[AssessmentApiService] Error completing assessment:', error);
      throw error;
    }
  }

  static async sendPartnerInvites(
    groupId: string, 
    partnerEmails: string[]
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/client-intake/invite-partners`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ 
        group_id: groupId,
        partner_emails: partnerEmails.filter(e => e.trim())
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send invites');
    }
  }

  static async forceRegeneration(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/client-intake-part2/force-generation/${groupId}`, {
      method: 'POST',
      headers: await getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to force regeneration');
    }
  }

  // Helper method to get auth token
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
}