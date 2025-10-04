/**
 * Oracle Method Integration Service
 * 
 * This service connects the TORSOR Practice Platform with the Oracle Method Portal,
 * allowing accountants to view and manage client progress in real-time.
 * 
 * Features:
 * - Fetch 5-year vision, 6-month shifts, and 3-month sprints
 * - Real-time progress updates via Supabase subscriptions
 * - Task management and updates
 * - Sprint stats and completion tracking
 */

import { supabase } from '../lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types matching Oracle Method Portal structure
export interface OracleMethodClient {
  group_id: string;
  email: string;
  business_name?: string;
  five_year_vision: FiveYearVision | null;
  six_month_shift: SixMonthShift | null;
  three_month_sprint: ThreeMonthSprint | null;
  current_week: number;
  sprint_iteration: number;
  roadmap_generated: boolean;
  roadmap_generated_at?: string;
  next_sprint_review?: string;
}

export interface FiveYearVision {
  title: string;
  description: string;
  target_revenue: number;
  target_team_size?: number;
  strategic_pillars: string[];
  archetype?: string;
  key_metrics?: {
    revenue?: string;
    team?: string;
    systems?: string;
  };
}

export interface SixMonthShift {
  vision_statement: string;
  key_metrics: {
    revenue: string;
    time_freedom: string;
    team: string;
    systems?: string;
  };
  major_milestones: string[];
  warning_signs?: string[];
  shift_theme?: string;
}

export interface ThreeMonthSprint {
  weeks: SprintWeek[];
  total_weeks: number;
  weekly_hours: number;
  daily_minutes: number;
  sprint_theme?: string;
  sprint_goals?: string[];
  success_metrics?: Record<string, string>;
}

export interface SprintWeek {
  week_number: number;
  title: string;
  focus: string;
  actions: string[];
  expected_outcome: string;
  time_required?: string;
}

export interface SprintTask {
  task_id: string;
  group_id: string;
  sprint_number: number;
  week_number?: number;
  task_title: string;
  task_description?: string;
  completed: boolean;
  completed_date?: string;
  notes?: string;
  updated_at: string;
}

export interface SprintStats {
  current_week: number;
  sprint_iteration: number;
  tasks_completed: number;
  total_tasks: number;
  completion_percentage: number;
  weeks_remaining: number;
}

export interface ClientProgress {
  group_id: string;
  business_name: string;
  email: string;
  roadmap: OracleMethodClient;
  tasks: SprintTask[];
  stats: SprintStats;
  last_updated: string;
}

