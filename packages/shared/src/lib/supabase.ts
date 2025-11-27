import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client factory
export function createSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Type-safe table names
export const TABLES = {
  PRACTICE_MEMBERS: 'practice_members',
  PRACTICES: 'practices',
  CLIENT_ASSESSMENTS: 'client_assessments',
  CLIENT_ROADMAPS: 'client_roadmaps',
  CLIENT_TASKS: 'client_tasks',
  CLIENT_CHAT_THREADS: 'client_chat_threads',
  CLIENT_CHAT_MESSAGES: 'client_chat_messages',
  CLIENT_APPOINTMENTS: 'client_appointments',
  CLIENT_ACTIVITY_LOG: 'client_activity_log',
  LLM_USAGE_LOG: 'llm_usage_log',
} as const;

// Materialized view
export const VIEWS = {
  CLIENT_ENGAGEMENT_SUMMARY: 'client_engagement_summary',
} as const;

