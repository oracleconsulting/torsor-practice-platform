// Assessment Types for 365 Client Portal

export type AssessmentType = 'part1' | 'part2' | 'part3';
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'reviewed';

export interface Assessment {
  id: string;
  practice_id: string;
  client_id: string;
  assessment_type: AssessmentType;
  
  // Responses stored as flexible JSONB
  responses: Record<string, unknown>;
  
  // Progress tracking
  current_section: number;
  total_sections: number;
  completion_percentage: number;
  
  // Status
  status: AssessmentStatus;
  started_at: string | null;
  completed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  
  // Analytics
  time_spent_seconds: number;
  device_info: DeviceInfo | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
}

// Question Types
export type QuestionType = 
  | 'text' 
  | 'email' 
  | 'textarea' 
  | 'radio' 
  | 'checkbox' 
  | 'slider' 
  | 'number'
  | 'percentage'
  | 'matrix'
  | 'multi-part'
  | 'conditional';

export interface Question {
  id: string;
  fieldName: string;
  question: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
  insight?: string;
  benchmark?: string;
  min?: number;
  max?: number;
  step?: number;
  format?: 'currency' | 'percentage' | 'number';
  hasOther?: boolean;
  otherLabel?: string;
  conditionalQuestions?: ConditionalQuestion[];
  matrixRows?: MatrixRow[];
  matrixColumns?: string[];
  parts?: QuestionPart[];
}

export interface QuestionPart {
  id: string;
  label: string;
  type: string;
}

export interface ConditionalQuestion {
  id: string;
  question: string;
  type: QuestionType;
  fieldName: string;
  showWhen: string;
  options?: string[];
}

export interface MatrixRow {
  id: string;
  label: string;
  fieldName: string;
}

export interface AssessmentSection {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  theme?: string;
  questions: Question[];
}

// Assessment Progress Summary
export interface AssessmentProgress {
  part1: { status: AssessmentStatus; percentage: number };
  part2: { status: AssessmentStatus; percentage: number };
  part3: { status: AssessmentStatus; percentage: number };
  overall: number;
  hasRoadmap: boolean;
  currentWeek: number;
}

