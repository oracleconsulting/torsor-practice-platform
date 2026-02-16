// ============================================================================
// EDGE FUNCTION: notify-sprint-lifecycle
// ============================================================================
// Sends client emails at key sprint moments: sprint_published, life_check_pending,
// sprint_summary_ready. Uses Resend (same as notify-roadmap-ready).
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailContext {
  clientName: string;
  portalUrl: string;
  sprintNumber: number;
  sprintTheme?: string;
  clientEmail: string;
  practiceName: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function wrapEmail(opts: {
  headerText: string;
  headerGradient: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  ctaColor: string;
  practiceName: string;
  recipientEmail: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background:${opts.headerGradient};padding:40px 30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">${opts.headerText}</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          ${opts.bodyHtml}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;border:2px solid ${opts.ctaColor};border-radius:8px;">
                <tr><td align="center" style="background-color:#f3f4f6;border-radius:8px;padding:15px 40px;">
                  <a href="${opts.ctaUrl}" style="color:${opts.ctaColor};text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,sans-serif;display:inline-block;">${opts.ctaText}</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:20px 0 0 0;">Best regards,<br><strong>James</strong>, ${opts.practiceName}</p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">This email was sent to ${opts.recipientEmail}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildSprintPublishedEmail(ctx: EmailContext): EmailContent {
  const body = [
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hi ${ctx.clientName},</p>`,
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Your Sprint ${ctx.sprintNumber} plan is ready and waiting for you.</p>`,
    ctx.sprintTheme
      ? `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">This sprint focuses on: <em>${ctx.sprintTheme}</em></p>`
      : '',
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Log in to see your tasks for the next 12 weeks.</p>`,
  ].filter(Boolean).join('');

  return {
    subject: `Your Sprint ${ctx.sprintNumber} is ready — let's go`,
    html: wrapEmail({
      headerText: `Your Sprint ${ctx.sprintNumber} is Ready`,
      headerGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      bodyHtml: body,
      ctaText: 'View Your Sprint',
      ctaUrl: `${ctx.portalUrl}/tasks`,
      ctaColor: '#6366f1',
      practiceName: ctx.practiceName,
      recipientEmail: ctx.clientEmail,
    }),
    text: `Hi ${ctx.clientName},\n\nYour Sprint ${ctx.sprintNumber} plan is ready and waiting for you.\n${ctx.sprintTheme ? `This sprint focuses on: ${ctx.sprintTheme}\n\n` : ''}Log in to see your tasks: ${ctx.portalUrl}/tasks\n\nBest regards,\nJames, ${ctx.practiceName}`,
  };
}

function buildLifeCheckEmail(ctx: EmailContext): EmailContent {
  const body = [
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hi ${ctx.clientName},</p>`,
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">You've completed Sprint ${ctx.sprintNumber} — well done.</p>`,
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Before we build your next sprint, we'd love to hear how things are going. There are 6 quick questions that help us tailor your next 12 weeks to where you are now.</p>`,
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">It takes about 5 minutes.</p>`,
  ].join('');

  return {
    subject: 'Quick check-in before your next sprint',
    html: wrapEmail({
      headerText: 'Quick Check-In Before Your Next Sprint',
      headerGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      bodyHtml: body,
      ctaText: 'Complete Your Check-In',
      ctaUrl: `${ctx.portalUrl}/tasks`,
      ctaColor: '#0d9488',
      practiceName: ctx.practiceName,
      recipientEmail: ctx.clientEmail,
    }),
    text: `Hi ${ctx.clientName},\n\nYou've completed Sprint ${ctx.sprintNumber} — well done.\n\nBefore we build your next sprint, we'd love to hear how things are going. There are 6 quick questions that help us tailor your next 12 weeks. It takes about 5 minutes.\n\nComplete your check-in: ${ctx.portalUrl}/tasks\n\nBest regards,\nJames, ${ctx.practiceName}`,
  };
}

function buildSummaryReadyEmail(ctx: EmailContext): EmailContent {
  const body = [
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Hi ${ctx.clientName},</p>`,
    `<p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Your Sprint ${ctx.sprintNumber} summary is ready. We've pulled together everything you achieved, what shifted, and what to focus on next.</p>`,
  ].join('');

  return {
    subject: `Your Sprint ${ctx.sprintNumber} results are in`,
    html: wrapEmail({
      headerText: `Your Sprint ${ctx.sprintNumber} Results Are In`,
      headerGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      bodyHtml: body,
      ctaText: 'See Your Summary',
      ctaUrl: `${ctx.portalUrl}/tasks`,
      ctaColor: '#059669',
      practiceName: ctx.practiceName,
      recipientEmail: ctx.clientEmail,
    }),
    text: `Hi ${ctx.clientName},\n\nYour Sprint ${ctx.sprintNumber} summary is ready. We've pulled together everything you achieved, what shifted, and what to focus on next.\n\nSee your summary: ${ctx.portalUrl}/tasks\n\nBest regards,\nJames, ${ctx.practiceName}`,
  };
}

function buildEmail(type: string, ctx: EmailContext): EmailContent {
  switch (type) {
    case 'sprint_published':
      return buildSprintPublishedEmail(ctx);
    case 'life_check_pending':
      return buildLifeCheckEmail(ctx);
    case 'sprint_summary_ready':
      return buildSummaryReadyEmail(ctx);
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { clientId, type, sprintNumber, sprintTheme } = await req.json();

    if (!clientId || !type) {
      return new Response(
        JSON.stringify({ success: false, error: 'clientId and type required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('practice_members')
      .select('email, name, practice_id, practices:practice_id (name)')
      .eq('id', clientId)
      .eq('member_type', 'client')
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ success: false, error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientEmail = client.email;
    const clientName = (client.name || 'there').split(' ')[0];
    const practiceName = (client.practices as any)?.name || 'your practice';
    const portalUrl = Deno.env.get('CLIENT_PORTAL_URL') || 'https://client.torsor.co.uk';

    const email = buildEmail(type, {
      clientName,
      portalUrl,
      sprintNumber: sprintNumber ?? 1,
      sprintTheme,
      clientEmail,
      practiceName,
    });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL') || 'James <noreply@torsor.co.uk>',
      to: clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (emailError) {
      console.error('Email send failed:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${type} email sent to ${clientEmail}:`, emailData?.id);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('notify-sprint-lifecycle error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
