// ============================================================================
// SYSTEMS AUDIT VIEW FOR ADMIN PORTAL
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Database,
  Workflow,
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SystemsAuditViewProps {
  clientId: string;
}

interface SAEngagement {
  id: string;
  status: string;
  stage_1_completed_at: string | null;
  stage_2_completed_at: string | null;
  stage_3_completed_at: string | null;
}

interface SAReport {
  id: string;
  headline: string;
  executive_summary: string;
  total_hours_wasted_weekly: number;
  total_annual_cost_of_chaos: number;
  integration_score: number;
  automation_score: number;
  data_accessibility_score: number;
  scalability_score: number;
  critical_findings_count: number;
  high_findings_count: number;
  status: string;
  generated_at: string;
}

export default function SystemsAuditView({ clientId }: SystemsAuditViewProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [engagement, setEngagement] = useState<SAEngagement | null>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [systems, setSystems] = useState<any[]>([]);
  const [deepDives, setDeepDives] = useState<any[]>([]);
  const [report, setReport] = useState<SAReport | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch engagement
      const { data: engagementData } = await supabase
        .from('sa_engagements')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (!engagementData) {
        setLoading(false);
        return;
      }

      setEngagement(engagementData);

      // Fetch all related data
      const [discoveryRes, systemsRes, deepDivesRes, reportRes] = await Promise.all([
        supabase
          .from('sa_discovery_responses')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle(),
        supabase
          .from('sa_system_inventory')
          .select('*')
          .eq('engagement_id', engagementData.id),
        supabase
          .from('sa_process_deep_dives')
          .select('*')
          .eq('engagement_id', engagementData.id),
        supabase
          .from('sa_audit_reports')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      setDiscovery(discoveryRes.data);
      setSystems(systemsRes.data || []);
      setDeepDives(deepDivesRes.data || []);
      setReport(reportRes.data);
    } catch (err) {
      console.error('Error loading Systems Audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!engagement) return;

    const confirmed = confirm(
      'This will generate a comprehensive Systems Audit report using AI. This may take 1-2 minutes. Continue?'
    );
    if (!confirmed) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sa-report', {
        body: { engagementId: engagement.id }
      });

      if (error) throw error;

      // Reload data to get the new report
      await loadData();
      alert('Report generated successfully!');
    } catch (err: any) {
      console.error('Error generating report:', err);
      alert(`Error generating report: ${err.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No Systems Audit engagement found</p>
        <p className="text-sm text-slate-400 mt-1">Client needs to start the Systems Audit assessment</p>
      </div>
    );
  }

  const stage1Complete = !!engagement.stage_1_completed_at;
  const stage2Complete = !!engagement.stage_2_completed_at;
  const stage3Complete = !!engagement.stage_3_completed_at;
  const allStagesComplete = stage1Complete && stage2Complete && stage3Complete;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Systems Audit</h2>
          <p className="text-slate-600 mt-1">Complete assessment of operational systems and processes</p>
        </div>
        {allStagesComplete && (
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? 'Generating...' : report ? 'Regenerate Report' : 'Generate Report'}
          </button>
        )}
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-3 gap-4">
        <StageCard
          stage={1}
          title="Discovery Assessment"
          icon={FileText}
          completed={stage1Complete}
          completedAt={engagement.stage_1_completed_at}
          expanded={expandedStage === 'stage1'}
          onToggle={() => setExpandedStage(expandedStage === 'stage1' ? null : 'stage1')}
          data={discovery}
        />
        <StageCard
          stage={2}
          title="System Inventory"
          icon={Database}
          completed={stage2Complete}
          completedAt={engagement.stage_2_completed_at}
          expanded={expandedStage === 'stage2'}
          onToggle={() => setExpandedStage(expandedStage === 'stage2' ? null : 'stage2')}
          data={systems}
          count={systems.length}
        />
        <StageCard
          stage={3}
          title="Process Deep Dives"
          icon={Workflow}
          completed={stage3Complete}
          completedAt={engagement.stage_3_completed_at}
          expanded={expandedStage === 'stage3'}
          onToggle={() => setExpandedStage(expandedStage === 'stage3' ? null : 'stage3')}
          data={deepDives}
          count={deepDives.length}
        />
      </div>

      {/* Report Display */}
      {report && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Audit Report</h3>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              report.status === 'generated' ? 'bg-emerald-100 text-emerald-700' :
              report.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {report.status === 'generated' ? 'Generated' : report.status}
            </span>
          </div>

          <div className="space-y-6">
            {/* Headline */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <h4 className="text-xl font-semibold mb-2">{report.headline}</h4>
              <p className="text-indigo-100">{report.executive_summary}</p>
            </div>

            {/* Cost of Chaos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-600">Hours Wasted Weekly</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{report.total_hours_wasted_weekly}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-600">Annual Cost of Chaos</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  £{report.total_annual_cost_of_chaos.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-600">Systems Count</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{systems.length}</p>
              </div>
            </div>

            {/* Scores */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">System Health Scores</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard label="Integration" score={report.integration_score} />
                <ScoreCard label="Automation" score={report.automation_score} />
                <ScoreCard label="Data Access" score={report.data_accessibility_score} />
                <ScoreCard label="Scalability" score={report.scalability_score} />
              </div>
            </div>

            {/* Findings Summary */}
            {(report.critical_findings_count > 0 || report.high_findings_count > 0) && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Key Findings</h4>
                <div className="flex gap-4">
                  {report.critical_findings_count > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {report.critical_findings_count} Critical
                      </span>
                    </div>
                  )}
                  {report.high_findings_count > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {report.high_findings_count} High Priority
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-slate-500">
              Generated: {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {allStagesComplete && !report && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-amber-900 font-medium">All stages complete</p>
          <p className="text-sm text-amber-700 mt-1">Click "Generate Report" to create the audit report</p>
        </div>
      )}
    </div>
  );
}

function StageCard({
  stage,
  title,
  icon: Icon,
  completed,
  completedAt,
  expanded,
  onToggle,
  data,
  count
}: {
  stage: number;
  title: string;
  icon: any;
  completed: boolean;
  completedAt: string | null;
  expanded: boolean;
  onToggle: () => void;
  data: any;
  count?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {completed ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">{title}</p>
              <p className="text-sm text-slate-500">
                {completed ? 'Completed' : 'Not Started'}
                {count !== undefined && ` • ${count} items`}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 max-h-96 overflow-y-auto">
          {completed && data ? (
            <div className="space-y-2 text-sm">
              {Array.isArray(data) ? (
                data.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3">
                    <p className="font-medium text-slate-900">
                      {item.system_name || item.chain_code || `Item ${idx + 1}`}
                    </p>
                    {item.category_code && (
                      <p className="text-xs text-slate-500 mt-1">Category: {item.category_code}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-slate-500 mb-2">Responses:</p>
                  {Object.entries(data).slice(0, 10).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <p className="text-xs text-slate-500">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-900">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center">No data available</p>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-sm text-slate-600 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${getColor(score)}`}>{score}</p>
      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full ${
            score >= 80 ? 'bg-emerald-600' : score >= 60 ? 'bg-amber-600' : 'bg-red-600'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

