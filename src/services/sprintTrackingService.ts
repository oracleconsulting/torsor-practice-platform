import { supabase } from '@/lib/supabase/client';

interface SprintTask {
  id: string;
  task_id: string;
  task_title: string;
  task_description: string;
  completed: boolean;
  completed_date: string | null;
  notes: string | null;
  week: number;
}

interface SprintStats {
  completionPercentage: number;
  currentDay: number;
  totalDays: number;
  status: 'on-track' | 'behind' | 'ahead';
  endDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

interface FeedbackData {
  title: string;
  description: string;
  impact_score: number;
}

export class SprintTrackingService {
  static async getSprintProgress(groupId: string): Promise<SprintTask[]> {
    const storedGroupId = localStorage.getItem('groupId') || '';
    if (!storedGroupId && !groupId) {
      console.warn('No groupId provided to getSprintProgress');
      return [];
    }

    const finalGroupId = storedGroupId || groupId;

    const { data, error } = await supabase
      .from('sprint_progress')
      .select('*')
      .eq('group_id', finalGroupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sprint progress:', error);
      throw error;
    }

    return data?.map(item => ({
      id: item.id,
      task_id: item.task_id || item.id,
      task_title: item.task_title,
      task_description: item.task_description || '',
      completed: item.completed || false,
      completed_date: item.completed_date,
      notes: item.notes,
      week: this.calculateWeekFromCreatedAt(item.created_at)
    })) || [];
  }

  static async getSprintStats(groupId: string): Promise<SprintStats> {
    if (!groupId) {
      console.warn('No groupId provided to getSprintStats');
      return {
        completionPercentage: 0,
        currentDay: 1,
        totalDays: 90,
        status: 'on-track',
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        tasksCompleted: 0,
        totalTasks: 0
      };
    }

    // Get sprint history to find start date
    const { data: historyData } = await supabase
      .from('sprint_history')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(1);

    const startDate = historyData?.[0]?.start_date 
      ? new Date(historyData[0].start_date)
      : new Date(); // Default to today if no history

    // Get all tasks
    const tasks = await this.getSprintProgress(groupId);
    const totalTasks = tasks.length;
    const tasksCompleted = tasks.filter(t => t.completed).length;
    const completionPercentage = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    // Calculate current day
    const now = new Date();
    const timeDiff = now.getTime() - startDate.getTime();
    const currentDay = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    const totalDays = 90;

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);

    // Determine status
    const expectedProgress = (currentDay / totalDays) * 100;
    let status: 'on-track' | 'behind' | 'ahead' = 'on-track';
    
    if (completionPercentage < expectedProgress - 10) {
      status = 'behind';
    } else if (completionPercentage > expectedProgress + 10) {
      status = 'ahead';
    }

    return {
      completionPercentage,
      currentDay: Math.max(1, Math.min(currentDay, totalDays)),
      totalDays,
      status,
      endDate: endDate.toISOString(),
      tasksCompleted,
      totalTasks
    };
  }

