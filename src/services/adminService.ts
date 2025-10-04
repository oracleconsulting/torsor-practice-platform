import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface AdminPermissions {
  is_super_admin: boolean;
  permissions: { [key: string]: boolean } | string[];
  role: string;
}

export interface RegenerationOptions {
  preserveProgress?: boolean;
  notifyUser?: boolean;
  regenerationReason?: string;
  customParameters?: {
    focusAreas?: string[];
    timeConstraints?: {
      startDate?: Date;
      endDate?: Date;
    };
    priorityShifts?: {
      [key: string]: 'high' | 'medium' | 'low';
    };
  };
}

export interface BulkRegenerationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  failedItems: Array<{
    userId: string;
    error: string;
  }>;
}

class AdminService {
  private static async logAdminAction(
    adminEmail: string,
    actionType: string,
    actionCategory: string,
    targetUserId?: string,
    details?: any
  ) {
    try {
      const { error } = await supabase.from('admin_audit_logs').insert({
        admin_email: adminEmail,
        action_type: actionType,
        action_category: actionCategory,
        target_user_id: targetUserId,
        action_details: details,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  static async createSuperAdmin(email: string) {
    try {
      // First check if the user already exists
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('admin_users')
          .update({
            is_super_admin: true,
            permissions: { full_access: true },
            role: 'super_admin'
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new user
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          email,
          is_super_admin: true,
          permissions: { full_access: true },
          role: 'super_admin'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating super admin:', error);
      return null;
    }
  }

  static async checkAdminPermissions(email: string): Promise<AdminPermissions | null> {
    try {
      // First check if the user exists in admin_users
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      // If user doesn't exist and it's james@ivcaccounting.co.uk, create them as super admin
      if (!data && email === 'james@ivcaccounting.co.uk') {
        console.log('Creating super admin for:', email);
        const newAdmin = await this.createSuperAdmin(email);
        if (newAdmin) {
          return {
            is_super_admin: true,
            permissions: { full_access: true },
            role: 'super_admin'
          };
        }
      }

      // If no data found, return null
      if (!data) {
        console.log('No admin permissions found for:', email);
        return null;
      }

      // Handle both array and object permission formats
      const permissions = typeof data.permissions === 'string' 
        ? JSON.parse(data.permissions)
        : data.permissions;

      return {
        is_super_admin: data.is_super_admin,
        permissions,
        role: data.role
      };
    } catch (error) {
      console.error('Error checking admin permissions:', error);
      return null;
    }
  }

  static async regenerateRoadmap(
    userId: string,
    options: RegenerationOptions,
    adminEmail: string
  ): Promise<boolean> {
    try {
      // Archive current roadmap
      const { data: currentRoadmap } = await supabase
        .from('client_config')
        .select('roadmap')
        .eq('group_id', userId)
        .single();

      // Store in regeneration history
      await supabase.from('regeneration_history').insert({
        user_id: userId,
        regeneration_type: 'roadmap',
        initiated_by: adminEmail,
        reason: options.regenerationReason,
        options,
        old_data: currentRoadmap?.roadmap || null
      });

      // Perform regeneration
      const success = await this.performRoadmapRegeneration(userId, options);

      // Update history with result
      if (success) {
        const { data: newRoadmap } = await supabase
          .from('client_config')
          .select('roadmap')
          .eq('group_id', userId)
          .single();

        await supabase
          .from('regeneration_history')
          .update({
            success: true,
            new_data: newRoadmap?.roadmap || null
          })
          .eq('user_id', userId)
          .eq('regeneration_type', 'roadmap')
          .order('created_at', { ascending: false })
          .limit(1);

        // Log the action
        await this.logAdminAction(
          adminEmail,
          'regenerate_roadmap',
          'roadmap_management',
          userId,
          { options, success: true }
        );

        // Notify user if requested
        if (options.notifyUser) {
          await this.notifyUserOfRegeneration(userId, 'roadmap', options.regenerationReason);
        }
      }

      return success;
    } catch (error) {
      console.error('Error in regenerateRoadmap:', error);
      toast.error('Failed to regenerate roadmap');
      return false;
    }
  }

  static async regenerateBoard(
    userId: string,
    options: RegenerationOptions,
    adminEmail: string
  ): Promise<boolean> {
    try {
      // Similar implementation to regenerateRoadmap but for board
      // Archive current board configuration
      const { data: currentBoard } = await supabase
        .from('client_config')
        .select('board_config')
        .eq('group_id', userId)
        .single();

      // Store in regeneration history
      await supabase.from('regeneration_history').insert({
        user_id: userId,
        regeneration_type: 'board',
        initiated_by: adminEmail,
        reason: options.regenerationReason,
        options,
        old_data: currentBoard?.board_config || null
      });

      // Perform board regeneration
      const success = await this.performBoardRegeneration(userId, options);

      if (success) {
        const { data: newBoard } = await supabase
          .from('client_config')
          .select('board_config')
          .eq('group_id', userId)
          .single();

        await supabase
          .from('regeneration_history')
          .update({
            success: true,
            new_data: newBoard?.board_config || null
          })
          .eq('user_id', userId)
          .eq('regeneration_type', 'board')
          .order('created_at', { ascending: false })
          .limit(1);

        await this.logAdminAction(
          adminEmail,
          'regenerate_board',
          'board_management',
          userId,
          { options, success: true }
        );

        if (options.notifyUser) {
          await this.notifyUserOfRegeneration(userId, 'board', options.regenerationReason);
        }
      }

      return success;
    } catch (error) {
      console.error('Error in regenerateBoard:', error);
      toast.error('Failed to regenerate board');
      return false;
    }
  }

  static async bulkRegenerateRoadmaps(
    userIds: string[],
    options: RegenerationOptions,
    adminEmail: string
  ): Promise<BulkRegenerationResult> {
    const result: BulkRegenerationResult = {
      success: false,
      totalProcessed: userIds.length,
      successCount: 0,
      failedCount: 0,
      failedItems: []
    };

    for (const userId of userIds) {
      try {
        const success = await this.regenerateRoadmap(userId, options, adminEmail);
        if (success) {
          result.successCount++;
        } else {
          result.failedCount++;
          result.failedItems.push({
            userId,
            error: 'Regeneration failed'
          });
        }
      } catch (error) {
        result.failedCount++;
        result.failedItems.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    result.success = result.failedCount === 0;

    await this.logAdminAction(
      adminEmail,
      'bulk_regenerate_roadmaps',
      'roadmap_management',
      null,
      {
        userIds,
        options,
        result
      }
    );

    return result;
  }

  private static async performRoadmapRegeneration(
    userId: string,
    options: RegenerationOptions
  ): Promise<boolean> {
    // Implementation of actual roadmap regeneration logic
    // This would call your existing regeneration service
    return true; // Placeholder
  }

  private static async performBoardRegeneration(
    userId: string,
    options: RegenerationOptions
  ): Promise<boolean> {
    // Implementation of actual board regeneration logic
    // This would call your existing board generation service
    return true; // Placeholder
  }

  private static async notifyUserOfRegeneration(
    userId: string,
    type: 'roadmap' | 'board' | 'sprint',
    reason?: string
  ): Promise<void> {
    // Implementation of user notification logic
    // This could send an email, in-app notification, etc.
  }
}

export default AdminService; 