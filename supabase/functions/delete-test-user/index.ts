// ============================================================================
// EDGE FUNCTION: delete-test-user
// ============================================================================
// Utility function to delete test auth users and related records
// Use this to clean up test users that are causing login issues
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  email: string;
  practiceId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { email, practiceId }: DeleteRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientEmail = email.toLowerCase();
    console.log(`🗑️ Deleting test user: ${clientEmail}`);

    // Find auth user
    const { data: users } = await supabase.auth.admin.listUsers();
    const authUser = users?.users?.find(u => u.email?.toLowerCase() === clientEmail);

    if (!authUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Auth user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found auth user: ${authUser.id}`);

    // Delete from practice_members if practiceId provided
    if (practiceId) {
      const { error: memberError } = await supabase
        .from('practice_members')
        .delete()
        .eq('email', clientEmail)
        .eq('practice_id', practiceId)
        .eq('member_type', 'client');

      if (memberError) {
        console.error('Error deleting practice_member:', memberError);
      } else {
        console.log('✅ Deleted practice_member record');
      }
    } else {
      // Delete all practice_members records for this email
      const { error: memberError } = await supabase
        .from('practice_members')
        .delete()
        .eq('email', clientEmail)
        .eq('member_type', 'client');

      if (memberError) {
        console.error('Error deleting practice_members:', memberError);
      } else {
        console.log('✅ Deleted practice_member records');
      }
    }

    // Delete from client_invitations
    const { error: invError } = await supabase
      .from('client_invitations')
      .delete()
      .eq('email', clientEmail);

    if (invError) {
      console.error('Error deleting client_invitations:', invError);
    } else {
      console.log('✅ Deleted client_invitation records');
    }

    // Delete from client_service_lines (via practice_members)
    if (authUser.id) {
      const { error: serviceError } = await supabase
        .from('client_service_lines')
        .delete()
        .eq('client_id', authUser.id);

      if (serviceError) {
        console.error('Error deleting client_service_lines:', serviceError);
      } else {
        console.log('✅ Deleted client_service_lines records');
      }
    }

    // Finally, delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to delete auth user: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Successfully deleted auth user: ${authUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted user ${clientEmail}`,
        deletedUserId: authUser.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
