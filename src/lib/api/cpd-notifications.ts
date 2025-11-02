/**
 * CPD Notifications API
 * Handles CPD-related notifications for team members
 */

import { supabase } from '@/lib/supabase/client';

export interface CPDNotification {
  id: string;
  member_id: string;
  notification_type: 'new_knowledge_document' | 'new_external_resource' | 'recommendations_updated' | 'cpd_reminder' | 'assessment_due';
  title: string;
  message: string;
  knowledge_document_id?: string;
  external_resource_id?: string;
  recommendation_id?: string;
  is_read: boolean;
  read_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at?: string;
  // Joined data
  knowledge_doc_title?: string;
  knowledge_doc_path?: string;
  external_resource_title?: string;
  external_resource_url?: string;
  external_resource_provider?: string;
}

/**
 * Get all unread notifications for a member
 */
export async function getUnreadNotifications(memberId: string): Promise<CPDNotification[]> {
  try {
    const { data, error } = await supabase
      .from('unread_cpd_notifications')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CPD Notifications] Error fetching unread notifications:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('[CPD Notifications] Error fetching unread notifications:', error);
    return [];
  }
}

/**
 * Get count of unread notifications for a member
 */
export async function getUnreadNotificationsCount(memberId: string): Promise<number> {
  try {
    const { data, error } = await (supabase.rpc as any)('get_unread_cpd_notifications_count', {
      p_member_id: memberId
    });

    if (error) {
      console.error('[CPD Notifications] Error fetching unread count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('[CPD Notifications] Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Get all notifications for a member (read and unread)
 */
export async function getAllNotifications(
  memberId: string, 
  limit: number = 50
): Promise<CPDNotification[]> {
  try {
    const { data, error } = await supabase
      .from('cpd_notifications')
      .select(`
        *,
        knowledge_documents!cpd_notifications_knowledge_document_id_fkey (
          title,
          file_path
        ),
        cpd_external_resources!cpd_notifications_external_resource_id_fkey (
          title,
          url,
          provider
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CPD Notifications] Error fetching all notifications:', error);
      return [];
    }

    // Transform the data to flatten joined relationships
    const notifications = (data as any)?.map((n: any) => ({
      ...n,
      knowledge_doc_title: n.knowledge_documents?.title,
      knowledge_doc_path: n.knowledge_documents?.file_path,
      external_resource_title: n.cpd_external_resources?.title,
      external_resource_url: n.cpd_external_resources?.url,
      external_resource_provider: n.cpd_external_resources?.provider
    })) || [];

    return notifications;
  } catch (error) {
    console.error('[CPD Notifications] Error fetching all notifications:', error);
    return [];
  }
}

/**
 * Mark specific notifications as read
 */
export async function markNotificationsAsRead(
  memberId: string,
  notificationIds: string[]
): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as any)('mark_cpd_notifications_read', {
      p_member_id: memberId,
      p_notification_ids: notificationIds
    });

    if (error) {
      console.error('[CPD Notifications] Error marking notifications as read:', error);
      return false;
    }

    console.log(`[CPD Notifications] Marked ${data || 0} notifications as read`);
    return true;
  } catch (error) {
    console.error('[CPD Notifications] Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a member
 */
export async function markAllNotificationsAsRead(memberId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as any)('mark_cpd_notifications_read', {
      p_member_id: memberId,
      p_notification_ids: null
    });

    if (error) {
      console.error('[CPD Notifications] Error marking all notifications as read:', error);
      return false;
    }

    console.log(`[CPD Notifications] Marked ${data || 0} notifications as read`);
    return true;
  } catch (error) {
    console.error('[CPD Notifications] Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Create a manual notification (for testing or admin purposes)
 */
export async function createNotification(
  memberId: string,
  type: CPDNotification['notification_type'],
  title: string,
  message: string,
  priority: CPDNotification['priority'] = 'normal',
  relatedEntityId?: string
): Promise<boolean> {
  try {
    const notification: any = {
      member_id: memberId,
      notification_type: type,
      title,
      message,
      priority,
      created_at: new Date().toISOString()
    };

    // Add related entity IDs based on type
    if (type === 'new_knowledge_document' && relatedEntityId) {
      notification.knowledge_document_id = relatedEntityId;
    } else if (type === 'new_external_resource' && relatedEntityId) {
      notification.external_resource_id = relatedEntityId;
    } else if (type === 'recommendations_updated' && relatedEntityId) {
      notification.recommendation_id = relatedEntityId;
    }

    const { error } = await (supabase
      .from('cpd_notifications') as any)
      .insert(notification);

    if (error) {
      console.error('[CPD Notifications] Error creating notification:', error);
      return false;
    }

    console.log('[CPD Notifications] Created notification:', title);
    return true;
  } catch (error) {
    console.error('[CPD Notifications] Error creating notification:', error);
    return false;
  }
}

/**
 * Trigger CPD recommendation regeneration for all members
 * This should be called when new knowledge base content is added
 */
export async function triggerCPDRegenerationForAll(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('auto_regenerate_cpd_recommendations_for_all');

    if (error) {
      console.error('[CPD Notifications] Error triggering CPD regeneration:', error);
      return 0;
    }

    console.log(`[CPD Notifications] Triggered CPD regeneration for ${data || 0} members`);
    return data || 0;
  } catch (error) {
    console.error('[CPD Notifications] Error triggering CPD regeneration:', error);
    return 0;
  }
}

/**
 * Subscribe to real-time notifications for a member
 */
export function subscribeToNotifications(
  memberId: string,
  onNotification: (notification: CPDNotification) => void
) {
  const subscription = supabase
    .channel('cpd_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cpd_notifications',
        filter: `member_id=eq.${memberId}`
      },
      (payload) => {
        console.log('[CPD Notifications] New notification received:', payload);
        onNotification(payload.new as any);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Cleanup expired notifications (admin function)
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_cpd_notifications');

    if (error) {
      console.error('[CPD Notifications] Error cleaning up expired notifications:', error);
      return 0;
    }

    console.log(`[CPD Notifications] Cleaned up ${data || 0} expired notifications`);
    return data || 0;
  } catch (error) {
    console.error('[CPD Notifications] Error cleaning up expired notifications:', error);
    return 0;
  }
}

