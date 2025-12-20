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
  const [activeTab, setActiveTab] = useState<'assessments' | 'documents' | 'analysis'>('assessments');
  const [engagement, setEngagement] = useState<SAEngagement | null>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [systems, setSystems] = useState<any[]>([]);
  const [deepDives, setDeepDives] = useState<any[]>([]);
  const [report, setReport] = useState<SAReport | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
            {generating ? 'Generating...' : 'Generate Analysis'}
          </button>
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
                  <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                  <p className="text-indigo-900 font-medium mb-2">Ready to Generate Analysis</p>
                  <p className="text-sm text-indigo-700 mb-4">
                    Click the "Generate Analysis" button above to create the comprehensive Systems Audit report
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generating ? 'Generating...' : 'Generate Analysis'}
                  </button>
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
