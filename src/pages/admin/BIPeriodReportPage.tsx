'use client';

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { MADashboard } from '../../components/business-intelligence/dashboard';
import { PeriodSummaryEditor } from '../../components/business-intelligence/PeriodSummaryEditor';
import { PDFExportButton } from '../../components/business-intelligence/PDFExportButton';
import { resolveBiPeriodIdFromMaPeriodId, resolveMaPeriodIdFromBiPeriodId } from '../../lib/bi/resolveBiPeriod';
import { Loader2 } from 'lucide-react';

export default function BIPeriodReportPage() {
  const { clientId, periodId } = useParams<{ clientId: string; periodId: string }>();
  const [maPeriodId, setMaPeriodId] = useState<string | null>(null);
  const [maEngagementId, setMaEngagementId] = useState<string | null>(null);
  const [biPeriodId, setBiPeriodId] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [tier, setTier] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodId) return;
    (async () => {
      setLoading(true);
      const { data: mp } = await supabase.from('ma_periods').select('id, engagement_id, period_label').eq('id', periodId).maybeSingle();
      if (mp) {
        setMaPeriodId(mp.id);
        setMaEngagementId(mp.engagement_id);
        setPeriodLabel(mp.period_label || '');
        const biPid = await resolveBiPeriodIdFromMaPeriodId(mp.id);
        setBiPeriodId(biPid);
        const { data: ma } = await supabase.from('ma_engagements').select('tier, client_id').eq('id', mp.engagement_id).single();
        setTier(ma?.tier ?? null);
        if (ma?.client_id) {
          const { data: mem } = await supabase.from('practice_members').select('name').eq('id', ma.client_id).maybeSingle();
          setClientName(mem?.name || '');
        }
      } else {
        const { data: bp } = await supabase.from('bi_periods').select('id, engagement_id, period_label').eq('id', periodId).maybeSingle();
        if (bp) {
          setBiPeriodId(bp.id);
          setPeriodLabel(bp.period_label || '');
          const mpid = await resolveMaPeriodIdFromBiPeriodId(bp.id);
          setMaPeriodId(mpid);
          if (mpid) {
            const { data: mp2 } = await supabase.from('ma_periods').select('engagement_id').eq('id', mpid).single();
            setMaEngagementId(mp2?.engagement_id ?? null);
            const { data: ma } = await supabase.from('ma_engagements').select('tier, client_id').eq('id', mp2!.engagement_id).single();
            setTier(ma?.tier ?? null);
            if (ma?.client_id) {
              const { data: mem } = await supabase.from('practice_members').select('name').eq('id', ma.client_id).maybeSingle();
              setClientName(mem?.name || '');
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [periodId]);

  if (loading) {
    return (
      <AdminLayout title="BI report">
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!maEngagementId || !maPeriodId) {
    return (
      <AdminLayout title="BI report">
        <div className="p-6">
          <p className="text-red-600">Could not resolve MA period. Upload documents or run Sumary import first.</p>
          <Link to={`/clients`} className="text-indigo-600">
            Back to clients
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Report — ${periodLabel || maPeriodId}`}>
      <div className="p-6 space-y-6 print:p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <Link to={`/clients/${clientId}/bi/reports`} className="text-sm text-indigo-600 hover:underline">
              ← All reports
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">{periodLabel || 'Period report'}</h1>
            <p className="text-sm text-slate-500">
              {clientName} · Tier {tier}
            </p>
          </div>
          <PDFExportButton periodId={maPeriodId} periodLabel={periodLabel || ''} clientName={clientName} engagementId={maEngagementId} />
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden print:border-0">
          <MADashboard engagementId={maEngagementId} periodId={maPeriodId} isAdmin />
        </div>

        <PeriodSummaryEditor biPeriodId={biPeriodId} practiceTier={tier} />

        <button type="button" className="print:hidden text-sm text-slate-600 underline" onClick={() => window.print()}>
          Print / Save as PDF (browser)
        </button>
      </div>
    </AdminLayout>
  );
}
