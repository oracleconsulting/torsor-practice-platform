// ============================================================================
// EDGE FUNCTION: bulk-import-clients
// ============================================================================
// Bulk import clients with:
// - Auth user creation
// - Practice member records
// - Auto-enrollment in Discovery
// - Welcome email with credentials
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientToImport {
  name: string;
  email: string;
  company?: string;
  password: string;
}

interface ImportRequest {
  practiceId: string;
  clients: ClientToImport[];
  sendEmails: boolean;
  portalUrl?: string;
  invitedByName?: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
  memberId?: string;
  emailSent?: boolean;
}

// Generate a secure random password if not provided
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Send welcome email with credentials
async function sendWelcomeEmail(
  to: string, 
  name: string, 
  password: string, 
  portalUrl: string,
  invitedByName: string
): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Oracle Advisory <noreply@torsor.co.uk>',
        to: [to],
        subject: `Welcome to Your Client Portal - Let's Begin Your Discovery`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; background-color: #f4f4f7;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          Welcome to Your Client Portal
        </h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 32px;">
        <p style="font-size: 16px; margin-bottom: 24px;">
          Hi ${name.split(' ')[0]},
        </p>
        
        <p style="font-size: 16px; margin-bottom: 24px;">
          ${invitedByName} has set up your client portal account. This is where we'll work together to understand your business goals and create a tailored roadmap for success.
        </p>

        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
            Your Login Credentials
          </h3>
          <p style="margin: 8px 0; font-size: 15px;">
            <strong>Portal:</strong> <a href="${portalUrl}" style="color: #4f46e5;">${portalUrl}</a>
          </p>
          <p style="margin: 8px 0; font-size: 15px;">
            <strong>Email:</strong> ${to}
          </p>
          <p style="margin: 8px 0; font-size: 15px;">
            <strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${password}</code>
          </p>
          <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b;">
            We recommend changing your password after your first login.
          </p>
        </div>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #92400e;">
            🎯 Your First Step: Destination Discovery
          </h3>
          <p style="margin: 0; font-size: 14px; color: #78350f;">
            When you log in, you'll be guided through a short questionnaire (~15 minutes) to help us understand your goals, challenges, and vision for the future. This shapes everything we do together.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Access Your Portal
          </a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
          If you have any questions, just reply to this email or contact your advisor directly.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          © ${new Date().getFullYear()} Oracle Advisory. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: ImportResult[] = [];
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ImportRequest = await req.json();
    const { 
      practiceId, 
      clients, 
      sendEmails = true,
      portalUrl = 'https://torsor.co.uk/client',
      invitedByName = 'Your Advisor'
    } = body;

    if (!practiceId || !clients || !Array.isArray(clients)) {
      return new Response(
        JSON.stringify({ error: 'practiceId and clients array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Bulk Import] Starting import of ${clients.length} clients for practice ${practiceId}`);

    // Get the discovery service line ID for enrollment
    const { data: discoveryService } = await supabase
      .from('service_lines')
      .select('id')
      .eq('code', 'discovery')
      .maybeSingle();

    for (const client of clients) {
      const email = client.email.toLowerCase().trim();
      const name = client.name.trim();
      const company = client.company?.trim() || null;
      const password = client.password || generatePassword();

      try {
        console.log(`[Bulk Import] Processing: ${email}`);

        // Check if user already exists
        const { data: existingMember } = await supabase
          .from('practice_members')
          .select('id, email')
          .eq('email', email)
          .eq('practice_id', practiceId)
          .maybeSingle();

        if (existingMember) {
          results.push({
            email,
            success: false,
            error: 'Client already exists in this practice'
          });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm so they can log in immediately
          user_metadata: { name, company }
        });

        if (authError) {
          // Handle case where auth user exists but not in this practice
          if (authError.message?.includes('already been registered')) {
            results.push({
              email,
              success: false,
              error: 'Email already registered in auth system'
            });
          } else {
            results.push({
              email,
              success: false,
              error: authError.message
            });
          }
          continue;
        }

        if (!authData.user) {
          results.push({
            email,
            success: false,
            error: 'Failed to create auth user'
          });
          continue;
        }

        // Create practice member
        const { data: member, error: memberError } = await supabase
          .from('practice_members')
          .insert({
            practice_id: practiceId,
            user_id: authData.user.id,
            name,
            email,
            role: 'Client',
            member_type: 'client',
            program_status: 'discovery', // Ready for discovery assessment
            client_company: company,
          })
          .select()
          .single();

        if (memberError) {
          // Rollback: delete auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.push({
            email,
            success: false,
            error: `Failed to create practice member: ${memberError.message}`
          });
          continue;
        }

        // Enroll in Discovery service line
        if (discoveryService && member) {
          await supabase
            .from('client_service_lines')
            .insert({
              client_id: member.id,
              service_line_id: discoveryService.id,
              status: 'pending_discovery'
            });
        }

        // Create a destination_discovery record so they appear in the Discovery list
        if (member) {
          await supabase
            .from('destination_discovery')
            .upsert({
              client_id: member.id,
              practice_id: practiceId,
              current_stage: 1,
              // No completed_at - they haven't completed it yet
            }, { onConflict: 'client_id' });
        }

        // Send welcome email
        let emailSent = false;
        if (sendEmails) {
          emailSent = await sendWelcomeEmail(email, name, password, portalUrl, invitedByName);
        }

        results.push({
          email,
          success: true,
          memberId: member.id,
          emailSent
        });

        console.log(`[Bulk Import] ✅ Created: ${email} (email ${emailSent ? 'sent' : 'not sent'})`);

      } catch (clientError: any) {
        console.error(`[Bulk Import] Error processing ${email}:`, clientError);
        results.push({
          email,
          success: false,
          error: clientError.message || 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Bulk Import] Complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Imported ${successCount} of ${clients.length} clients`,
        results,
        summary: {
          total: clients.length,
          succeeded: successCount,
          failed: failCount,
          emailsSent: results.filter(r => r.emailSent).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Bulk Import] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Import failed',
        results 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

