// ============================================================================
// EDGE FUNCTION: notify-roadmap-ready
// ============================================================================
// Sends email notification to client when their roadmap is ready
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  roadmapId: string;
  clientId: string;
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { roadmapId, clientId }: NotifyRequest = await req.json();

    console.log('📧 Sending roadmap ready notification:', { roadmapId, clientId });

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('practice_members')
      .select('email, name, practice_id, practices:practice_id (name)')
      .eq('id', clientId)
      .eq('member_type', 'client')
      .single();

    if (clientError || !client) {
      console.error('Error fetching client:', clientError);
      return new Response(
        JSON.stringify({ success: false, error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientEmail = client.email;
    const clientName = client.name || 'there';
    const practiceName = (client.practices as any)?.name || 'your practice';
    const clientPortalUrl = Deno.env.get('CLIENT_PORTAL_URL') || 'https://client.torsor.co.uk';

    // Fetch roadmap details
    const { data: roadmap, error: roadmapError } = await supabase
      .from('client_roadmaps')
      .select('id, created_at')
      .eq('id', roadmapId)
      .eq('client_id', clientId)
      .single();

    if (roadmapError || !roadmap) {
      console.error('Error fetching roadmap:', roadmapError);
      return new Response(
        JSON.stringify({ success: false, error: 'Roadmap not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roadmapUrl = `${clientPortalUrl}/roadmap`;

    // Send email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Roadmap is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Your Roadmap is Ready! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${clientName},
              </p>
              
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! Your personalised transformation roadmap has been reviewed and is now ready for you to view.
              </p>
              
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                This comprehensive plan is based on everything you've shared in your assessments and includes your 5-year vision, 6-month shift plan, and 12-week sprint with actionable tasks.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; border: 2px solid #6366f1; border-radius: 8px;">
                      <tr>
                        <td align="center" style="background-color: #f3f4f6; border-radius: 8px; padding: 15px 40px;">
                          <a href="${roadmapUrl}"
                             style="color: #6366f1; text-decoration: none;
                                    font-weight: bold; font-size: 16px; font-family: Arial, sans-serif;
                                    display: inline-block;">
                            View Your Roadmap
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you have any questions or would like to discuss your roadmap, please don't hesitate to reach out.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong>James</strong><br>
                ${practiceName}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This email was sent to ${clientEmail}. If you have any questions, please contact your practice.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailText = `
Hi ${clientName},

Great news! Your personalised transformation roadmap has been reviewed and is now ready for you to view.

This comprehensive plan is based on everything you've shared in your assessments and includes your 5-year vision, 6-month shift plan, and 12-week sprint with actionable tasks.

View your roadmap: ${roadmapUrl}

If you have any questions or would like to discuss your roadmap, please don't hesitate to reach out.

Best regards,
James
${practiceName}
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL') || 'James <noreply@torsor.co.uk>',
      to: clientEmail,
      subject: 'Your Transformation Roadmap is Ready! 🎉',
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to send email: ${emailError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Roadmap ready email sent:', emailData?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailData?.id,
        message: 'Email sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-roadmap-ready:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
