import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import type { SprintTask, SprintWeek, Roadmap } from '../types/oracle';

interface RoadmapProgress {
  completedTasks: number;
  totalTasks: number;
  currentWeek: number;
  weeklyProgress: Array<{
    week: number;
    completed: number;
    total: number;
    tasks: Array<{
      task: SprintTask;
      completed: boolean;
    }>;
  }>;
}

interface WeekProgress {
  completed_tasks: string[];
}

interface ProgressData {
  progress: Record<string, WeekProgress>;
}

interface ConfigData {
  roadmap: Roadmap;
}

export const useRoadmapProgress = (groupId: string) => {
  const [progress, setProgress] = useState<RoadmapProgress>({
    completedTasks: 0,
    totalTasks: 0,
    currentWeek: 1,
    weeklyProgress: []
  });

  useEffect(() => {
    if (!groupId) return;

    const fetchProgress = async () => {
      try {
        // Get sprint progress data
        const { data: progressData } = await supabase
          .from('sprint_progress')
          .select('*')
          .eq('group_id', groupId)
          .single() as { data: ProgressData | null };

        // Get roadmap data to calculate total tasks
        const { data: configData } = await supabase
          .from('client_config')
          .select('roadmap')
          .eq('group_id', groupId)
          .single() as { data: ConfigData | null };

        if (!configData?.roadmap?.three_month_sprint?.weeks) {
          return;
        }

        const roadmap = configData.roadmap;
        const weeks = roadmap.three_month_sprint.weeks;
        
        // Calculate current week based on generated_at
        const start = new Date(roadmap.generated_at);
        const now = new Date();
        const weeksPassed = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const currentWeek = Math.min(Math.max(1, weeksPassed + 1), 12);

        // Calculate progress for each week
        const weeklyProgress = weeks.map((week: SprintWeek) => {
          const weekProgress = progressData?.progress?.[`week_${week.week}`] || {
            completed_tasks: []
          };

          return {
            week: week.week,
            completed: weekProgress.completed_tasks.length,
            total: week.tasks.length,
            tasks: week.tasks.map((task: SprintTask) => ({
              task,
              completed: weekProgress.completed_tasks.includes(task.task)
            }))
          };
        });

        // Calculate overall progress
        const totalTasks = weeks.reduce((sum: number, week: SprintWeek) => sum + week.tasks.length, 0);
        const completedTasks = weeklyProgress.reduce((sum: number, week: { completed: number }) => sum + week.completed, 0);

        setProgress({
          completedTasks,
          totalTasks,
          currentWeek,
          weeklyProgress
        });

      } catch (error) {
        console.error('Error fetching roadmap progress:', error);
      }
    };

    fetchProgress();

    // Subscribe to progress updates
    const subscription = supabase
      .channel(`sprint_progress_${groupId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sprint_progress',
        filter: `group_id=eq.${groupId}`
      }, () => {
        fetchProgress();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  return progress;
}; 