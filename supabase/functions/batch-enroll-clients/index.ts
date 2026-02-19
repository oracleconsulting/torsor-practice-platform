// ============================================================================
// EDGE FUNCTION: batch-enroll-clients
// ============================================================================
// Batch onboarding: link or invite clients, create client_service_lines, send emails
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EntryInput {
  name: string;
  email: string;
  company?: string;
  industry?: string;
  stage?: string;
  advisorId?: string;
  tier?: string;
  notes?: string;
}

interface RequestBody {
  batchId: string;
  entries: EntryInput[];
  services: string[];
  defaultTier?: string;
  defaultAdvisorId?: string;
  sprintStartDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: RequestBody = await req.json();
    const { batchId, entries, services, defaultTier, defaultAdvisorId, sprintStartDate } = body;

    if (!batchId || !entries?.length || !services?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'batchId, entries, and services are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (entries.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum 50 clients per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: batch, error: batchErr } = await supabase
      .from('enrollment_batches')
      .select('id, practice_id, default_tier')
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const practiceId = batch.practice_id;
    const tier = defaultTier || batch.default_tier;
    const advisorId = defaultAdvisorId || null;

    const { data: serviceLines } = await supabase
      .from('service_lines')
      .select('id, code, name')
      .in('code', services);
    const serviceLineMap = new Map((serviceLines || []).map((s) => [s.code, s]));
    const serviceLineNames = (serviceLines || []).map((s) => s.name);

    const { data: practice } = await supabase.from('practices').select('name').eq('id', practiceId).single();
    const { data: inviter } = await advisorId
      ? await supabase.from('practice_members').select('name').eq('id', advisorId).single()
      : { data: null };
    const baseUrl = Deno.env.get('CLIENT_PORTAL_URL') || 'https://client.torsor.co.uk';
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    const failures: { email: string; reason: string }[] = [];
    let succeeded = 0;

    for (const entry of entries) {
      const email = entry.email?.toLowerCase()?.trim();
      const name = (entry.name || '').trim();
      if (!email || !name) {
        failures.push({ email: email || '', reason: 'Name and email required' });
        continue;
      }

      try {
        const { data: existingClient } = await supabase
          .from('practice_members')
          .select('id, name')
          .eq('email', email)
          .eq('practice_id', practiceId)
          .eq('member_type', 'client')
          .maybeSingle();

        let memberId: string | null = null;
        if (existingClient) {
          memberId = existingClient.id;
          for (const code of services) {
            const sl = serviceLineMap.get(code);
            if (!sl) continue;
            const { data: existingEnrol } = await supabase
              .from('client_service_lines')
              .select('id')
              .eq('client_id', memberId)
              .eq('service_line_id', sl.id)
              .maybeSingle();
            if (existingEnrol) continue;
            await supabase.from('client_service_lines').upsert({
              client_id: memberId,
              practice_id: practiceId,
              service_line_id: sl.id,
              status: 'invited',
              tier_name: code === '365_method' ? (entry.tier || tier) : undefined,
              advisor_notes: entry.notes || undefined,
              invited_at: new Date().toISOString(),
              invited_by: advisorId,
            }, { onConflict: 'client_id,service_line_id' });
          }
          if (resendKey) {
            const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;
            const html = `<div style="font-family: Arial, sans-serif; max-width: 600px;"><div style="background: #6366f1; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">You're Enrolled</h1></div><div style="padding: 24px;"><p>Hi ${existingClient.name || name},</p><p>You've been enrolled in ${serviceLineNames.join(', ')} by ${practice?.name || 'the practice'}.</p><p><a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Access your portal</a></p></div></div>`;
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: fromEmail.includes('@') ? `Torsor <${fromEmail}>` : fromEmail, to: email, subject: `Enrolled in ${serviceLineNames.join(' & ')}`, html }),
            });
          }
        } else {
          const token = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          const slIds = (serviceLines || []).map((s) => s.id);
          await supabase.from('client_invitations').insert({
            practice_id: practiceId,
            invited_by: advisorId,
            email,
            name: name || '',
            company: entry.company || '',
            service_line_ids: slIds,
            invitation_token: token,
            expires_at: expiresAt.toISOString(),
            status: 'pending',
            include_discovery: false,
          });
          const invitationUrl = `${baseUrl}/invitation/${token}`;
          if (resendKey) {
            const html = `<div style="font-family: Arial, sans-serif; max-width: 600px;"><div style="background: #6366f1; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">You're Invited</h1></div><div style="padding: 24px;"><p>Hi ${name || 'there'},</p><p>${inviter?.name || 'Your advisor'} at <strong>${practice?.name || 'the practice'}</strong> has enrolled you in: ${serviceLineNames.join(', ')}.</p><p><a href="${invitationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Accept invitation</a></p></div></div>`;
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: fromEmail.includes('@') ? `Torsor <${fromEmail}>` : fromEmail, to: email, subject: `You're enrolled in ${serviceLineNames.join(' & ')}`, html }),
            });
          }
        }

        const { data: entryRow } = await supabase
          .from('enrollment_entries')
          .select('id')
          .eq('batch_id', batchId)
          .eq('client_email', email)
          .maybeSingle();

        if (entryRow) {
          await supabase
            .from('enrollment_entries')
            .update({
              status: 'invited',
              invited_at: new Date().toISOString(),
              practice_member_id: memberId,
              assigned_advisor_id: advisorId,
              tier_name: entry.tier || tier,
              advisor_notes: entry.notes || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entryRow.id);
        }

        succeeded++;
      } catch (e) {
        failures.push({ email, reason: (e as Error).message });
      }
    }

    await supabase.from('enrollment_batches').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', batchId);

    return new Response(
      JSON.stringify({
        success: true,
        total: entries.length,
        succeeded,
        failed: failures.length,
        failures,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('batch-enroll-clients error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
