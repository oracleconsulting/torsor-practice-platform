// ============================================================================
// Sprint Editor — shared types
// ============================================================================

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  whyThisMatters?: string;
  milestone?: string;
  tools?: string;
  timeEstimate?: string;
  deliverable?: string;
  celebrationMoment?: string;
  category?: string;
  priority?: string;
}

export interface SprintWeek {
  weekNumber: number;
  theme: string;
  phase?: string;
  narrative?: string;
  tasks: SprintTask[];
  weekMilestone?: string;
  tuesdayCheckIn?: string;
  week?: number; // alias
}

export interface SprintData {
  sprintTheme?: string;
  sprintPromise?: string;
  sprintGoals?: any;
  phases?: Record<string, { weeks: number[]; theme: string; emotionalGoal?: string }>;
  weeks: SprintWeek[];
  tuesdayEvolution?: Record<string, string>;
  backslidePreventions?: any[];
  nextSprintPreview?: string;
}

export interface ChangeEntry {
  id: string;
  timestamp: string;
  weekNumber: number | null;
  taskIndex: number | null;
  field: string;
  action: 'edit' | 'add' | 'remove' | 'reorder';
  oldValue?: string;
  newValue?: string;
  summary: string;
}

export interface SprintEditorModalProps {
  clientId: string;
  practiceId: string;
  sprintNumber: number;
  stageId: string;
  generatedContent: SprintData;
  approvedContent: SprintData | null;
  currentStatus: string;
  clientName: string;
  tierName: string;
  serviceLineId?: string;
  onSave: () => void;
  onClose: () => void;
}
