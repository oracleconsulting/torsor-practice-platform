'use client';

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Loader2, FileText, Infinity as InfinityIcon } from 'lucide-react';

interface MAPeriodRow {
  id: string;
  period_start: string;
  period_end: string;
  period_label?: string | null;
  status?: string | null;
}

export default function BIReportsListPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<MAPeriodRow[]>([]);
  const [summaryByBiPeriodId, setSummaryByBiPeriodId] = useState<Map<string, string>>(new Map());
  const [biPeriodKeyToId, setBiPeriodKeyToId] = useState<Map<string, string>>(new Map());
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      setLoading(true);
      const { data: member } = await supabase.from('practice_members').select('name').eq('id', clientId).maybeSingle();
      setClientName(member?.name || '');
      const { data: ma } = await supabase.from('ma_engagements').select('id').eq('client_id', clientId).eq('status', 'active').maybeSingle();
      if (!ma?.id) {
        setPeriods([]);
        setLoading(false);
        return;
      }
      const { data: p } = await supabase.from('ma_periods').select('*').eq('engagement_id', ma.id).order('period_end', { ascending: false });
      setPeriods(p ?? []);

      const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', clientId).maybeSingle();
      if (bi?.id) {
        const [{ data: sums }, { data: biPeriods }] = await Promise.all([
          supabase.from('bi_period_summaries').select('period_id, status').eq('engagement_id', bi.id),
          supabase.from('bi_periods').select('id, period_start, period_end').eq('engagement_id', bi.id),
        ]);
        const sm = new Map<string, string>();
        for (const s of sums ?? []) sm.set(s.period_id as string, s.status as string);
        setSummaryByBiPeriodId(sm);
        const keyMap = new Map<string, string>();
        for (const bp of biPeriods ?? []) keyMap.set(`${bp.period_start}|${bp.period_end}`, bp.id as string);
        setBiPeriodKeyToId(keyMap);
      } else {
        setSummaryByBiPeriodId(new Map());
        setBiPeriodKeyToId(new Map());
      }
      setLoading(false);
    })();
  }, [clientId]);

  return (
    <AdminLayout title={`BI reports — ${clientName || clientId}`}>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/clients/${clientId}/bi/perpetual`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
          >
            <InfinityIcon className="w-4 h-4" />
            Perpetual tracker
          </Link>
        </div>
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        ) : periods.length === 0 ? (
          <p className="text-slate-500">No periods yet. Use Sumary import or document upload.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {periods.map((p) => {
              const biPid = biPeriodKeyToId.get(`${p.period_start}|${p.period_end}`);
              const summaryStatus = biPid ? summaryByBiPeriodId.get(biPid) : undefined;
              return (
                <Link
                  key={p.id}
                  to={`/clients/${clientId}/bi/reports/${p.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">{p.period_label || p.period_end}</p>
                      <p className="text-xs text-slate-500">
                        Period: {p.status}
                        {summaryStatus ? (
                          <span className="ml-2 text-violet-700">· Summary: {summaryStatus}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <span className="text-indigo-600 text-sm">Open →</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
