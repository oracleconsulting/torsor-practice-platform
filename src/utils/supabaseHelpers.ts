import { AssessmentResponse } from '@/types/assessment';

export function parseJsonField<T>(field: any, defaultValue: T): T {
  if (!field) return defaultValue;
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return defaultValue;
    }
  }
  
  if (Array.isArray(field)) {
    return field as T;
  }
  
  if (typeof field === 'object' && field !== null) {
    return field as T;
  }
  
  return defaultValue;
}

export interface BoardStatus {
  accepted: boolean;
  accepted_at: string | null;
  board_members: string[];
  ready: boolean;
}

export function parseSupabaseAssessment(data: any): AssessmentResponse | null {
  if (!data || !data.email || !data.group_id) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    group_id: data.group_id,
    fit_message: data.fit_message || '',
    responses: data.responses || {},
    status: data.status || 'pending',
    created_at: data.created_at || new Date().toISOString(),
    is_primary: data.is_primary ?? true,
    invited_email_sent_at: data.invited_email_sent_at
  };
}
