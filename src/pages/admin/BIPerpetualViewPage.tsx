'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { PerpetualMetricRow, type PerpetualPoint } from '../../components/business-intelligence/perpetual/PerpetualMetricRow';
import { catalogCaps, tierFromEngagement } from '../../lib/bi/tierCaps';
import { Loader2 } from 'lucide-react';

interface DriftAlertRow {
  id: string;
  metric_kind: string;
  metric_code: string;
  drift_pct?: number | null;
  severity?: string | null;
}

export default function BIPerpetualViewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const [rows, setRows] = useState<{ code: string; kind: string; title: string; series: PerpetualPoint[] }[]>([]);
  const [drift, setDrift] = useState<DriftAlertRow[]>([]);
  const caps = useMemo(() => catalogCaps(tierFromEngagement(tier)), [tier]);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      setLoading(true);
      const { data: ma } = await supabase.from('ma_engagements').select('id, tier').eq('client_id', clientId).eq('status', 'active').maybeSingle();
      const t = ma?.tier ?? null;
      setTier(t);
      const caps = catalogCaps(tierFromEngagement(t));
      const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', clientId).maybeSingle();
      if (!bi?.id || !caps.perpetual) {
        setRows([]);
        setDrift([]);
        setLoading(false);
        return;
      }

      const { data: viewRows, error } = await supabase.from('bi_perpetual_metrics_view').select('*').eq('engagement_id', bi.id);
      if (error) {
        console.warn('[BIPerpetualViewPage] view unavailable', error.message);
        setRows([]);
      } else {
        const byKey = new Map<string, PerpetualPoint[]>();
        for (const r of viewRows ?? []) {
          const key = `${r.metric_kind}:${r.metric_code}`;
          const list = byKey.get(key) ?? [];
          list.push({
            period_end: r.period_end as string,
            period_id: r.period_id as string,
            value: Number(r.value),
            rag_status: r.rag_status as string,
          });
          byKey.set(key, list);
        }
        const built: { code: string; kind: string; title: string; series: PerpetualPoint[] }[] = [];
        for (const [key, series] of byKey) {
          series.sort((a, b) => a.period_end.localeCompare(b.period_end));
          const [kind, code] = key.split(':');
          built.push({ code, kind, title: `${kind.toUpperCase()} · ${code}`, series });
        }
        setRows(built);
      }

      if (caps.driftAlerts) {
        const { data: d } = await supabase.from('bi_perpetual_drift_alerts').select('*').eq('engagement_id', bi.id).order('detected_at', { ascending: false }).limit(20);
        setDrift(d ?? []);
      } else {
        setDrift([]);
      }
      setLoading(false);
    })();
  }, [clientId]);

  return (
    <AdminLayout title="Perpetual BI tracker">
      <div className="p-6 space-y-6">
        <Link to={`/clients/${clientId}/bi/reports`} className="text-sm text-indigo-600 hover:underline">
          ← Reports list
        </Link>
        {!caps.perpetual && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4">
            Perpetual view is available from Foresight tier upward.
          </div>
        )}
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        ) : (
          <>
            {caps.driftAlerts && drift.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-semibold text-red-900 mb-2">Drift highlights</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  {drift.map((d) => (
                    <li key={d.id}>
                      {d.metric_kind} {d.metric_code}: {d.drift_pct?.toFixed?.(1)}% vs baseline ({d.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rows.map((r) => (
                <PerpetualMetricRow key={`${r.kind}-${r.code}`} title={r.title} subtitle={r.kind} series={r.series} clientId={clientId!} />
              ))}
            </div>
            {rows.length === 0 && caps.perpetual && <p className="text-slate-500">No perpetual metrics in view yet.</p>}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
