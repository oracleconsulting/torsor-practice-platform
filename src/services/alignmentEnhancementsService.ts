/**
 * Alignment Enhancements Service
 * 
 * Comprehensive service for all 365 Alignment Programme enhancements:
 * - Client mapping (TORSOR <-> Oracle Method)
 * - Notifications and milestone tracking
 * - Analytics and insights
 * - Bulk task operations
 * - Report exports (PDF/Excel)
 * - Call transcript management
 * - Calendly integration
 */

import { supabase } from '../lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ClientMapping {
  id: string;
  practice_id: string;
  torsor_client_id: string;
  oracle_group_id: string;
  client_email: string;
  business_name?: string;
  mapping_status: 'active' | 'inactive' | 'pending';
  mapped_by?: string;
  mapped_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AlignmentNotification {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  notification_type: 'milestone_completed' | 'week_completed' | 'sprint_completed' | 
    'task_overdue' | 'progress_stalled' | 'roadmap_updated' | 'call_scheduled';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  read_at?: string;
  read_by?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AlignmentAnalytics {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  analysis_date: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  current_week: number;
  weeks_on_track: number;
  weeks_behind: number;
  average_completion_time_days?: number;
  tasks_completed_this_week: number;
  notes_added_this_week: number;
  calls_this_week: number;
  weekly_velocity?: number;
  momentum_score?: number;
  blocked_tasks: number;
  overdue_tasks: number;
  stalled_weeks: number;
  estimated_completion_date?: string;
  confidence_score?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CallTranscript {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  call_type: 'onboarding' | 'weekly_checkin' | 'milestone_review' | 'problem_solving' | 
    'sprint_planning' | 'sprint_retrospective' | 'ad_hoc';
  call_date: string;
  duration_minutes?: number;
  accountant_name?: string;
  accountant_id?: string;
  client_name?: string;
  other_participants?: string[];
  recording_url?: string;
  transcript?: string;
  summary?: string;
  key_points?: string[];
  action_items?: Array<{
    task: string;
    assignee: string;
    due_date?: string;
    completed?: boolean;
  }>;
  topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'concerned' | 'urgent';
  related_sprint_number?: number;
  related_week_number?: number;
  tasks_created: number;
  tasks_updated: number;
  is_confidential: boolean;
  retention_date?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendlyConfig {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  calendly_link: string;
  event_type?: string;
  is_active: boolean;
  custom_message?: string;
  meeting_types?: string[];
  webhook_url?: string;
  auto_create_transcript: boolean;
  auto_add_to_sprint_notes: boolean;
  total_bookings: number;
  last_booking_date?: string;
  configured_by?: string;
  configured_at: string;
  created_at: string;
  updated_at: string;
}

export interface BulkActionLog {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  action_type: 'bulk_complete' | 'bulk_uncomplete' | 'bulk_delete' | 'bulk_add_notes' | 'bulk_assign';
  performed_by: string;
  task_ids: string[];
  tasks_affected: number;
  changes_made: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  practice_id: string;
  oracle_group_id: string;
  export_type: 'pdf' | 'excel' | 'csv' | 'json';
  report_type: 'progress_report' | 'analytics_summary' | 'task_list' | 'transcript_collection' | 'full_roadmap';
  file_url?: string;
  file_size_bytes?: number;
  exported_by: string;
  date_range_start?: string;
  date_range_end?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================================================
// CLIENT MAPPING SERVICE
// ============================================================================

export class ClientMappingService {
  /**
   * Create a new client mapping
   */
  static async createMapping(
    practiceId: string,
    torsorClientId: string,
    oracleGroupId: string,
    clientEmail: string,
    businessName?: string,
    notes?: string
  ): Promise<ClientMapping | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('oracle_client_mapping')
        .insert({
          practice_id: practiceId,
          torsor_client_id: torsorClientId,
          oracle_group_id: oracleGroupId,
          client_email: clientEmail,
          business_name: businessName,
          mapping_status: 'active',
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data as ClientMapping;
    } catch (error) {
      console.error('Error creating client mapping:', error);
      return null;
    }
  }

  /**
   * Get all mappings for a practice
   */
  static async getMappings(practiceId: string): Promise<ClientMapping[]> {
    try {
      const { data, error } = await supabase
        .from('oracle_client_mapping')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ClientMapping[];
    } catch (error) {
      console.error('Error fetching client mappings:', error);
      return [];
    }
  }

  /**
   * Get mapping by TORSOR client ID
   */
  static async getMappingByTorsorClient(torsorClientId: string): Promise<ClientMapping | null> {
    try {
      const { data, error } = await supabase
        .from('oracle_client_mapping')
        .select('*')
        .eq('torsor_client_id', torsorClientId)
        .eq('mapping_status', 'active')
        .single();

      if (error) throw error;
      return data as ClientMapping;
    } catch (error) {
      console.error('Error fetching mapping:', error);
      return null;
    }
  }

  /**
   * Get mapping by Oracle group ID
   */
  static async getMappingByOracleGroup(oracleGroupId: string): Promise<ClientMapping | null> {
    try {
      const { data, error } = await supabase
        .from('oracle_client_mapping')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .eq('mapping_status', 'active')
        .single();

      if (error) throw error;
      return data as ClientMapping;
    } catch (error) {
      console.error('Error fetching mapping:', error);
      return null;
    }
  }

  /**
   * Update mapping status
   */
  static async updateMappingStatus(
    mappingId: string,
    status: 'active' | 'inactive' | 'pending'
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('oracle_client_mapping')
        .update({ mapping_status: status })
        .eq('id', mappingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating mapping status:', error);
      return false;
    }
  }

  /**
   * Delete a mapping
   */
  static async deleteMapping(mappingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('oracle_client_mapping')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting mapping:', error);
      return false;
    }
  }
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  /**
   * Get unread notifications for a practice
   */
  static async getUnreadNotifications(practiceId: string): Promise<AlignmentNotification[]> {
    try {
      const { data, error } = await supabase
        .from('alignment_notifications')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AlignmentNotification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get all notifications for a practice (with pagination)
   */
  static async getNotifications(
    practiceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AlignmentNotification[]> {
    try {
      const { data, error } = await supabase
        .from('alignment_notifications')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []) as AlignmentNotification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('alignment_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: userId
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(practiceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('alignment_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: userId
        })
        .eq('practice_id', practiceId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Create a manual notification
   */
  static async createNotification(
    practiceId: string,
    oracleGroupId: string,
    type: AlignmentNotification['notification_type'],
    title: string,
    message: string,
    priority: AlignmentNotification['priority'] = 'normal',
    metadata?: Record<string, any>
  ): Promise<AlignmentNotification | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('alignment_notifications')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          notification_type: type,
          title,
          message,
          priority,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data as AlignmentNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    practiceId: string,
    onNotification: (notification: AlignmentNotification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications-${practiceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alignment_notifications',
          filter: `practice_id=eq.${practiceId}`
        },
        (payload) => {
          onNotification(payload.new as AlignmentNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {
  /**
   * Get latest analytics for a client
   */
  static async getLatestAnalytics(oracleGroupId: string): Promise<AlignmentAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('alignment_analytics')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as AlignmentAnalytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }

  /**
   * Get analytics history (for trend charts)
   */
  static async getAnalyticsHistory(
    oracleGroupId: string,
    days: number = 30
  ): Promise<AlignmentAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('alignment_analytics')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .gte('analysis_date', startDate.toISOString().split('T')[0])
        .order('analysis_date', { ascending: true });

      if (error) throw error;
      return (data || []) as AlignmentAnalytics[];
    } catch (error) {
      console.error('Error fetching analytics history:', error);
      return [];
    }
  }

  /**
   * Calculate and store analytics snapshot
   */
  static async calculateAnalytics(
    practiceId: string,
    oracleGroupId: string
  ): Promise<AlignmentAnalytics | null> {
    try {
      // This would typically be done server-side, but for now we'll do it client-side
      // In production, this should be a scheduled job or triggered function
      
      // Fetch sprint progress data
      const { data: tasks, error: tasksError } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('group_id', oracleGroupId);

      if (tasksError) throw tasksError;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.completed).length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate this week's activity
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const tasksCompletedThisWeek = tasks?.filter(
        t => t.completed && t.completed_date && new Date(t.completed_date) >= oneWeekAgo
      ).length || 0;

      // Store analytics
      const { data, error } = await (supabase as any)
        .from('alignment_analytics')
        .upsert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          analysis_date: new Date().toISOString().split('T')[0],
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          completion_rate: completionRate,
          tasks_completed_this_week: tasksCompletedThisWeek,
          metadata: {
            calculated_at: new Date().toISOString()
          }
        }, {
          onConflict: 'oracle_group_id,analysis_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data as AlignmentAnalytics;
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return null;
    }
  }
}

// ============================================================================
// BULK ACTIONS SERVICE
// ============================================================================

export class BulkActionsService {
  /**
   * Bulk complete tasks
   */
  static async bulkCompleteTasks(
    practiceId: string,
    oracleGroupId: string,
    taskIds: string[],
    performedBy: string
  ): Promise<boolean> {
    try {
      // Update all tasks
      const { error } = await (supabase as any)
        .from('sprint_progress')
        .update({
          completed: true,
          completed_date: new Date().toISOString()
        })
        .in('task_id', taskIds);

      if (error) throw error;

      // Log bulk action
      await (supabase as any)
        .from('alignment_bulk_actions')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          action_type: 'bulk_complete',
          performed_by: performedBy,
          task_ids: taskIds,
          tasks_affected: taskIds.length,
          changes_made: { completed: true }
        });

      return true;
    } catch (error) {
      console.error('Error bulk completing tasks:', error);
      return false;
    }
  }

  /**
   * Bulk uncomplete tasks
   */
  static async bulkUncompleteTasks(
    practiceId: string,
    oracleGroupId: string,
    taskIds: string[],
    performedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('sprint_progress')
        .update({
          completed: false,
          completed_date: null
        })
        .in('task_id', taskIds);

      if (error) throw error;

      await (supabase as any)
        .from('alignment_bulk_actions')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          action_type: 'bulk_uncomplete',
          performed_by: performedBy,
          task_ids: taskIds,
          tasks_affected: taskIds.length,
          changes_made: { completed: false }
        });

      return true;
    } catch (error) {
      console.error('Error bulk uncompleting tasks:', error);
      return false;
    }
  }

  /**
   * Bulk delete tasks
   */
  static async bulkDeleteTasks(
    practiceId: string,
    oracleGroupId: string,
    taskIds: string[],
    performedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sprint_progress')
        .delete()
        .in('task_id', taskIds);

      if (error) throw error;

      await (supabase as any)
        .from('alignment_bulk_actions')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          action_type: 'bulk_delete',
          performed_by: performedBy,
          task_ids: taskIds,
          tasks_affected: taskIds.length,
          changes_made: { deleted: true }
        });

      return true;
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      return false;
    }
  }

  /**
   * Bulk add notes to tasks
   */
  static async bulkAddNotes(
    practiceId: string,
    oracleGroupId: string,
    taskIds: string[],
    notes: string,
    performedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('sprint_progress')
        .update({ notes })
        .in('task_id', taskIds);

      if (error) throw error;

      await (supabase as any)
        .from('alignment_bulk_actions')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          action_type: 'bulk_add_notes',
          performed_by: performedBy,
          task_ids: taskIds,
          tasks_affected: taskIds.length,
          changes_made: { notes }
        });

      return true;
    } catch (error) {
      console.error('Error bulk adding notes:', error);
      return false;
    }
  }
}

