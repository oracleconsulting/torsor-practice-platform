
export interface RoadmapWeek {
  week_number: number;
  title: string;
  description: string;
  actions: {
    id: string;
    title: string;
    description: string;
    estimated_hours: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface RoadmapData {
  id: string;
  title: string;
  description: string;
  weeks: RoadmapWeek[];
  generated_at: string;
}

// Add missing Week interface for compatibility
export interface Week {
  week_number: number;
  title?: string;
  theme?: string;
  focus?: string;
  priority_level?: string;
  time_budget?: string;
  actions: any[];
  expected_outcome?: string;
}

// Add missing TaskProgress interface for compatibility
export interface TaskProgress {
  weekNumber: number;
  completedTasks: number;
  totalTasks: number;
  tasks: boolean[];
}
