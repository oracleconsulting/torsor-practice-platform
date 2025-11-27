// Roadmap Types for 365 Client Portal

export interface Roadmap {
  id: string;
  practice_id: string;
  client_id: string;
  
  // Generated content
  roadmap_data: RoadmapData;
  fit_assessment: FitAssessment | null;
  value_analysis: ValueAnalysis | null;
  
  // Generation metadata
  llm_model: string | null;
  prompt_version: string | null;
  generation_cost_cents: number | null;
  generation_duration_ms: number | null;
  
  // Versioning
  version: number;
  is_active: boolean;
  superseded_by: string | null;
  superseded_at: string | null;
  
  // Manual edits
  manually_edited: boolean;
  edited_by: string | null;
  edited_at: string | null;
  edit_notes: string | null;
  
  created_at: string;
}

export interface RoadmapData {
  summary: {
    headline: string;
    keyInsight: string;
    expectedOutcome: string;
  };
  priorities: Priority[];
  weeks: WeekPlan[];
  successMetrics: SuccessMetric[];
}

export interface Priority {
  rank: number;
  title: string;
  description: string;
  category: TaskCategory;
  targetOutcome: string;
  weekSpan: [number, number];
}

export interface WeekPlan {
  weekNumber: number;
  theme: string;
  focus: string;
  tasks: TaskDefinition[];
  milestone: string | null;
  advisorCheckpoint: boolean;
}

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedHours: number;
  dependsOn: string[] | null;
  deliverable: string;
  resources: string[] | null;
}

export interface SuccessMetric {
  metric: string;
  baseline: string;
  target: string;
  measurementMethod: string;
}

export interface FitAssessment {
  fitScore: number;
  fitCategory: 'excellent' | 'good' | 'moderate' | 'poor';
  strengths: string[];
  challenges: string[];
  recommendedFocus: string;
  welcomeMessage: string;
  advisorNotes: string;
}

export interface ValueAnalysis {
  executiveSummary: string;
  exitReadinessScore: ExitReadinessScore;
  hiddenAssets: HiddenAsset[];
  valueDestroyers: ValueDestroyer[];
  quickWins: QuickWin[];
  valuationInsights: ValuationInsights;
  recommendedFocus: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface ExitReadinessScore {
  overall: number;
  breakdown: {
    financials: number;
    operations: number;
    team: number;
    documentation: number;
    customerBase: number;
    marketPosition: number;
  };
  interpretation: string;
}

export interface HiddenAsset {
  asset: string;
  currentState: string;
  potentialValue: string;
  unlockStrategy: string;
  timeToRealize: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ValueDestroyer {
  risk: string;
  currentImpact: string;
  potentialImpact: string;
  mitigationStrategy: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface QuickWin {
  action: string;
  valueImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface ValuationInsights {
  estimatedCurrentMultiple: string;
  potentialMultiple: string;
  keyDrivers: string[];
  comparables: string;
}

// Task Types
export type TaskCategory = 
  | 'Financial' 
  | 'Operations' 
  | 'Team' 
  | 'Marketing' 
  | 'Product' 
  | 'Systems' 
  | 'Personal';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'deferred';

export interface Task {
  id: string;
  practice_id: string;
  client_id: string;
  roadmap_id: string | null;
  
  week_number: number;
  title: string;
  description: string | null;
  category: TaskCategory | null;
  priority: TaskPriority;
  estimated_hours: number | null;
  
  status: TaskStatus;
  completed_at: string | null;
  completion_notes: string | null;
  
  attachments: TaskAttachment[];
  due_date: string | null;
  reminder_sent_at: string | null;
  sort_order: number;
  
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