  static async updateTaskStatus(taskId: string, completed: boolean, notes: string): Promise<void> {
    const updates: any = {
      completed,
      notes: notes || null
    };

    if (completed) {
      updates.completed_date = new Date().toISOString();
    } else {
      updates.completed_date = null;
    }

    const { error } = await supabase
      .from('sprint_progress')
      .update(updates)
      .eq('task_id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  static async addFeedback(groupId: string, feedbackType: string, data: FeedbackData): Promise<void> {
    const { error } = await supabase
      .from('sprint_feedback')
      .insert({
        group_id: groupId,
        feedback_type: feedbackType,
        title: data.title,
        description: data.description || null,
        impact_score: data.impact_score
      });

    if (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }

  static async initializeSprintTasks(groupId: string, roadmapData: any): Promise<void> {
    if (!groupId) {
      console.error('No groupId provided to initializeSprintTasks');
      throw new Error('Group ID is required to initialize sprint tasks');
    }

    try {
      // Check if tasks already exist
      const existingTasks = await this.getSprintProgress(groupId);
      if (existingTasks.length > 0) {
        console.log('Sprint tasks already initialized');
        return;
      }

      // Extract tasks from roadmap three_month_sprint
      const tasks: any[] = [];
      
      // Check for proper task structure in the roadmap
      if (roadmapData?.three_month_sprint?.weeks) {
        roadmapData.three_month_sprint.weeks.forEach((week: any, weekIndex: number) => {
          const weekNumber = week.week || week.week_number || weekIndex + 1;
          
          // Handle different task structures
          if (week.tasks && Array.isArray(week.tasks)) {
            // Tasks are properly structured objects
            week.tasks.forEach((task: any, taskIndex: number) => {
              tasks.push({
                group_id: groupId,
                task_id: task.id || `week-${weekNumber}-task-${taskIndex + 1}`,
                task_title: task.title || task.task || `Week ${weekNumber} Task ${taskIndex + 1}`,
                task_description: task.description || task.specific_action || task.expected_outcome || '',
                sprint_number: weekNumber,
                week: weekNumber,
                priority: task.priority || 'medium',
                time_estimate: task.timeEstimate || task.time || '1 hour',
                board_member: task.board_member || 'COO',
                completed: false
              });
            });
          } else if (week.actions && Array.isArray(week.actions)) {
            // Legacy format with actions array
            week.actions.forEach((action: any, actionIndex: number) => {
              const actionText = typeof action === 'string' ? action : (action.task || action.action || '');
              
              // Parse out specific task details from action text if it's a string
              let taskTitle = actionText;
              let taskTime = '1 hour';
              let boardMember = 'COO';
              
              // Extract time if embedded in the action text (e.g., "[2 hours]")
              const timeMatch = actionText.match(/\[([^\]]+)\]/);
              if (timeMatch) {
                taskTime = timeMatch[1];
                taskTitle = actionText.replace(timeMatch[0], '').trim();
              }
              
              // Extract specific title before colon if present
              const colonIndex = taskTitle.indexOf(':');
              if (colonIndex > 0 && colonIndex < 50) {
                taskTitle = taskTitle.substring(0, colonIndex).trim();
              }
              
              // Determine board member based on task content
              const taskLower = taskTitle.toLowerCase();
              if (taskLower.includes('financ') || taskLower.includes('revenue') || taskLower.includes('metric')) {
                boardMember = 'CFO';
              } else if (taskLower.includes('market') || taskLower.includes('customer') || taskLower.includes('sale')) {
                boardMember = 'CMO';
              } else if (taskLower.includes('system') || taskLower.includes('process') || taskLower.includes('automat')) {
                boardMember = 'COO';
              }
              
              tasks.push({
                group_id: groupId,
                task_id: `week-${weekNumber}-task-${actionIndex + 1}`,
                task_title: taskTitle,
                task_description: typeof action === 'object' ? (action.description || action.specific_action || '') : '',
                sprint_number: weekNumber,
                week: weekNumber,
                priority: typeof action === 'object' ? (action.priority || 'medium') : 'medium',
                time_estimate: typeof action === 'object' ? (action.time || taskTime) : taskTime,
                board_member: typeof action === 'object' ? (action.board_member || boardMember) : boardMember,
                completed: false
              });
            });
          } else if (week.week || week.action || week.detail) {
            // Very basic format - single task per week
            tasks.push({
              group_id: groupId,
              task_id: `week-${weekNumber}-task-1`,
              task_title: week.theme || `Week ${weekNumber}: ${week.focus || 'Sprint Focus'}`,
              task_description: week.action || week.detail || week.focus || '',
              sprint_number: weekNumber,
              week: weekNumber,
              priority: week.priority_level === 'IMMEDIATE RELIEF' ? 'high' : 'medium',
              time_estimate: week.time_budget || '2 hours',
              board_member: 'COO',
              completed: false
            });
          }
        });
      }

      // Add quick win as a high-priority task if available
      if (roadmapData?.three_month_sprint?.quick_win) {
        tasks.unshift({
          group_id: groupId,
          task_id: 'quick-win',
          task_title: `🎯 ${roadmapData.three_month_sprint.quick_win.title || 'Quick Win'}`,
          task_description: roadmapData.three_month_sprint.quick_win.action || roadmapData.three_month_sprint.quick_win.description || '',
          sprint_number: 0,
          week: 0,
          priority: 'high',
          time_estimate: roadmapData.three_month_sprint.quick_win.time || '2 hours',
          board_member: 'CEO',
          completed: false
        });
      }

      if (tasks.length > 0) {
        const { error } = await supabase
          .from('sprint_progress')
          .insert(tasks);

        if (error) {
          console.error('Error initializing sprint tasks:', error);
          throw error;
        }
        
        console.log(`Initialized ${tasks.length} sprint tasks for group ${groupId}`);
      }

      // Create sprint history entry
      const { error: historyError } = await supabase
        .from('sprint_history')
        .insert({
          group_id: groupId,
          sprint_number: 1,
          start_date: new Date().toISOString().split('T')[0],
          key_metrics: { tasks_created: tasks.length }
        });

      if (historyError) {
        console.error('Error creating sprint history:', historyError);
        throw historyError;
      }

    } catch (error) {
      console.error('Error initializing sprint:', error);
      throw error;
    }
  }

  private static calculateWeekFromCreatedAt(createdAt: string): number {
    // Simple week calculation - in a real app, you'd base this on sprint start date
    const created = new Date(createdAt);
    const weekNumber = Math.ceil(created.getDate() / 7);
    return Math.max(1, Math.min(weekNumber, 12)); // Clamp between 1-12 weeks
  }
}

export const sprintTrackingService = SprintTrackingService;
