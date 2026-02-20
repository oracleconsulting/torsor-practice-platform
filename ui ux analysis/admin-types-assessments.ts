// ============================================================================
// ASSESSMENT TYPES
// ============================================================================

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  field: string;
  type: 'free_text' | 'single_choice' | 'multiple_choice' | 'number' | 'industry_select';
  required: boolean;
  aiAnchor?: boolean;
  label: string;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: QuestionOption[];
  maxSelections?: number;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface AssessmentConfig {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  totalQuestions: number;
  aiAnchors: number;
  sections: Section[];
}

