import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
// Import the FULL client report component from the main platform
import { BenchmarkingClientReport } from '@torsor/platform/components/benchmarking/client/BenchmarkingClientReport';

// ============================================================================
// BENCHMARKING REPORT PAGE - CLIENT PORTAL VIEW
// ============================================================================
// Uses the same full BenchmarkingClientReport component as the admin "Client View"
// ============================================================================

export default function BenchmarkingReportPage() {
  const navigate = useNavigate();
  const { clientSession, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [clientCompany, setClientCompany] = useState<string>('');
  const [practitionerInfo, setPractitionerInfo] = useState<{name?: string; email?: string}>({});

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
      console.log('[BM Report] Loading report for client:', clientSession.clientId);

      // Get the client's company name
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', clientSession.clientId)
        .maybeSingle();
      
      if (clientData) {
        setClientCompany(clientData.client_company || clientData.company || clientData.name || 'Your Company');
      }

      // Get the engagement for this client
      const { data: engagement, error: engagementError } = await supabase
        .from('bm_engagements')
        .select('id, report_shared_with_client')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();
      
      console.log('[BM Report] Engagement:', engagement, 'Error:', engagementError);

      if (engagementError || !engagement) {
        setError('No benchmarking engagement found');
        setLoading(false);
        return;
      }

      // Check if report is shared (from engagement, avoiding RLS circular issues)
      if (!engagement.report_shared_with_client) {
        setError('Report not yet available. Your advisor will share it with you when ready.');
        setLoading(false);
        return;
      }

      // Get the full report data - RLS should now allow access since is_shared_with_client is true
      const { data: report, error: reportError } = await supabase
        .from('bm_reports')
        .select('*')
        .eq('engagement_id', engagement.id)
        .maybeSingle();

      console.log('[BM Report] Report data:', report ? 'Found' : 'Not found', 'Error:', reportError);

      if (reportError) {
        console.error('Error fetching benchmarking report:', reportError);
        setError('Unable to load report');
        setLoading(false);
        return;
      }

      if (!report) {
        setError('Report not yet available. Your advisor will share it with you when ready.');
        setLoading(false);
        return;
      }

      // Parse pass1_data if it's a string
      const parsedReport = {
        ...report,
        pass1_data: typeof report.pass1_data === 'string' 
          ? JSON.parse(report.pass1_data) 
          : report.pass1_data,
      };

      console.log('[BM Report] Setting report data with keys:', Object.keys(parsedReport));
      setReportData(parsedReport);

      // Try to get practitioner info for context
      const { data: practice } = await supabase
        .from('practices')
        .select('name, support_email')
        .eq('id', clientSession.practiceId)
        .maybeSingle();

      if (practice) {
        setPractitionerInfo({
          name: practice.name,
          email: practice.support_email
        });
      }

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
        {/* Header */}
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
        
        {/* Error State */}
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Full Report Component - Same as Admin Client View */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <BenchmarkingClientReport 
          data={reportData}
          clientName={clientCompany}
          practitionerName={practitionerInfo.name}
          practitionerEmail={practitionerInfo.email}
        />
      </div>
    </div>
  );
}
