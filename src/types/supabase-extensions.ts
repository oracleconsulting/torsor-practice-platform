
import { Database } from '@/integrations/supabase/types';

export type ExtendedClientConfig = Database['public']['Tables']['client_config']['Row'] & {
  board_accepted?: boolean;
  board_accepted_at?: string | null;
  board_rejected_at?: string | null;
  rejection_reason?: string | null;
};

export type BoardConfig = {
  board: string[];
  rationale: Record<string, string>;
  scores: Record<string, number>;
};

export type ConversationHistoryRow = {
  id: string;
  created_at: string;
  group_id: string;
  question: string;
  responses: Record<string, any>;
  session_id: string;
  synthesis: string;
  timestamp: string;
};

// Helper function to safely parse JSON
export const safeJsonToRecord = (json: any): Record<string, any> => {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, any>;
  }
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
  return {};
};

// Helper function to safely parse JSON array
export const safeJsonToArray = (json: any): string[] => {
  if (Array.isArray(json)) {
    return json;
  }
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