export class OracleMethodIntegrationService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  /**
   * Fetch all Oracle Method clients for the current practice
   * Note: In production, filter by practice_id or similar
   */
  async getAllClients(): Promise<OracleMethodClient[]> {
    try {
      const { data, error } = await supabase
        .from('client_config')
        .select(`
          group_id,
          email,
          five_year_vision,
          six_month_shift,
          three_month_sprint,
          current_week,
          sprint_iteration,
          roadmap_generated,
          roadmap_generated_at,
          next_sprint_review
        `)
        .eq('roadmap_generated', true)
        .order('roadmap_generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching Oracle Method clients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllClients:', error);
      throw error;
    }
  }

  /**
   * Fetch a single client's roadmap data by group_id
   */
  async getClientRoadmap(groupId: string): Promise<OracleMethodClient | null> {
    try {
      const { data, error } = await supabase
        .from('client_config')
        .select('group_id, roadmap')
        .eq('group_id', groupId)
        .single();

      if (error) {
        console.error('Error fetching client roadmap:', error);
        throw error;
      }

      const configData = data as any;
      
      if (!configData || !configData.roadmap) {
        console.error('No roadmap data found for group_id:', groupId);
        return null;
      }

      // Extract data from the roadmap JSONB column
      const roadmapData = configData.roadmap as any;
      
      return {
        group_id: configData.group_id,
        email: roadmapData.email || '',
        five_year_vision: roadmapData.five_year_vision || null,
        six_month_shift: roadmapData.six_month_shift || null,
        three_month_sprint: roadmapData.three_month_sprint || null,
        current_week: roadmapData.current_week || 0,
        sprint_iteration: roadmapData.sprint_iteration || 1,
        roadmap_generated: roadmapData.roadmap_generated || true,
        roadmap_generated_at: roadmapData.roadmap_generated_at || new Date().toISOString(),
        next_sprint_review: roadmapData.next_sprint_review || null
      };
    } catch (error) {
      console.error('Error in getClientRoadmap:', error);
      return null;
    }
  }

  /**
   * Fetch sprint tasks for a specific client
   */
  async getSprintTasks(groupId: string): Promise<SprintTask[]> {
    try {
      const { data, error } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('group_id', groupId)
        .order('week_number', { ascending: true });

      if (error) {
        console.error('Error fetching sprint tasks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSprintTasks:', error);
      return [];
    }
  }

  /**
   * Calculate sprint statistics for a client
   */
  async getSprintStats(groupId: string): Promise<SprintStats | null> {
    try {
      // Fetch roadmap data
      const roadmap = await this.getClientRoadmap(groupId);
      if (!roadmap || !roadmap.three_month_sprint) {
        return null;
      }

      // Fetch task completion
      const tasks = await this.getSprintTasks(groupId);
      
      const totalWeeks = roadmap.three_month_sprint.total_weeks || 12;
      const totalTasks = roadmap.three_month_sprint.weeks.reduce(
        (sum, week) => sum + week.actions.length,
        0
      );
      const tasksCompleted = tasks.filter(t => t.completed).length;
      const weeksRemaining = Math.max(0, totalWeeks - (roadmap.current_week || 0));

      return {
        current_week: roadmap.current_week || 0,
        sprint_iteration: roadmap.sprint_iteration || 1,
        tasks_completed: tasksCompleted,
        total_tasks: totalTasks,
        completion_percentage: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0,
        weeks_remaining: weeksRemaining
      };
    } catch (error) {
      console.error('Error calculating sprint stats:', error);
      return null;
    }
  }

  /**
   * Get complete client progress (roadmap + tasks + stats)
   */
  async getClientProgress(groupId: string): Promise<ClientProgress | null> {
    try {
      // Fetch client intake for email and business name
      const { data: intakeData } = await supabase
        .from('client_intake')
        .select('email, responses')
        .eq('group_id', groupId)
        .single();

      const [roadmap, tasks] = await Promise.all([
        this.getClientRoadmap(groupId),
        this.getSprintTasks(groupId)
      ]);

      if (!roadmap) {
        return null;
      }

      const stats = await this.getSprintStats(groupId);

      // Extract business name and email from intake data (if available)
      let businessName = 'Unknown Business';
      let clientEmail = roadmap.email || '';
      
      if (intakeData) {
        const intake = intakeData as any;
        const responses = intake.responses || {};
        businessName = responses.company_name || intake.email || 'Unknown Business';
        clientEmail = intake.email || roadmap.email || '';
      }

      return {
        group_id: groupId,
        business_name: businessName,
        email: clientEmail,
        roadmap,
        tasks,
        stats: stats || {
          current_week: 0,
          sprint_iteration: 1,
          tasks_completed: 0,
          total_tasks: 0,
          completion_percentage: 0,
          weeks_remaining: 12
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting client progress:', error);
      return null;
    }
  }

  /**
   * Update a task's completion status
   * This allows accountants to mark tasks complete/incomplete on behalf of clients
   */
  async updateTaskStatus(taskId: string, completed: boolean, notes?: string): Promise<void> {
    try {
      const updates: Record<string, any> = {
        completed,
        updated_at: new Date().toISOString()
      };

      if (completed) {
        updates.completed_date = new Date().toISOString();
      } else {
        updates.completed_date = null;
      }

      if (notes !== undefined) {
        updates.notes = notes;
      }

      const { error } = await (supabase as any)
        .from('sprint_progress')
        .update(updates)
        .eq('task_id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      throw error;
    }
  }

  /**
   * Add a new task to a client's sprint
   */
  async addTask(
    groupId: string,
    sprintNumber: number,
    weekNumber: number,
    taskTitle: string,
    taskDescription?: string
  ): Promise<SprintTask | null> {
    try {
      const taskId = `${groupId}-w${weekNumber}-${Date.now()}`;

      const { data, error } = await (supabase as any)
        .from('sprint_progress')
        .insert({
          task_id: taskId,
          group_id: groupId,
          sprint_number: sprintNumber,
          week_number: weekNumber,
          task_title: taskTitle,
          task_description: taskDescription || '',
          completed: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      return data as SprintTask;
    } catch (error) {
      console.error('Error in addTask:', error);
      return null;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sprint_progress')
        .delete()
        .eq('task_id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for a client's progress
   */
  subscribeToClientProgress(
    groupId: string,
    onUpdate: (payload: any) => void
  ): () => void {
    const channelName = `client-progress-${groupId}`;

    // Unsubscribe existing channel if it exists
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    // Create new subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprint_progress',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Sprint progress update:', payload);
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_config',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Client config update:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from real-time updates
   */
  private unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((_, channelName) => {
      this.unsubscribe(channelName);
    });
  }

  /**
   * Search for clients by email or business name
   */
  async searchClients(query: string): Promise<OracleMethodClient[]> {
    try {
      const { data, error } = await supabase
        .from('client_config')
        .select(`
          group_id,
          email,
          five_year_vision,
          six_month_shift,
          three_month_sprint,
          current_week,
          sprint_iteration,
          roadmap_generated,
          roadmap_generated_at,
          next_sprint_review
        `)
        .eq('roadmap_generated', true)
        .ilike('email', `%${query}%`)
        .order('roadmap_generated_at', { ascending: false });

      if (error) {
        console.error('Error searching clients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchClients:', error);
      return [];
    }
  }
}

// Export singleton instance
export const oracleMethodService = new OracleMethodIntegrationService();

