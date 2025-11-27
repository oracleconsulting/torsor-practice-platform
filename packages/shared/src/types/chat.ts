// Chat Types for 365 Client Portal

export type ThreadType = 'general' | 'task_help' | 'roadmap_question' | 'escalated';
export type ThreadStatus = 'active' | 'resolved' | 'escalated';
export type MessageRole = 'user' | 'assistant' | 'system' | 'advisor';

export interface ChatThread {
  id: string;
  practice_id: string;
  client_id: string;
  
  title: string | null;
  thread_type: ThreadType;
  status: ThreadStatus;
  
  escalated_to: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  
  context_snapshot: ChatContext | null;
  message_count: number;
  last_message_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  
  role: MessageRole;
  content: string;
  
  // For AI messages
  llm_model: string | null;
  tokens_used: number | null;
  generation_cost_cents: number | null;
  
  // For advisor messages
  sent_by: string | null;
  
  attachments: ChatAttachment[];
  metadata: Record<string, unknown>;
  
  created_at: string;
}

export interface ChatAttachment {
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
}

export interface ChatContext {
  clientName: string;
  companyName: string;
  industry: string;
  currentWeek: number;
  currentWeekTheme: string;
  currentTasks: TaskSummary[];
  recentCompletions: TaskSummary[];
  priorities: string[];
  challenges: string[];
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  category: string;
}

// Appointment Types
export type AppointmentType = 'initial' | 'check_in' | 'quarterly_review' | 'ad_hoc' | 'escalation';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface Appointment {
  id: string;
  practice_id: string;
  client_id: string;
  advisor_id: string;
  
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  
  external_id: string | null;
  video_link: string | null;
  
  agenda: AgendaItem[] | null;
  notes: string | null;
  action_items: ActionItem[] | null;
  
  reminder_sent_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface AgendaItem {
  topic: string;
  duration_minutes: number;
  notes?: string;
}

export interface ActionItem {
  title: string;
  assignee: string;
  due_date?: string;
  completed?: boolean;
}

// Activity Types
export type ActivityType = 
  | 'login'
  | 'assessment_started'
  | 'assessment_completed'
  | 'task_completed'
  | 'chat_message'
  | 'document_viewed'
  | 'appointment_booked'
  | 'roadmap_viewed';

export interface ActivityLog {
  id: string;
  practice_id: string;
  client_id: string;
  activity_type: ActivityType;
  activity_data: Record<string, unknown>;
  session_id: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  created_at: string;
}

