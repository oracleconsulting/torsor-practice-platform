/**
 * Server-side tier caps for bi_ratio_selections / bi_variance_selections.
 * POST { action, engagementId, code?, userId? }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function maTierToLevel(tier: string): 'clarity' | 'foresight' | 'strategic' {
  const t = tier?.toLowerCase();
  if (t === 'bronze') return 'clarity';
  if (t === 'silver' || t === 'gold') return 'foresight';
  return 'strategic';
}

function capsFor(level: 'clarity' | 'foresight' | 'strategic') {
  if (level === 'clarity') return { ratios: 5, variances: 3 };
  if (level === 'foresight') return { ratios: 12, variances: 8 };
  return { ratios: 999, variances: 999 };
}

async function resolveBiEngagementId(supabase: ReturnType<typeof createClient>, engagementId: string): Promise<string> {
  const { data: bi } = await supabase.from('bi_engagements').select('id').eq('id', engagementId).maybeSingle();
  if (bi?.id) return bi.id as string;
  const { data: ma } = await supabase.from('ma_engagements').select('client_id').eq('id', engagementId).maybeSingle();
  if (!ma?.client_id) throw new Error('Engagement not found');
  const { data: bi2 } = await supabase.from('bi_engagements').select('id').eq('client_id', ma.client_id).maybeSingle();
  if (!bi2?.id) throw new Error('bi_engagements row missing for client; create BI engagement first');
  return bi2.id as string;
}

async function tierLevel(supabase: ReturnType<typeof createClient>, biEngagementId: string): Promise<'clarity' | 'foresight' | 'strategic'> {
  const { data: bi } = await supabase.from('bi_engagements').select('tier, client_id').eq('id', biEngagementId).single();
  const t = (bi?.tier as string)?.toLowerCase();
  if (t === 'clarity' || t === 'foresight' || t === 'strategic') return t;
  const { data: ma } = await supabase
    .from('ma_engagements')
    .select('tier')
    .eq('client_id', bi.client_id as string)
    .eq('status', 'active')
    .maybeSingle();
  return maTierToLevel(ma?.tier || 'silver');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { action, engagementId, code, userId } = body as {
      action: string;
      engagementId: string;
      code?: string;
      userId?: string;
    };
    if (!engagementId || !action) throw new Error('engagementId and action required');

    const biEid = await resolveBiEngagementId(supabase, engagementId);
    const level = await tierLevel(supabase, biEid);
    const caps = capsFor(level);

    if (action === 'add_ratio') {
      if (!code) throw new Error('code required');
      const { data: exists } = await supabase
        .from('bi_ratio_selections')
        .select('id')
        .eq('engagement_id', biEid)
        .eq('ratio_code', code)
        .maybeSingle();
      if (exists?.id) {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { count } = await supabase
        .from('bi_ratio_selections')
        .select('*', { count: 'exact', head: true })
        .eq('engagement_id', biEid);
      if ((count ?? 0) >= caps.ratios) {
        throw new Error(`Tier ${level} allows at most ${caps.ratios} ratios`);
      }
      const { error } = await supabase.from('bi_ratio_selections').insert({
        engagement_id: biEid,
        ratio_code: code,
        selected_by: userId ?? null,
        selected_at: new Date().toISOString(),
        display_order: (count ?? 0) + 1,
      });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove_ratio') {
      if (!code) throw new Error('code required');
      await supabase.from('bi_ratio_selections').delete().eq('engagement_id', biEid).eq('ratio_code', code);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'add_variance') {
      if (!code) throw new Error('code required');
      const { data: vex } = await supabase
        .from('bi_variance_selections')
        .select('id')
        .eq('engagement_id', biEid)
        .eq('variance_code', code)
        .maybeSingle();
      if (vex?.id) {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { count } = await supabase
        .from('bi_variance_selections')
        .select('*', { count: 'exact', head: true })
        .eq('engagement_id', biEid);
      if ((count ?? 0) >= caps.variances) {
        throw new Error(`Tier ${level} allows at most ${caps.variances} variances`);
      }
      const { error } = await supabase.from('bi_variance_selections').insert({
        engagement_id: biEid,
        variance_code: code,
        selected_by: userId ?? null,
        selected_at: new Date().toISOString(),
        display_order: (count ?? 0) + 1,
      });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove_variance') {
      if (!code) throw new Error('code required');
      await supabase.from('bi_variance_selections').delete().eq('engagement_id', biEid).eq('variance_code', code);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unknown action');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
