// ============================================================================
// EDGE FUNCTION: send-assessment-review
// ============================================================================
// Sends assessment preview to a colleague for internal review
// Before rolling out to clients
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  practiceId: string;
  assessmentType: 'discovery' | 'service_onboarding' | 'value_audit' | 'all';
  specificAssessments?: string[];  // Optional: specific assessment codes
  customMessage?: string;
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

    const { 
      recipientEmail, 
      recipientName, 
      senderName,
      senderEmail,
      practiceId, 
      assessmentType,
      specificAssessments,
      customMessage 
    }: ReviewRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !senderName || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipientEmail, senderName, practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get practice details
    const { data: practice } = await supabase
      .from('practices')
      .select('name')
      .eq('id', practiceId)
      .single();

    // Build the assessment sections to include
    const sections: { title: string; code: string; description: string }[] = [];
    
    if (assessmentType === 'discovery' || assessmentType === 'all') {
      sections.push(
        { title: 'Destination Discovery', code: 'destination_discovery', description: '20 questions to understand client goals and vision' },
        { title: 'Service Diagnostics', code: 'service_diagnostic', description: '15 questions to map needs to services' }
      );
    }
    
    if (assessmentType === 'service_onboarding' || assessmentType === 'all') {
      sections.push(
        { title: 'Management Accounts', code: 'management_accounts', description: 'Financial Visibility Diagnostic' },
        { title: 'Systems Audit', code: 'systems_audit', description: 'Operations Health Check' },
        { title: 'Fractional CFO', code: 'fractional_cfo', description: 'Financial Leadership Diagnostic' },
        { title: 'Fractional COO', code: 'fractional_coo', description: 'Operational Leadership Diagnostic' },
        { title: 'Business Advisory', code: 'business_advisory', description: 'Value Protection Diagnostic' }
      );
    }
    
    if (assessmentType === 'value_audit' || assessmentType === 'all') {
      sections.push(
        { title: 'Hidden Value Audit', code: 'hidden_value_audit', description: '32 questions across 6 sections' }
      );
    }

    // If specific assessments requested, filter
    const filteredSections = specificAssessments?.length 
      ? sections.filter(s => specificAssessments.includes(s.code))
      : sections;

    // Fetch actual questions for the summary (if table exists)
    let questionsByAssessment: Record<string, any[]> = {};
    try {
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('service_line_code, section, question_text, question_type')
        .in('service_line_code', filteredSections.map(s => s.code))
        .eq('is_active', true)
        .order('display_order');

      if (!questionsError && questions) {
        questionsByAssessment = questions.reduce((acc, q) => {
          if (!acc[q.service_line_code]) acc[q.service_line_code] = [];
          acc[q.service_line_code].push(q);
          return acc;
        }, {} as Record<string, any[]>);
      }
    } catch (e) {
      console.log('Could not fetch questions, table may not exist yet');
    }

    // Generate review URL (public preview - no login required)
    const reviewUrl = `https://torsor.co.uk/review?type=${assessmentType}&practice=${encodeURIComponent(practice?.name || 'RPGCC')}`;

    // Build email HTML
    const assessmentListHtml = filteredSections.map(section => {
      const sectionQuestions = questionsByAssessment[section.code] || [];
      const sectionGroups = [...new Set(sectionQuestions.map(q => q.section))];
      
      return `
        <div style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #4f46e5;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">${section.title}</h3>
          <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">${section.description}</p>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <span style="font-size: 13px; color: #475569;">
              <strong>${sectionQuestions.length}</strong> questions
            </span>
            <span style="font-size: 13px; color: #475569;">
              <strong>${sectionGroups.length}</strong> sections
            </span>
          </div>
        </div>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 24px; color: #1e293b;">Assessment Review Request</h1>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 15px;">
              from ${practice?.name || 'Your Practice'}
            </p>
          </div>

          <!-- Main Card -->
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.6;">
              Hi${recipientName ? ` ${recipientName.split(' ')[0]}` : ''},
            </p>
            
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.6;">
              ${senderName} would like you to review the following client assessments before they go live:
            </p>

            ${customMessage ? `
              <div style="margin: 20px 0; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic;">
                  "${customMessage}"
                </p>
              </div>
            ` : ''}

            <!-- Assessment List -->
            <div style="margin: 24px 0;">
              ${assessmentListHtml}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Review Assessments
              </a>
            </div>

            <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
              Please reply to this email with any feedback or suggested changes.
            </p>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">
              Sent from <strong>${practice?.name || 'Torsor Platform'}</strong>
            </p>
            <p style="margin: 4px 0 0 0;">
              ${senderEmail ? `Reply to: ${senderEmail}` : ''}
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    console.log('Attempting to send email to:', recipientEmail);
    console.log('Practice:', practice?.name);
    console.log('RESEND_API_KEY present:', !!RESEND_API_KEY);
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please add RESEND_API_KEY to Edge Function secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Resend's default domain if custom domain not verified
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    
    const emailPayload = {
      from: fromEmail,
      to: recipientEmail,
      reply_to: senderEmail || undefined,
      subject: `Assessment Review Request from ${senderName}`,
      html: emailHtml,
    };
    
    console.log('Email payload:', JSON.stringify({ ...emailPayload, html: '[HTML content]' }));

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await emailResponse.text();
    console.log('Resend response status:', emailResponse.status);
    console.log('Resend response:', responseText);

    if (!emailResponse.ok) {
      console.error('Resend API error:', responseText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let emailResult;
    try {
      emailResult = JSON.parse(responseText);
    } catch {
      emailResult = { id: 'unknown' };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Review request sent to ${recipientEmail}`,
        emailId: emailResult.id,
        assessmentsIncluded: filteredSections.map(s => s.title)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending review request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

