export interface SavePart1Result {
  status: string;
  message: string;
  data?: Array<{
    group_id: string;
    fit_message?: string;
    [key: string]: any;
  }>;
  group_id?: string;
}

export interface SaveResult {
  status: string;
  message?: string;
  data?: {
    group_id?: string;
    id?: string;
    fit_message?: string;
    [key: string]: any;
  };
}

export interface AssessmentApiData {
  email: string;
  group_id: string;
  part1: Record<string, any>;
  part2: Record<string, any>;
  board?: any;
}

// Re-export from the new location
export type { AssessmentProgress, DEFAULT_PROGRESS } from './assessmentProgress';

export interface AssessmentResponse {
  id: string;
  email: string;
  group_id: string;
  fit_message: string;
  responses: Record<string, any>;
  status: string;
  created_at: string;
  is_primary: boolean;
  invited_email_sent_at: string | null;
}
