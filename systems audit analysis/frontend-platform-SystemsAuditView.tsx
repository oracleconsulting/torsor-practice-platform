// ============================================================================
// SYSTEMS AUDIT VIEW FOR ADMIN PORTAL
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { systemsAuditDiscoveryConfig } from '@/config/assessments/systems-audit-discovery';
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
  Upload,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Eye
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
  preliminary_analysis?: any;
  preliminary_analysis_at?: string | null;
  review_status?: string;
}

interface SAGap {
  id: string;
  engagement_id: string;
  gap_area: string;
  gap_tag: string | null;
  description: string;
  source_question: string | null;
  status: string;
  source?: string;
  severity?: string;
  resolution?: string | null;
  additional_context?: string | null;
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
  const [runningPreliminary, setRunningPreliminary] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessments' | 'documents' | 'review' | 'analysis'>('assessments');
  const [engagement, setEngagement] = useState<SAEngagement | null>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [systems, setSystems] = useState<any[]>([]);
  const [deepDives, setDeepDives] = useState<any[]>([]);
  const [gaps, setGaps] = useState<SAGap[]>([]);
  const [report, setReport] = useState<SAReport | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resolvingGapId, setResolvingGapId] = useState<string | null>(null);

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
      const [discoveryRes, systemsRes, deepDivesRes, reportRes, gapsRes] = await Promise.all([
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
          .maybeSingle(),
        supabase
          .from('sa_engagement_gaps')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at', { ascending: true })
      ]);

      setDiscovery(discoveryRes.data);
      setSystems(systemsRes.data || []);
      setDeepDives(deepDivesRes.data || []);
      setReport(reportRes.data);
      setGaps(gapsRes.data || []);
    } catch (err) {
      console.error('Error loading Systems Audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPreliminary = async () => {
    if (!engagement?.id) return;
    const confirmed = window.confirm(
      'Run AI preliminary analysis? This reads all assessment responses and identifies gaps and insights (~30 seconds).'
    );
    if (!confirmed) return;

    setRunningPreliminary(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sa-preliminary', {
        body: { engagementId: engagement.id },
      });
      if (error) throw error;
      await loadData();
      setActiveTab('review');
      alert(`Preliminary analysis complete! ${data?.stats?.suggestedGaps ?? 0} gaps identified.`);
    } catch (err: any) {
      console.error('Preliminary analysis failed:', err);
      alert(`Analysis failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setRunningPreliminary(false);
    }
  };

  const handleDismissGap = async (gapId: string) => {
    const { error } = await supabase
      .from('sa_engagement_gaps')
      .update({ status: 'not_applicable', updated_at: new Date().toISOString() })
      .eq('id', gapId);
    if (error) {
      alert(`Failed to dismiss: ${error.message}`);
      return;
    }
    setGaps((prev) => prev.map((g) => (g.id === gapId ? { ...g, status: 'not_applicable' } : g)));
  };

  const handleResolveGap = async (gapId: string, additionalContext: string) => {
    setResolvingGapId(gapId);
    const { error } = await supabase
      .from('sa_engagement_gaps')
      .update({
        status: 'resolved',
        additional_context: additionalContext || null,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', gapId);
    setResolvingGapId(null);
    if (error) {
      alert(`Failed to resolve: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleMarkReviewComplete = async () => {
    if (!engagement?.id) return;
    const { error } = await supabase
      .from('sa_engagements')
      .update({
        review_status: 'complete',
        review_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', engagement.id);
    if (error) {
      alert(`Failed to mark complete: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleGenerateReport = async () => {
    if (!engagement) return;

    const confirmed = confirm(
      'This will generate a comprehensive Systems Audit report using AI. This may take 1-2 minutes. Continue?'
    );
    if (!confirmed) return;

    setGenerating(true);
    try {
      const { data: resolvedGaps } = await supabase
        .from('sa_engagement_gaps')
        .select('*')
        .eq('engagement_id', engagement.id)
        .eq('status', 'resolved');

      const additionalContext = (resolvedGaps || [])
        .filter((g: any) => g.additional_context)
        .map((g: any) => ({
          area: g.gap_area,
          tag: g.gap_tag,
          context: g.additional_context,
        }));

      const { data, error } = await supabase.functions.invoke('generate-sa-report', {
        body: {
          engagementId: engagement.id,
          additionalContext: additionalContext.length > 0 ? additionalContext : undefined,
          preliminaryAnalysis: engagement.preliminary_analysis || undefined,
        },
      });

      if (error) throw error;

      await loadData();
      setActiveTab('analysis');
      alert('Report generated successfully!');
    } catch (err: any) {
      console.error('Error generating report:', err);
      alert(`Error generating report: ${err.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!engagement) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${engagement.id}/${Date.now()}.${fileExt}`;
      const filePath = `systems-audit/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create context entry
      const { error: contextError } = await supabase
        .from('client_context')
        .insert({
          client_id: clientId,
          context_type: 'note',
          content: `Document uploaded: ${file.name}`,
          source_file_url: filePath,
          priority_level: 'normal',
          processed: false
        });

      if (contextError) throw contextError;

      alert('Document uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(`Error uploading file: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
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
        {allStagesComplete && !report && (
          <div className="flex flex-col items-end gap-2">
            {!engagement.preliminary_analysis ? (
              <>
                <button
                  onClick={handleRunPreliminary}
                  disabled={runningPreliminary}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                >
                  {runningPreliminary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Preliminary Analysis...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Run Preliminary Analysis
                    </>
                  )}
                </button>
                <p className="text-sm text-slate-500 text-right max-w-xs">
                  AI will review all responses and identify gaps before report generation (~30 seconds)
                </p>
              </>
            ) : (
              <>
                {engagement.review_status === 'complete' ? (
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
                    {generating ? 'Generating...' : 'Generate Full Report'}
                  </button>
                ) : (
                  <div className="text-right">
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed"
                    >
                      Generate Full Report
                    </button>
                    <p className="text-sm text-amber-600 mt-1">
                      Complete the Review tab before generating — resolve or dismiss identified gaps
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRunPreliminary}
                  disabled={runningPreliminary}
                  className="text-sm text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                >
                  {runningPreliminary ? 'Re-running...' : 'Re-run preliminary analysis'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${
          stage1Complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stage1Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {stage1Complete ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <p className="font-medium text-slate-900">Stage 1: Discovery</p>
              <p className="text-sm text-slate-500">
                {stage1Complete ? 'Completed' : 'Not Started'}
              </p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-2 ${
          stage2Complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stage2Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {stage2Complete ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <p className="font-medium text-slate-900">Stage 2: System Inventory</p>
              <p className="text-sm text-slate-500">
                {stage2Complete ? `Completed • ${systems.length} systems` : 'Not Started'}
              </p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-2 ${
          stage3Complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stage3Complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {stage3Complete ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <div>
              <p className="font-medium text-slate-900">Stage 3: Process Deep Dives</p>
              <p className="text-sm text-slate-500">
                {stage3Complete ? `Completed • ${deepDives.length} chains` : 'Not Started'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'assessments', label: 'Assessments', icon: FileText },
            { id: 'documents', label: 'Documents / Context', icon: Upload },
            { id: 'review', label: 'Review', icon: Eye },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Stage 1: Discovery Assessment</h3>
              
              {systemsAuditDiscoveryConfig.sections.map((section) => (
                <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900">{section.title}</h4>
                      <p className="text-sm text-slate-500">{section.description}</p>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedSection === section.id && (
                    <div className="p-4 space-y-4">
                      {section.questions.map((question) => {
                        const response = discovery?.[question.field];
                        return (
                          <div key={question.id} className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <label className="text-sm font-medium text-slate-900">
                                {question.label}
                                {question.aiAnchor && (
                                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                    Key Insight
                                  </span>
                                )}
                              </label>
                            </div>
                            {response ? (
                              <div className="mt-2">
                                {Array.isArray(response) ? (
                                  <p className="text-sm text-slate-700">{response.join(', ')}</p>
                                ) : (
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{String(response)}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No response yet</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents / Context</h3>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">Upload documents, spreadsheets, or other context</p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Review Tab — Preliminary analysis + gaps */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              {!engagement?.preliminary_analysis ? (
                <div className="text-center py-12 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <Eye className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <p className="text-indigo-900 font-medium mb-2">No preliminary analysis yet</p>
                  <p className="text-sm text-indigo-700 mb-4">
                    Run &quot;Run Preliminary Analysis&quot; from the header to review data quality and suggested gaps before generating the full report.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunPreliminary}
                    disabled={runningPreliminary}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {runningPreliminary ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {runningPreliminary ? 'Running...' : 'Run Preliminary Analysis'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Business Snapshot */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-2">Business Snapshot</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Profile:</span>{' '}
                        {engagement.preliminary_analysis.businessSnapshot?.companyProfile ?? engagement.preliminary_analysis.businessSnapshot?.companyType ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue model:</span>{' '}
                        {engagement.preliminary_analysis.businessSnapshot?.revenueModel ?? engagement.preliminary_analysis.businessSnapshot?.revenue_model ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">Growth stage:</span>{' '}
                        {engagement.preliminary_analysis.businessSnapshot?.growthStage ?? engagement.preliminary_analysis.businessSnapshot?.growth_stage ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">Core pain:</span>{' '}
                        {engagement.preliminary_analysis.businessSnapshot?.headlinePain ?? engagement.preliminary_analysis.businessSnapshot?.headline_pain ?? '—'}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Scores */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Data Confidence by Area</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(engagement.preliminary_analysis.confidenceScores || []).map((score: any, i: number) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 text-sm border ${
                            score.confidence === 'high'
                              ? 'bg-green-50 border-green-200'
                              : score.confidence === 'medium'
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{score.area}</span>
                            <span className={`text-xs font-bold uppercase ${
                              score.confidence === 'high' ? 'text-green-700'
                              : score.confidence === 'medium' ? 'text-amber-700'
                              : 'text-red-700'
                            }`}>
                              {score.confidence}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs">{score.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contradictions */}
                  {engagement.preliminary_analysis.contradictions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        ⚠️ Contradictions ({engagement.preliminary_analysis.contradictions.length})
                      </h4>
                      <div className="space-y-2">
                        {engagement.preliminary_analysis.contradictions.map((c: any, i: number) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div><span className="text-gray-500">Source A:</span> {c.claim_a}</div>
                              <div><span className="text-gray-500">Source B:</span> {c.claim_b}</div>
                            </div>
                            <div className="text-amber-800 text-xs">
                              <strong>Ask:</strong> {c.suggested_resolution}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Insights Preview</h4>
                    <div className="space-y-1">
                      {(engagement.preliminary_analysis.topInsights || []).map((insight: string, i: number) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-indigo-500 font-bold">{i + 1}.</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="flex gap-4 text-xs text-gray-400 border-t pt-2">
                    <span>Analysis run: {engagement.preliminary_analysis_at ? new Date(engagement.preliminary_analysis_at).toLocaleString() : '—'}</span>
                    <span>Questions: {engagement.preliminary_analysis.questionsAnswered ?? 0}/{engagement.preliminary_analysis.totalQuestions ?? 0}</span>
                    <span>Chains: {engagement.preliminary_analysis.chainsCompleted ?? 0}/{engagement.preliminary_analysis.totalChains ?? 0}</span>
                  </div>

                  {/* Gaps list */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Identified Gaps</h4>
                    {gaps.length === 0 ? (
                      <p className="text-sm text-slate-500">No gaps recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {gaps.map((gap) => (
                          <div key={gap.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {gap.source === 'ai_preliminary' && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  AI suggested
                                </span>
                              )}
                              {gap.severity && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  gap.severity === 'blocking' ? 'bg-red-100 text-red-700'
                                  : gap.severity === 'important' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {gap.severity}
                                </span>
                              )}
                              <span className="text-xs text-slate-500">{gap.gap_area}</span>
                              {gap.status !== 'identified' && (
                                <span className="text-xs text-slate-500">— {gap.status}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{gap.description}</p>
                            {gap.source === 'ai_preliminary' && gap.status === 'identified' && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleDismissGap(gap.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                  Dismiss (not relevant)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ctx = window.prompt('Add context from follow-up call (this will be sent to report generation):');
                                    if (ctx !== null) handleResolveGap(gap.id, ctx);
                                  }}
                                  disabled={resolvingGapId === gap.id}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50"
                                >
                                  {resolvingGapId === gap.id ? 'Saving...' : 'Resolve with context'}
                                </button>
                              </div>
                            )}
                            {gap.status === 'resolved' && gap.additional_context && (
                              <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                <strong>Context:</strong> {gap.additional_context}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {engagement.review_status !== 'complete' && gaps.some((g) => g.status === 'identified') && (
                      <p className="text-sm text-amber-600 mt-3">
                        Resolve or dismiss all gaps, then mark review complete to enable report generation.
                      </p>
                    )}
                    {engagement.preliminary_analysis && engagement.review_status !== 'complete' && (
                      <button
                        type="button"
                        onClick={handleMarkReviewComplete}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                      >
                        Mark review complete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {!allStagesComplete ? (
                <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                  <p className="text-amber-900 font-medium">All stages must be completed</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Complete Stage 1, 2, and 3 before generating the analysis
                  </p>
                </div>
              ) : !report ? (
                <div className="text-center py-12 bg-indigo-50 border border-indigo-200 rounded-lg">
                  {!engagement.preliminary_analysis ? (
                    <>
                      <BarChart3 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                      <p className="text-indigo-900 font-medium mb-2">Run preliminary analysis first</p>
                      <p className="text-sm text-indigo-700 mb-4">
                        Use &quot;Run Preliminary Analysis&quot; above to review data quality and gaps, then complete the Review tab before generating the full report.
                      </p>
                      <button
                        onClick={handleRunPreliminary}
                        disabled={runningPreliminary}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                      >
                        {runningPreliminary ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                        {runningPreliminary ? 'Running...' : 'Run Preliminary Analysis'}
                      </button>
                    </>
                  ) : engagement.review_status === 'complete' ? (
                    <>
                      <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                      <p className="text-indigo-900 font-medium mb-2">Ready to Generate Full Report</p>
                      <p className="text-sm text-indigo-700 mb-4">
                        Review is complete. Click below to generate the comprehensive Systems Audit report (1–2 minutes).
                      </p>
                      <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                      >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {generating ? 'Generating...' : 'Generate Full Report'}
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                      <p className="text-amber-900 font-medium mb-2">Complete the Review tab</p>
                      <p className="text-sm text-amber-700 mb-4">
                        Resolve or dismiss identified gaps and mark review complete, then you can generate the full report.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('review')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Go to Review tab
                      </button>
                    </>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
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