// ============================================================================
// CALL TRANSCRIPT SERVICE
// ============================================================================

export class CallTranscriptService {
  /**
   * Get all call transcripts for a client
   */
  static async getTranscripts(
    oracleGroupId: string,
    limit: number = 50
  ): Promise<CallTranscript[]> {
    try {
      const { data, error } = await supabase
        .from('alignment_call_transcripts')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .order('call_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as CallTranscript[];
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      return [];
    }
  }

  /**
   * Create a new call transcript
   */
  static async createTranscript(
    practiceId: string,
    oracleGroupId: string,
    callData: Partial<CallTranscript>
  ): Promise<CallTranscript | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('alignment_call_transcripts')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          ...callData
        })
        .select()
        .single();

      if (error) throw error;
      return data as CallTranscript;
    } catch (error) {
      console.error('Error creating transcript:', error);
      return null;
    }
  }

  /**
   * Update transcript
   */
  static async updateTranscript(
    transcriptId: string,
    updates: Partial<CallTranscript>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('alignment_call_transcripts')
        .update(updates)
        .eq('id', transcriptId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating transcript:', error);
      return false;
    }
  }

  /**
   * Delete transcript
   */
  static async deleteTranscript(transcriptId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alignment_call_transcripts')
        .delete()
        .eq('id', transcriptId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transcript:', error);
      return false;
    }
  }

  /**
   * Search transcripts by content
   */
  static async searchTranscripts(
    oracleGroupId: string,
    searchTerm: string
  ): Promise<CallTranscript[]> {
    try {
      const { data, error } = await supabase
        .from('alignment_call_transcripts')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .or(`transcript.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
        .order('call_date', { ascending: false });

      if (error) throw error;
      return (data || []) as CallTranscript[];
    } catch (error) {
      console.error('Error searching transcripts:', error);
      return [];
    }
  }

  /**
   * Get transcripts by topic (for learning module)
   */
  static async getTranscriptsByTopic(
    topic: string,
    limit: number = 20
  ): Promise<CallTranscript[]> {
    try {
      const { data, error } = await supabase
        .from('alignment_call_transcripts')
        .select('*')
        .contains('topics', [topic])
        .eq('is_confidential', false)
        .order('call_date', { ascending: false})
        .limit(limit);

      if (error) throw error;
      return (data || []) as CallTranscript[];
    } catch (error) {
      console.error('Error fetching transcripts by topic:', error);
      return [];
    }
  }
}

// ============================================================================
// CALENDLY SERVICE
// ============================================================================

export class CalendlyService {
  /**
   * Get Calendly config for a client
   */
  static async getConfig(oracleGroupId: string): Promise<CalendlyConfig | null> {
    try {
      const { data, error } = await supabase
        .from('alignment_calendly_config')
        .select('*')
        .eq('oracle_group_id', oracleGroupId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as CalendlyConfig;
    } catch (error) {
      console.error('Error fetching Calendly config:', error);
      return null;
    }
  }

  /**
   * Create or update Calendly config
   */
  static async saveConfig(
    practiceId: string,
    oracleGroupId: string,
    calendlyLink: string,
    config: Partial<CalendlyConfig>
  ): Promise<CalendlyConfig | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('alignment_calendly_config')
        .upsert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          calendly_link: calendlyLink,
          is_active: true,
          ...config
        }, {
          onConflict: 'oracle_group_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendlyConfig;
    } catch (error) {
      console.error('Error saving Calendly config:', error);
      return null;
    }
  }

  /**
   * Deactivate Calendly config
   */
  static async deactivateConfig(oracleGroupId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('alignment_calendly_config')
        .update({ is_active: false })
        .eq('oracle_group_id', oracleGroupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating Calendly config:', error);
      return false;
    }
  }

  /**
   * Record a booking (webhook handler)
   */
  static async recordBooking(oracleGroupId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('alignment_calendly_config')
        .update({
          total_bookings: supabase.raw('total_bookings + 1'),
          last_booking_date: new Date().toISOString()
        })
        .eq('oracle_group_id', oracleGroupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording booking:', error);
      return false;
    }
  }
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export class ExportService {
  /**
   * Generate progress report (would call backend API in production)
   */
  static async generateProgressReport(
    practiceId: string,
    oracleGroupId: string,
    exportType: 'pdf' | 'excel' | 'csv',
    exportedBy: string
  ): Promise<{ url: string; fileSize: number } | null> {
    try {
      // In production, this would call a backend API to generate the report
      // For now, we'll simulate it
      
      console.log('Generating progress report...', { exportType, oracleGroupId });
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUrl = `https://storage.example.com/reports/${oracleGroupId}-progress-${Date.now()}.${exportType}`;
      const mockFileSize = Math.floor(Math.random() * 1000000) + 50000;

      // Log export
      await (supabase as any)
        .from('alignment_export_history')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          export_type: exportType,
          report_type: 'progress_report',
          file_url: mockUrl,
          file_size_bytes: mockFileSize,
          exported_by: exportedBy
        });

      return { url: mockUrl, fileSize: mockFileSize };
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }

  /**
   * Export analytics summary
   */
  static async exportAnalytics(
    practiceId: string,
    oracleGroupId: string,
    exportType: 'pdf' | 'excel',
    exportedBy: string,
    dateRangeStart?: string,
    dateRangeEnd?: string
  ): Promise<{ url: string; fileSize: number } | null> {
    try {
      console.log('Exporting analytics...', { exportType, oracleGroupId, dateRangeStart, dateRangeEnd });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUrl = `https://storage.example.com/reports/${oracleGroupId}-analytics-${Date.now()}.${exportType}`;
      const mockFileSize = Math.floor(Math.random() * 500000) + 30000;

      await (supabase as any)
        .from('alignment_export_history')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          export_type: exportType,
          report_type: 'analytics_summary',
          file_url: mockUrl,
          file_size_bytes: mockFileSize,
          exported_by: exportedBy,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd
        });

      return { url: mockUrl, fileSize: mockFileSize };
    } catch (error) {
      console.error('Error exporting analytics:', error);
      return null;
    }
  }

  /**
   * Export task list
   */
  static async exportTaskList(
    practiceId: string,
    oracleGroupId: string,
    exportType: 'excel' | 'csv',
    exportedBy: string
  ): Promise<{ url: string; fileSize: number } | null> {
    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('group_id', oracleGroupId)
        .order('week_number', { ascending: true });

      if (!tasks) return null;

      // In production, convert to CSV/Excel
      const csvContent = this.convertTasksToCSV(tasks);
      
      console.log('Task list exported', { exportType, taskCount: tasks.length });
      
      const mockUrl = `https://storage.example.com/reports/${oracleGroupId}-tasks-${Date.now()}.${exportType}`;
      const mockFileSize = csvContent.length;

      await (supabase as any)
        .from('alignment_export_history')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          export_type: exportType,
          report_type: 'task_list',
          file_url: mockUrl,
          file_size_bytes: mockFileSize,
          exported_by: exportedBy
        });

      return { url: mockUrl, fileSize: mockFileSize };
    } catch (error) {
      console.error('Error exporting task list:', error);
      return null;
    }
  }

  /**
   * Get export history
   */
  static async getExportHistory(
    practiceId: string,
    oracleGroupId?: string
  ): Promise<ExportHistory[]> {
    try {
      let query = supabase
        .from('alignment_export_history')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });

      if (oracleGroupId) {
        query = query.eq('oracle_group_id', oracleGroupId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ExportHistory[];
    } catch (error) {
      console.error('Error fetching export history:', error);
      return [];
    }
  }

  /**
   * Helper: Convert tasks to CSV format
   */
  private static convertTasksToCSV(tasks: any[]): string {
    const headers = ['Week', 'Task Title', 'Status', 'Completed Date', 'Notes'];
    const rows = tasks.map(task => [
      task.week_number || '',
      task.task_title || '',
      task.completed ? 'Completed' : 'Pending',
      task.completed_date || '',
      task.notes || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

// Export singleton instances
export const clientMappingService = ClientMappingService;
export const notificationService = NotificationService;
export const analyticsService = AnalyticsService;
export const bulkActionsService = BulkActionsService;
export const callTranscriptService = CallTranscriptService;
export const calendlyService = CalendlyService;
export const exportService = ExportService;


