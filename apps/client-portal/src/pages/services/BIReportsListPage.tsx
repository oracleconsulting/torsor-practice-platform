'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, Infinity as InfinityIcon, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

const REPORTS_BASE = '/service/business_intelligence/reports';

interface MAPeriodRow {
  id: string;
  period_start: string;
  period_end: string;
  period_label?: string | null;
  status?: string | null;
}

export default function BIReportsListPage() {
  const navigate = useNavigate();
  const { clientSession, clientSessionLoading } = useAuth();
  const clientId = clientSession?.clientId;
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<MAPeriodRow[]>([]);
  const [summaryByBiPeriodId, setSummaryByBiPeriodId] = useState<Map<string, string>>(new Map());
  const [biPeriodKeyToId, setBiPeriodKeyToId] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!clientId || clientSessionLoading) return;
    (async () => {
      setLoading(true);
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
  }, [clientId, clientSessionLoading]);

  if (clientSessionLoading || !clientSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/service/business_intelligence/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Period reports</h1>
          </div>
          <Logo />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/service/business_intelligence/perpetual"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
        >
          <InfinityIcon className="w-4 h-4" />
          Perpetual tracker
        </Link>

        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        ) : periods.length === 0 ? (
          <p className="text-slate-500">No reports yet.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm">
            {periods.map((p) => {
              const biPid = biPeriodKeyToId.get(`${p.period_start}|${p.period_end}`);
              const summaryStatus = biPid ? summaryByBiPeriodId.get(biPid) : undefined;
              const approvedSummary = summaryStatus === 'approved' || summaryStatus === 'published';
              return (
                <Link key={p.id} to={`${REPORTS_BASE}/${p.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">{p.period_label || p.period_end}</p>
                      <p className="text-xs text-slate-500">
                        {approvedSummary ? (
                          <span className="text-emerald-700">Summary available</span>
                        ) : summaryStatus ? (
                          <span className="text-slate-400">Summary in preparation</span>
                        ) : (
                          <span className="text-slate-400">Open report</span>
                        )}
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
    </div>
  );
}
