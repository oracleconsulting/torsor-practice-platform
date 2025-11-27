// Client Types for 365 Client Portal

export type MemberType = 'team' | 'client' | 'advisor';
export type ClientStage = 'startup' | 'growth' | 'mature' | 'exit-planning';
export type ProgramStatus = 'invited' | 'active' | 'paused' | 'completed' | 'churned';

export interface ClientSettings {
  notifications: {
    email_reminders: boolean;
    weekly_digest: boolean;
  };
  timezone: string;
  dashboard: Record<string, unknown>;
}

export interface Client {
  id: string;
  practice_id: string;
  user_id: string;
  email: string;
  full_name: string;
  
  // Client-specific fields
  member_type: MemberType;
  client_company: string | null;
  client_industry: string | null;
  client_stage: ClientStage | null;
  program_enrolled_at: string | null;
  program_status: ProgramStatus;
  assigned_advisor_id: string | null;
  last_portal_login: string | null;
  settings: ClientSettings;
  
  // Standard fields
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientSession {
  clientId: string;
  practiceId: string;
  name: string;
  email: string;
  company: string | null;
  status: ProgramStatus;
  enrolledAt: string | null;
  advisor: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ClientEngagementSummary {
  client_id: string;
  practice_id: string;
  full_name: string;
  client_company: string | null;
  program_status: ProgramStatus;
  program_enrolled_at: string | null;
  last_portal_login: string | null;
  assessments_completed: number;
  last_assessment_at: string | null;
  has_active_roadmap: number;
  tasks_completed: number;
  tasks_pending: number;
  activities_30d: number;
  logins_30d: number;
  engagement_score: number;
  computed_at: string;
}

