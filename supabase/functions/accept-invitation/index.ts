// ============================================================================
// EDGE FUNCTION: accept-invitation
// ============================================================================
// Handles client invitation acceptance:
// 1. Validates invitation token
// 2. Creates auth user if needed
// 3. Creates practice_members record
// 4. Creates client_service_lines enrollments
// 5. Returns session for auto-login
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptRequest {
  token: string;
  password: string;
  name?: string;  // Can override the name from invitation
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ================================================================
    // ACTION: Validate token (GET request from frontend)
    // ================================================================
    if (req.method === 'GET' || action === 'validate') {
      const token = url.searchParams.get('token');
      
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Missing token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: invitation, error } = await supabase
        .from('client_invitations')
        .select(`
          id,
          email,
          name,
          status,
          expires_at,
          practice_id,
          service_line_ids,
          include_discovery,
          practices:practice_id (name)
        `)
        .eq('invitation_token', token)
        .single();

      if (error || !invitation) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid invitation' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invitation has expired', expired: true }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already accepted
      if (invitation.status === 'accepted') {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invitation already accepted', alreadyAccepted: true }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get service line names
      const { data: serviceLines } = await supabase
        .from('service_lines')
        .select('id, code, name')
        .in('id', invitation.service_line_ids || []);

      return new Response(
        JSON.stringify({
          valid: true,
          invitation: {
            email: invitation.email,
            name: invitation.name,
            practiceName: (invitation.practices as any)?.name || 'Your Practice',
            services: (serviceLines || []).map(s => s.name),
            includeDiscovery: invitation.include_discovery || false
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // ACTION: Accept invitation (POST request)
    // ================================================================
    const { token, password, name }: AcceptRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invitation
    const { data: invitation, error: invError } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired invitation' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('client_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ success: false, error: 'Invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientEmail = invitation.email.toLowerCase();
    const clientName = name || invitation.name || clientEmail.split('@')[0];

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === clientEmail);

    let userId: string;

    if (existingUser) {
      // User exists - just use their ID
      userId = existingUser.id;
      console.log(`Using existing auth user: ${userId}`);
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: clientEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: clientName,
          invited_via: 'client_invitation'
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ success: false, error: `Failed to create account: ${createError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log(`Created new auth user: ${userId}`);
    }

    // Check if practice_members record exists
    const { data: existingMember } = await supabase
      .from('practice_members')
      .select('id')
      .eq('email', clientEmail)
      .eq('practice_id', invitation.practice_id)
      .single();

    let memberId: string;

    if (existingMember) {
      // Update existing member
      memberId = existingMember.id;
      await supabase
        .from('practice_members')
        .update({
          user_id: userId,
          name: clientName,
          member_type: 'client',
          program_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);
      console.log(`Updated existing practice_member: ${memberId}`);
    } else {
      // Create practice_members record
      const { data: newMember, error: memberError } = await supabase
        .from('practice_members')
        .insert({
          user_id: userId,
          practice_id: invitation.practice_id,
          name: clientName,
          email: clientEmail,
          role: 'Client',
          member_type: 'client',
          program_status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error creating practice_member:', memberError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create client record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      memberId = newMember.id;
      console.log(`Created new practice_member: ${memberId}`);
    }

    // Create client_service_lines enrollments
    const serviceLineIds = invitation.service_line_ids || [];
    const enrollments = [];

    for (const slId of serviceLineIds) {
      const { data: enrollment, error: enrollError } = await supabase
        .from('client_service_lines')
        .upsert({
          client_id: memberId,
          practice_id: invitation.practice_id,
          service_line_id: slId,
          status: 'onboarding',
          invited_at: invitation.created_at,
          invited_by: invitation.invited_by,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,service_line_id' })
        .select('*, service_lines:service_line_id (code, name)')
        .single();

      if (enrollment) {
        enrollments.push({
          serviceCode: (enrollment.service_lines as any)?.code,
          serviceName: (enrollment.service_lines as any)?.name,
          status: enrollment.status
        });
      }
    }

    // Mark invitation as accepted
    await supabase
      .from('client_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        created_client_id: memberId
      })
      .eq('id', invitation.id);

    // Sign in the user to get a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: clientEmail,
      password: password
    });

    // Determine next step - Discovery or Dashboard
    const includeDiscovery = invitation.include_discovery || false;
    const redirectTo = includeDiscovery ? '/discovery' : '/dashboard';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome! Your account has been created.',
        clientId: memberId,
        enrollments,
        includeDiscovery,
        redirectTo,
        session: signInData?.session ? {
          accessToken: signInData.session.access_token,
          refreshToken: signInData.session.refresh_token
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Invitation acceptance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

