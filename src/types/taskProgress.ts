
export interface TaskProgress {
  weekNumber: number;
  completedTasks: number;
  totalTasks: number;
  tasks: boolean[];
}

export interface WeekProgress {
  weekNumber: number;
  tasksCompleted: number;
  totalTasks: number;
  progress: TaskProgress[];
}
