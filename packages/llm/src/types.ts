// LLM Types

export type LLMTaskType =
  | 'fit_assessment'
  | 'roadmap_generation'
  | 'value_analysis'
  | 'chat_completion'
  | 'meeting_agenda'
  | 'task_breakdown'
  | 'document_summary'
  | 'quarterly_review'
  | 'pdf_generation';

export type ModelTier = 'fast' | 'balanced' | 'premium';

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  fallback?: string;
  costPerMillion: {
    input: number;
    output: number;
  };
}

export interface LLMResult {
  success: boolean;
  content: string | null;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  duration: number;
  error?: string;
}

export interface LLMContext {
  clientId: string;
  practiceId: string;
  requestedBy?: string;
}

export interface ChatContext {
  clientName: string;
  companyName: string;
  industry: string;
  currentWeek: number;
  currentWeekTheme: string;
  currentTasks: Array<{ id: string; title: string; status: string; category: string }>;
  recentCompletions: Array<{ id: string; title: string }>;
  priorities: string[];
  challenges: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

