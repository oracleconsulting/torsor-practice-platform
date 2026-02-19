// ============================================================================
// EDGE FUNCTION: batch-remind-clients
// ============================================================================
// Send reminder emails to invited/registered clients (with rate limit)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  batchId?: string;
  entryIds?: string[];
  maxReminders?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: RequestBody = (await req.json().catch(() => ({}))) || {};
    const { batchId, entryIds, maxReminders = 3 } = body;

    let q = supabase
      .from('enrollment_entries')
      .select('id, client_name, client_email, status, reminder_count, last_reminder_at')
      .in('status', ['invited', 'registered', 'assessment_started'])
      .lt('reminder_count', maxReminders);

    if (batchId) q = q.eq('batch_id', batchId);
    if (entryIds?.length) q = q.in('id', entryIds);

    const { data: entries, error } = await q;
    if (error) throw error;

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const toRemind = (entries || []).filter(
      (e) => !e.last_reminder_at || new Date(e.last_reminder_at) < threeDaysAgo
    );

    const baseUrl = Deno.env.get('CLIENT_PORTAL_URL') || 'https://client.torsor.co.uk';
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    let reminded = 0;
    for (const e of toRemind) {
      if (!e.client_email) continue;
      try {
        if (resendKey) {
          const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(e.client_email)}`;
          const html = `<div style="font-family: Arial, sans-serif; max-width: 600px;"><div style="background: #f59e0b; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">Friendly reminder</h1></div><div style="padding: 24px;"><p>Hi ${e.client_name || 'there'},</p><p>Your assessment and client portal are waiting. Log in to continue:</p><p><a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Access portal</a></p></div></div>`;
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: fromEmail.includes('@') ? `Torsor <${fromEmail}>` : fromEmail,
              to: e.client_email,
              subject: 'Reminder: your client portal is waiting',
              html,
            }),
          });
        }
        await supabase
          .from('enrollment_entries')
          .update({
            last_reminder_at: now.toISOString(),
            reminder_count: (e.reminder_count || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq('id', e.id);
        reminded++;
      } catch (err) {
        console.warn('Remind failed for', e.client_email, err);
      }
    }

    return new Response(
      JSON.stringify({ reminded, skipped: (entries?.length || 0) - reminded }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('batch-remind-clients error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
