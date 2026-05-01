import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { resolveBiPeriodIdFromMaPeriodId } from '../lib/bi/resolveBiPeriod';

export interface RatioMetricRow {
  code: string;
  name: string;
  category: string;
  unit: string;
  decimal_places: number;
  default_visual: string;
  value: number | null;
  target_value: number | null;
  rag_status: string | null;
  history: { period_end: string; value: number }[];
}

export interface VarianceMetricRow {
  code: string;
  name: string;
  category: string;
  default_visual: string;
  base_value: number | null;
  comparator_value: number | null;
  percent_delta: number | null;
  absolute_delta: number | null;
  direction: string | null;
  rag_status: string | null;
}

export function useBICatalogMetrics(maEngagementId: string | undefined, maPeriodId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [ratios, setRatios] = useState<RatioMetricRow[]>([]);
  const [variances, setVariances] = useState<VarianceMetricRow[]>([]);
  const [biEngagementId, setBiEngagementId] = useState<string | null>(null);
  const [biPeriodId, setBiPeriodId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!maEngagementId || !maPeriodId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: ma } = await supabase.from('ma_engagements').select('client_id').eq('id', maEngagementId).maybeSingle();
      if (!ma?.client_id) {
        setRatios([]);
        setVariances([]);
        setLoading(false);
        return;
      }

      const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', ma.client_id).maybeSingle();
      const biEid = bi?.id ?? null;
      setBiEngagementId(biEid);

      const bpId = await resolveBiPeriodIdFromMaPeriodId(maPeriodId);
      setBiPeriodId(bpId);

      if (!biEid || !bpId) {
        setRatios([]);
        setVariances([]);
        setLoading(false);
        return;
      }

      const { data: selR } = await supabase.from('bi_ratio_selections').select('ratio_code').eq('engagement_id', biEid);
      const rCodes = (selR ?? []).map((r: { ratio_code: string }) => r.ratio_code);
      if (rCodes.length === 0) {
        setRatios([]);
      } else {
        const { data: defs } = await supabase.from('bi_ratio_definitions').select('*').in('code', rCodes);
        const { data: vals } = await supabase.from('bi_ratio_values').select('*').eq('period_id', bpId).in('ratio_code', rCodes);

        const { data: periods } = await supabase
          .from('bi_periods')
          .select('id, period_end')
          .eq('engagement_id', biEid)
          .order('period_end', { ascending: true })
          .limit(24);

        const histByCode = new Map<string, { period_end: string; value: number }[]>();
        for (const p of periods ?? []) {
          const { data: rv } = await supabase.from('bi_ratio_values').select('ratio_code, value').eq('period_id', p.id).in('ratio_code', rCodes);
          for (const row of rv ?? []) {
            const list = histByCode.get(row.ratio_code) ?? [];
            list.push({ period_end: p.period_end as string, value: Number(row.value) });
            histByCode.set(row.ratio_code, list);
          }
        }

        const valMap = new Map((vals ?? []).map((v: { ratio_code: string }) => [v.ratio_code, v]));
        const rows: RatioMetricRow[] = (defs ?? []).map((d: Record<string, unknown>) => {
          const v = valMap.get(d.code as string) as { value?: number; target_value?: number; rag_status?: string } | undefined;
          return {
            code: d.code as string,
            name: d.name as string,
            category: d.category as string,
            unit: (d.unit as string) || 'ratio',
            decimal_places: (d.decimal_places as number) ?? 2,
            default_visual: (d.default_visual as string) || 'gauge',
            value: v?.value ?? null,
            target_value: v?.target_value ?? null,
            rag_status: v?.rag_status ?? null,
            history: histByCode.get(d.code as string) ?? [],
          };
        });
        setRatios(rows);
      }

      const { data: selV } = await supabase.from('bi_variance_selections').select('variance_code').eq('engagement_id', biEid);
      const vCodes = (selV ?? []).map((r: { variance_code: string }) => r.variance_code);
      if (vCodes.length === 0) {
        setVariances([]);
      } else {
        const { data: vdefs } = await supabase.from('bi_variance_definitions').select('*').in('code', vCodes);
        const { data: vvals } = await supabase.from('bi_variance_values').select('*').eq('period_id', bpId).in('variance_code', vCodes);
        const vm = new Map((vvals ?? []).map((v: { variance_code: string }) => [v.variance_code, v]));
        setVariances(
          (vdefs ?? []).map((d: Record<string, unknown>) => {
            const v = vm.get(d.code as string) as Record<string, unknown> | undefined;
            return {
              code: d.code as string,
              name: d.name as string,
              category: d.category as string,
              default_visual: (d.default_visual as string) || 'bar_delta',
              base_value: v?.base_value != null ? Number(v.base_value) : null,
              comparator_value: v?.comparator_value != null ? Number(v.comparator_value) : null,
              percent_delta: v?.percent_delta != null ? Number(v.percent_delta) : null,
              absolute_delta: v?.absolute_delta != null ? Number(v.absolute_delta) : null,
              direction: (v?.direction as string) ?? null,
              rag_status: (v?.rag_status as string) ?? null,
            };
          }),
        );
      }
    } catch (e) {
      console.error('[useBICatalogMetrics]', e);
      setRatios([]);
      setVariances([]);
    } finally {
      setLoading(false);
    }
  }, [maEngagementId, maPeriodId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { loading, ratios, variances, biEngagementId, biPeriodId, refetch: fetchAll };
}
