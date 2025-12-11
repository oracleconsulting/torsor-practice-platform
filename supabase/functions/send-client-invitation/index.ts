// ============================================================================
// EDGE FUNCTION: send-client-invitation
// ============================================================================
// Invites a client to specific service lines via email
// Creates pending invitation record and sends personalized email
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  name: string;
  company?: string;
  practiceId: string;
  invitedBy: string;  // Team member ID
  serviceLineCodes: string[];  // Which services to invite to
  customMessage?: string;
  includeDiscovery?: boolean;  // Whether to start with Destination Discovery
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

    const { email, name, company, practiceId, invitedBy, serviceLineCodes, customMessage, includeDiscovery }: InvitationRequest = await req.json();

    console.log('📥 Received invitation request:', {
      email,
      name,
      practiceId,
      invitedBy,
      serviceLineCodes,
      includeDiscovery
    });

    // Validate required fields
    // For discovery invites, serviceLineCodes can be empty
    if (!email || !practiceId || !invitedBy) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: email, practiceId, invitedBy' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For direct invites (not discovery), require at least one service
    if (!includeDiscovery && (!serviceLineCodes || serviceLineCodes.length === 0)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'For direct invitations, at least one service must be selected' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists as a client in this practice
    const { data: existingClient } = await supabase
      .from('practice_members')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .eq('practice_id', practiceId)
      .single();

    if (existingClient) {
      // Client exists - just enrol them in the new service lines
      const { data: serviceLines } = await supabase
        .from('service_lines')
        .select('id, code, name')
        .in('code', serviceLineCodes);

      const enrolments = [];
      for (const sl of serviceLines || []) {
        const { data: enrolment, error } = await supabase
          .from('client_service_lines')
          .upsert({
            client_id: existingClient.id,
            practice_id: practiceId,
            service_line_id: sl.id,
            status: 'invited',
            invited_at: new Date().toISOString(),
            invited_by: invitedBy
          }, { onConflict: 'client_id,service_line_id' })
          .select()
          .single();
        
        if (enrolment) enrolments.push({ service: sl.name, status: 'invited' });
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: 'existing_client',
          clientId: existingClient.id,
          enrolments,
          message: `${existingClient.name} has been invited to ${enrolments.length} service(s)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // New client - create invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    // Get service line IDs (only if services are specified)
    let serviceLineIds: string[] = [];
    let serviceLineNames: string[] = [];
    
    if (serviceLineCodes && serviceLineCodes.length > 0) {
      const { data: serviceLines } = await supabase
        .from('service_lines')
        .select('id, code, name')
        .in('code', serviceLineCodes);

      serviceLineIds = (serviceLines || []).map(sl => sl.id);
      serviceLineNames = (serviceLines || []).map(sl => sl.name);
    }

    // Create invitation record
    const { data: invitation, error: invError } = await supabase
      .from('client_invitations')
      .insert({
        practice_id: practiceId,
        invited_by: invitedBy,
        email: email.toLowerCase(),
        name: name || '',
        service_line_ids: serviceLineIds,
        invitation_token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        include_discovery: includeDiscovery || false
      })
      .select()
      .single();

    if (invError) throw invError;

    // Get practice details for email
    const { data: practice } = await supabase
      .from('practices')
      .select('name')
      .eq('id', practiceId)
      .single();

    // Get inviter details
    const { data: inviter } = await supabase
      .from('practice_members')
      .select('name')
      .eq('id', invitedBy)
      .single();

    // Build invitation URL
    const baseUrl = Deno.env.get('CLIENT_PORTAL_URL') || 'https://client.torsor.co.uk';
    const invitationUrl = `${baseUrl}/invitation/${token}`;

    // Send email via Resend (or your email provider)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured. Please add RESEND_API_KEY to Edge Function secrets in Supabase dashboard.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Different email content based on whether we're starting with discovery
      const discoveryIntro = includeDiscovery ? `
        <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-weight: bold;">✨ First: A 15-minute Discovery</p>
          <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">
            Before we dive in, we'd love to understand where you're trying to get to. 
            You'll complete a brief questionnaire about your goals, and we'll recommend 
            the best path forward for you.
          </p>
        </div>
      ` : '';

      const servicesSection = includeDiscovery && serviceLineCodes.length === 0 ? `
        <p style="color: #64748b; line-height: 1.6;">
          We'll help you discover which of our services best match your goals.
        </p>
      ` : `
        <p style="color: #64748b; line-height: 1.6;">
          ${inviter?.name || 'Your advisor'} at <strong>${practice?.name || 'the practice'}</strong> 
          has invited you to join:
        </p>
        <ul style="color: #334155; line-height: 1.8;">
          ${serviceLineNames.map(sn => `<li><strong>${sn}</strong></li>`).join('')}
        </ul>
      `;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">You're Invited</h1>
          </div>
          
          <div style="padding: 40px; background: #f8fafc;">
            <p style="font-size: 18px; color: #334155;">Hi ${name || 'there'},</p>
            
            ${servicesSection}
            
            ${discoveryIntro}
            
            ${customMessage ? `
              <div style="background: white; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
                <p style="color: #64748b; margin: 0; font-style: italic;">"${customMessage}"</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                        color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px;
                        font-weight: bold; font-size: 16px;">
                ${includeDiscovery ? 'Start Discovery' : 'Accept Invitation'}
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px;">
              This invitation expires in 7 days. If you have any questions, 
              reply to this email or contact your advisor directly.
            </p>
          </div>
          
          <div style="padding: 20px; background: #1e293b; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              Powered by Torsor • Transforming businesses and lives
            </p>
          </div>
        </div>
      `;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail.includes('@') ? `Torsor <${fromEmail}>` : fromEmail,
          to: email,
          subject: includeDiscovery 
            ? `You're invited to Torsor Client Portal`
            : `You're invited to ${serviceLineNames.join(' & ')}`,
          html: emailHtml
        })
      });

      const responseText = await emailResponse.text();
      console.log('Resend API response status:', emailResponse.status);
      console.log('Resend API response:', responseText);

      if (!emailResponse.ok) {
        const errorData = JSON.parse(responseText || '{}');
        console.error('Resend API error:', errorData);
        throw new Error(`Email send failed: ${errorData.message || responseText || 'Unknown error'}`);
      }

      const emailData = JSON.parse(responseText);
      console.log(`Invitation email sent successfully to ${email}. Email ID: ${emailData.id}`);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Return error but still create the invitation record
      // The invitation URL can still be manually shared
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${(emailError as Error).message}. The invitation was created but the email could not be sent. Please check your Resend API key and configuration.`,
          invitationUrl,
          invitationId: invitation.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Invitation created successfully:', {
      invitationId: invitation.id,
      email,
      invitationUrl
    });

    return new Response(
      JSON.stringify({
        success: true,
        type: 'new_invitation',
        invitationId: invitation.id,
        invitationUrl,
        expiresAt: expiresAt.toISOString(),
        services: serviceLineNames,
        message: `Invitation sent to ${email}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Invitation error:', error);
    console.error('❌ Error stack:', (error as Error).stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        details: (error as Error).stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

