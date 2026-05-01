import { supabase } from '../supabase';

/** Resolve bi_periods.id from a ma_periods row (matching engagement client + dates). */
export async function resolveBiPeriodIdFromMaPeriodId(maPeriodId: string): Promise<string | null> {
  const { data: mp, error: mpErr } = await supabase
    .from('ma_periods')
    .select('engagement_id, period_start, period_end')
    .eq('id', maPeriodId)
    .maybeSingle();
  if (mpErr || !mp) return null;

  const { data: ma } = await supabase.from('ma_engagements').select('client_id').eq('id', mp.engagement_id).maybeSingle();
  if (!ma?.client_id) return null;

  const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', ma.client_id).maybeSingle();
  if (!bi?.id) return null;

  const { data: bp } = await supabase
    .from('bi_periods')
    .select('id')
    .eq('engagement_id', bi.id)
    .eq('period_start', mp.period_start)
    .eq('period_end', mp.period_end)
    .maybeSingle();

  return bp?.id ?? null;
}

export async function resolveMaPeriodIdFromBiPeriodId(biPeriodId: string): Promise<string | null> {
  const { data: bp } = await supabase
    .from('bi_periods')
    .select('engagement_id, period_start, period_end')
    .eq('id', biPeriodId)
    .maybeSingle();
  if (!bp) return null;

  const { data: bi } = await supabase.from('bi_engagements').select('client_id').eq('id', bp.engagement_id).maybeSingle();
  if (!bi?.client_id) return null;

  const { data: ma } = await supabase.from('ma_engagements').select('id').eq('client_id', bi.client_id).eq('status', 'active').maybeSingle();
  if (!ma?.id) return null;

  const { data: mp } = await supabase
    .from('ma_periods')
    .select('id')
    .eq('engagement_id', ma.id)
    .eq('period_start', bp.period_start)
    .eq('period_end', bp.period_end)
    .maybeSingle();

  return mp?.id ?? null;
}
