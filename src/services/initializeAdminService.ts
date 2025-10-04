import { supabase } from '@/lib/supabase/client';

export class InitializeAdminService {
  static async ensureAdminUser(email: string): Promise<void> {
    try {
      // Check if admin user exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (!existingAdmin) {
        // Create admin user if doesn't exist
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert({
            email: email,
            is_super_admin: true,
            permissions: ['full_access'],
            role: 'super_admin',
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating admin user:', insertError);
        } else {
          console.log('Admin user created successfully:', email);
        }
      } else {
        // Update existing user to ensure super admin status
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            is_super_admin: true,
            permissions: ['full_access'],
            role: 'super_admin'
          })
          .eq('email', email);

        if (updateError) {
          console.error('Error updating admin user:', updateError);
        } else {
          console.log('Admin user updated successfully:', email);
        }
      }
    } catch (error) {
      console.error('Error in ensureAdminUser:', error);
    }
  }

  static async initializeAdminAccess(): Promise<void> {
    const adminEmails = [
      'james@ivcaccounting.co.uk',
      'james@consultoracle.com'
    ];

    for (const email of adminEmails) {
      await this.ensureAdminUser(email);
    }
  }
} 