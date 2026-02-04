import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Building2,
  Users,
  Loader2,
  Lock
} from 'lucide-react';
import { Logo } from '@/components/Logo';

// ============================================================================
// BENCHMARKING REPORT PAGE - CLIENT PORTAL VIEW
// ============================================================================
// Shows the benchmarking analysis report to clients when shared by advisor
// ============================================================================

interface BenchmarkReport {
  engagement_id: string;
  headline?: string;
  executive_summary?: string;
  position_narrative?: string;
  strength_narrative?: string;
  gap_narrative?: string;
  opportunity_narrative?: string;
  overall_percentile?: number;
  total_annual_opportunity?: number;
  strength_count?: number;
  gap_count?: number;
  top_strengths?: any[];
  top_gaps?: any[];
  metrics_comparison?: any;
  recommendations?: any[];
  pass1_data?: any;
  is_shared_with_client?: boolean;
  shared_at?: string;
  industry_code?: string;
  revenue_band?: string;
  employee_band?: string;
}

export default function BenchmarkingReportPage() {
  const navigate = useNavigate();
  const { clientSession, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [clientCompany, setClientCompany] = useState<string>('');

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
      // First get the client's company name
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
        .select('id')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();
      
      if (engagementError || !engagement) {
        setError('No benchmarking engagement found');
        setLoading(false);
        return;
      }

      // Get the report - RLS will ensure only shared reports are returned
      const { data: reportData, error: reportError } = await supabase
        .from('bm_reports')
        .select('*')
        .eq('engagement_id', engagement.id)
        .eq('is_shared_with_client', true)
        .maybeSingle();

      if (reportError) {
        console.error('Error fetching benchmarking report:', reportError);
        setError('Unable to load report');
        setLoading(false);
        return;
      }

      if (!reportData) {
        setError('Report not yet available. Your advisor will share it with you when ready.');
        setLoading(false);
        return;
      }

      setReport(reportData);
    } catch (err) {
      console.error('Error loading benchmarking report:', err);
      setError('An error occurred while loading your report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '£0';
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-emerald-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-amber-600';
    return 'text-red-600';
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
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
            <p className="text-slate-600 mb-6">{error}</p>
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

  if (!report) {
    return null;
  }

  // Parse pass1_data if it's a string
  const pass1Data = typeof report.pass1_data === 'string' 
    ? JSON.parse(report.pass1_data) 
    : report.pass1_data || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
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

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Benchmarking Analysis</h1>
          </div>
          <p className="text-teal-100 mb-4">{clientCompany}</p>
          {report.headline && (
            <p className="text-xl font-medium">{report.headline}</p>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Industry Percentile</p>
            <p className={`text-2xl font-bold ${getPercentileColor(report.overall_percentile || 0)}`}>
              {getOrdinalSuffix(report.overall_percentile || 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Improvement Opportunity</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(report.total_annual_opportunity)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Strengths</p>
            <p className="text-2xl font-bold text-blue-600">{report.strength_count || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Gaps to Address</p>
            <p className="text-2xl font-bold text-amber-600">{report.gap_count || 0}</p>
          </div>
        </div>

        {/* Executive Summary */}
        {report.executive_summary && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              Executive Summary
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {report.executive_summary}
              </p>
            </div>
          </div>
        )}

        {/* Position Narrative */}
        {report.position_narrative && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Your Position
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {report.position_narrative}
              </p>
            </div>
          </div>
        )}

        {/* Strengths */}
        {report.strength_narrative && (
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 mb-8">
            <h2 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Your Strengths
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-emerald-900/80 leading-relaxed whitespace-pre-wrap">
                {report.strength_narrative}
              </p>
            </div>
            {report.top_strengths && report.top_strengths.length > 0 && (
              <div className="mt-4 space-y-2">
                {report.top_strengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{typeof strength === 'string' ? strength : strength.metric || strength.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gaps */}
        {report.gap_narrative && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-8">
            <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Areas for Improvement
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                {report.gap_narrative}
              </p>
            </div>
            {report.top_gaps && report.top_gaps.length > 0 && (
              <div className="mt-4 space-y-2">
                {report.top_gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-amber-800">
                    <span className="text-amber-500 mt-1">!</span>
                    <span>{typeof gap === 'string' ? gap : gap.metric || gap.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opportunity */}
        {report.opportunity_narrative && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              The Opportunity
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-blue-900/80 leading-relaxed whitespace-pre-wrap">
                {report.opportunity_narrative}
              </p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Recommended Next Steps
            </h2>
            <div className="space-y-4">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      {typeof rec === 'string' ? rec : rec.title || rec.recommendation}
                    </p>
                    {typeof rec === 'object' && rec.description && (
                      <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>This report was prepared by your business advisor to help identify improvement opportunities.</p>
          <p className="mt-2">Questions? Reach out to discuss next steps.</p>
        </div>
      </div>
    </div>
  );
}
