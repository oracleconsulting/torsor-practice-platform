'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MADashboard } from '@torsor/platform/components/business-intelligence/dashboard';
import { PeriodSummaryEditor } from '@torsor/platform/components/business-intelligence/PeriodSummaryEditor';
import { PDFExportButton } from '@torsor/platform/components/business-intelligence/PDFExportButton';
import {
  resolveBiPeriodIdFromMaPeriodId,
  resolveMaPeriodIdFromBiPeriodId,
} from '@torsor/platform/lib/bi/resolveBiPeriod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function ClientBIPeriodReportPage() {
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const { clientSession, clientSessionLoading } = useAuth();
  const clientId = clientSession?.clientId;

  const [maPeriodId, setMaPeriodId] = useState<string | null>(null);
  const [maEngagementId, setMaEngagementId] = useState<string | null>(null);
  const [biPeriodId, setBiPeriodId] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [tier, setTier] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodId || !clientId) return;
    (async () => {
      setLoading(true);
      setAccessDenied(false);
      const { data: myMa } = await supabase.from('ma_engagements').select('id').eq('client_id', clientId).eq('status', 'active').maybeSingle();

      const { data: mp } = await supabase.from('ma_periods').select('id, engagement_id, period_label').eq('id', periodId).maybeSingle();
      if (mp) {
        if (!myMa?.id || mp.engagement_id !== myMa.id) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setMaPeriodId(mp.id);
        setMaEngagementId(mp.engagement_id);
        setPeriodLabel(mp.period_label || '');
        const biPid = await resolveBiPeriodIdFromMaPeriodId(mp.id);
        setBiPeriodId(biPid);
        const { data: ma } = await supabase.from('ma_engagements').select('tier').eq('id', mp.engagement_id).single();
        setTier(ma?.tier ?? null);
      } else {
        const { data: bp } = await supabase.from('bi_periods').select('id, engagement_id, period_label').eq('id', periodId).maybeSingle();
        if (!bp) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        const { data: bi } = await supabase.from('bi_engagements').select('client_id').eq('id', bp.engagement_id).maybeSingle();
        if (!bi?.client_id || bi.client_id !== clientId) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setBiPeriodId(bp.id);
        setPeriodLabel(bp.period_label || '');
        const mpid = await resolveMaPeriodIdFromBiPeriodId(bp.id);
        setMaPeriodId(mpid);
        if (mpid) {
          const { data: mp2 } = await supabase.from('ma_periods').select('engagement_id').eq('id', mpid).single();
          setMaEngagementId(mp2?.engagement_id ?? null);
          if (mp2?.engagement_id) {
            const { data: ma } = await supabase.from('ma_engagements').select('tier').eq('id', mp2.engagement_id).single();
            setTier(ma?.tier ?? null);
          }
        }
      }
      setLoading(false);
    })();
  }, [periodId, clientId]);

  if (clientSessionLoading || !clientSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (accessDenied || !maEngagementId || !maPeriodId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{accessDenied ? 'You do not have access to this report.' : 'Report not found.'}</p>
        <button type="button" className="text-indigo-600" onClick={() => navigate('/service/business_intelligence/reports')}>
          Back to reports
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/service/business_intelligence/reports')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{periodLabel || 'Period report'}</h1>
              <p className="text-sm text-slate-500">Tier {tier}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PDFExportButton periodId={maPeriodId} periodLabel={periodLabel || ''} engagementId={maEngagementId} />
            <Logo />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 print:py-4">
        <Link to="/service/business_intelligence/reports" className="text-sm text-indigo-600 hover:underline print:hidden">
          ← All reports
        </Link>

        <div className="rounded-xl border border-slate-200 overflow-hidden print:border-0">
          <MADashboard engagementId={maEngagementId} periodId={maPeriodId} isAdmin={false} />
        </div>

        <PeriodSummaryEditor biPeriodId={biPeriodId} practiceTier={tier} readOnly />

        <button type="button" className="print:hidden text-sm text-slate-600 underline" onClick={() => window.print()}>
          Print / Save as PDF (browser)
        </button>
      </div>
    </div>
  );
}
