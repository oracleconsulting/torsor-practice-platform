import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import BenchmarkingClientDashboard from '@torsor/platform/components/benchmarking/client/BenchmarkingClientDashboard';
import { fetchBenchmarkReportPayload } from '@/lib/benchmark-report-data';

// ============================================================================
// BENCHMARKING REPORT — CLIENT PORTAL (dashboard, matches admin Client View)
// ============================================================================

export default function BenchmarkingReportPage() {
  const navigate = useNavigate();
  const { clientSession, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [clientCompany, setClientCompany] = useState<string>('');
  const [practitionerInfo, setPractitionerInfo] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    if (!authLoading && clientSession?.clientId) {
      loadReport();
    }
  }, [authLoading, clientSession?.clientId]);

  const loadReport = async () => {
    if (!clientSession?.clientId) {
      setError('No client session found');
      setLoading(false);
      return;
    }

    try {
      const result = await fetchBenchmarkReportPayload(supabase, {
        clientId: clientSession.clientId,
        practiceId: clientSession.practiceId,
      });

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setReportData(result.report);
      setClientCompany(result.clientCompany);
      setPractitionerInfo(result.practitionerInfo);
    } catch (err) {
      console.error('Error loading benchmarking report:', err);
      setError('An error occurred while loading your report');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your benchmarking report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <Logo />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Report Not Available</h2>
            <p className="text-slate-600 mb-6">{error || 'Report not yet available.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0F2F7' }}>
      {/* Slim chrome — dashboard is full visual system */}
      <div className="bg-white/90 border-b border-slate-200/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <Logo />
        </div>
      </div>

      <div className="min-h-[calc(100vh-52px)] rounded-b-2xl overflow-hidden">
        <BenchmarkingClientDashboard
          data={{ ...reportData, created_at: reportData.created_at } as any}
          clientName={clientCompany}
          practitionerName={practitionerInfo.name}
          practitionerEmail={practitionerInfo.email}
          onBack={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
