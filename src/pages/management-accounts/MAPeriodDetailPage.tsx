'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  Upload,
  Calculator,
  Lightbulb,
  HelpCircle,
  Send,
  CheckCircle2,
  BarChart3,
  Eye,
  Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  DocumentUploader,
  InsightCard,
  InsightEditor,
  PeriodDeliveryChecklist,
  TrueCashCard
} from '../../components/management-accounts';
import { calculateTrueCash, formatTrueCashForDisplay } from '../../services/ma/true-cash';
import type { 
  MAEngagement, 
  MAPeriod, 
  MADocument, 
  MAFinancialData, 
  MAInsight,
  MAKPIValue
} from '../../types/ma';

type WorkflowTab = 'upload' | 'data' | 'kpis' | 'insights' | 'tuesday' | 'deliver';

const WORKFLOW_STEPS: { tab: WorkflowTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'upload', label: 'Upload Docs', icon: <Upload className="h-4 w-4" /> },
  { tab: 'data', label: 'Financial Data', icon: <Calculator className="h-4 w-4" /> },
  { tab: 'kpis', label: 'KPIs', icon: <BarChart3 className="h-4 w-4" /> },
  { tab: 'insights', label: 'Insights', icon: <Lightbulb className="h-4 w-4" /> },
  { tab: 'tuesday', label: 'Tuesday Q', icon: <HelpCircle className="h-4 w-4" /> },
  { tab: 'deliver', label: 'Deliver', icon: <Send className="h-4 w-4" /> },
];

export function MAPeriodDetailPage() {
  const { engagementId, periodId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<MAEngagement & { client?: { name: string; company_name?: string } } | null>(null);
  const [period, setPeriod] = useState<MAPeriod | null>(null);
  const [documents, setDocuments] = useState<MADocument[]>([]);
  const [financialData, setFinancialData] = useState<MAFinancialData | null>(null);
  const [insights, setInsights] = useState<MAInsight[]>([]);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);
  const [activeTab, setActiveTab] = useState<WorkflowTab>('upload');
  const [showInsightEditor, setShowInsightEditor] = useState(false);
  const [editingInsight, setEditingInsight] = useState<MAInsight | undefined>();

  useEffect(() => {
    if (engagementId && periodId) {
      loadPeriodData();
    }
  }, [engagementId, periodId]);

  const loadPeriodData = async () => {
    setLoading(true);
    try {
      // Load engagement
      const { data: engData } = await supabase
        .from('ma_engagements')
        .select('*, client:clients(name, company_name)')
        .eq('id', engagementId)
        .single();

      if (engData) setEngagement(engData);

      // Load period
      const { data: periodData } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('id', periodId)
        .single();

      if (periodData) setPeriod(periodData);

      // Load documents
      const { data: docsData } = await supabase
        .from('ma_documents')
        .select('*')
        .eq('period_id', periodId)
        .order('uploaded_at', { ascending: false });

      if (docsData) setDocuments(docsData);

      // Load financial data
      const { data: finData } = await supabase
        .from('ma_financial_data')
        .select('*')
        .eq('period_id', periodId)
        .single();

      if (finData) setFinancialData(finData);

      // Load insights
      const { data: insightsData } = await supabase
        .from('ma_insights')
        .select('*')
        .eq('period_id', periodId)
        .order('display_order', { ascending: true });

      if (insightsData) setInsights(insightsData);

      // Load KPIs
      const { data: kpisData } = await supabase
        .from('ma_kpi_tracking')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('period_end', periodData?.period_end);

      if (kpisData) setKpis(kpisData);

    } catch (error) {
      console.error('Error loading period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePeriodStatus = async (status: MAPeriod['status']) => {
    if (!period) return;

    await supabase
      .from('ma_periods')
      .update({ status })
      .eq('id', period.id);

    setPeriod({ ...period, status });
  };

  const saveTuesdayQuestion = async (question: string) => {
    if (!period) return;

    await supabase
      .from('ma_periods')
      .update({ 
        tuesday_question: question,
        tuesday_question_asked_at: new Date().toISOString()
      })
      .eq('id', period.id);

    setPeriod({ ...period, tuesday_question: question });
  };

  const saveTuesdayAnswer = async (answer: string, format: 'text' | 'calculation' | 'scenario') => {
    if (!period) return;

    await supabase
      .from('ma_periods')
      .update({ 
        tuesday_answer: answer,
        tuesday_answer_format: format
      })
      .eq('id', period.id);

    setPeriod({ ...period, tuesday_answer: answer, tuesday_answer_format: format });
  };

  const handleInsightSave = (insight: MAInsight) => {
    if (editingInsight) {
      setInsights(prev => prev.map(i => i.id === insight.id ? insight : i));
    } else {
      setInsights(prev => [...prev, insight]);
    }
    setShowInsightEditor(false);
    setEditingInsight(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!engagement || !period) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Period not found</p>
      </div>
    );
  }

  const tier = engagement.tier;
  const trueCashData = financialData?.cash_at_bank
    ? formatTrueCashForDisplay(calculateTrueCash({
        bankBalance: financialData.cash_at_bank,
        vatLiability: financialData.vat_liability || 0,
        payeLiability: financialData.paye_liability || 0,
        corporationTaxLiability: financialData.corporation_tax_liability || 0,
        monthlyOperatingCosts: financialData.overheads || 0,
      }))
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(`/admin/ma/engagements/${engagementId}`)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {engagement.client?.company_name || engagement.client?.name}
            </button>
            <h1 className="text-xl font-bold text-slate-900">{period.period_label}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                period.status === 'delivered' ? 'bg-green-100 text-green-700' :
                period.status === 'review' ? 'bg-purple-100 text-purple-700' :
                period.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {period.status.replace('_', ' ')}
              </span>
              {period.due_date && (
                <span className="text-sm text-slate-500">
                  Due: {new Date(period.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/client/ma/${engagement.id}/periods/${period.id}`, '_blank')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeTab === step.tab;
            const isComplete = 
              (step.tab === 'upload' && documents.length > 0) ||
              (step.tab === 'data' && financialData) ||
              (step.tab === 'kpis' && kpis.length > 0) ||
              (step.tab === 'insights' && insights.length > 0) ||
              (step.tab === 'tuesday' && period.tuesday_answer) ||
              (step.tab === 'deliver' && ['delivered', 'client_reviewed'].includes(period.status));

            return (
              <button
                key={step.tab}
                onClick={() => setActiveTab(step.tab)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : isComplete 
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {isComplete && !isActive ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  step.icon
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Documents</h2>
                <DocumentUploader
                  periodId={period.id}
                  engagementId={engagement.id}
                  onUploadComplete={loadPeriodData}
                />
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Uploaded Documents</h3>
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{doc.file_name}</p>
                          <p className="text-xs text-slate-500">{doc.document_type.replace('_', ' ')}</p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  updatePeriodStatus('data_received');
                  setActiveTab('data');
                }}
                disabled={documents.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                Continue to Financial Data →
              </button>
            </div>
          )}

          {/* Data Entry Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Financial Data</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Enter or verify the financial data extracted from uploaded documents.
                </p>
                
                {/* Financial Data Form would go here */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700">Profit & Loss</h3>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Revenue</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.revenue || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Cost of Sales</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.cost_of_sales || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Overheads</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.overheads || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700">Balance Sheet</h3>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Cash at Bank</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.cash_at_bank || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Trade Debtors</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.trade_debtors || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Trade Creditors</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={financialData?.trade_creditors || ''}
                        className="w-full border border-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {trueCashData && <TrueCashCard data={trueCashData} />}

              <button
                onClick={() => {
                  updatePeriodStatus('in_progress');
                  setActiveTab('kpis');
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Calculate KPIs →
              </button>
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">KPI Calculations</h2>
                {kpis.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpis.map(kpi => (
                      <div 
                        key={kpi.kpi_code}
                        className={`p-4 rounded-lg border ${
                          kpi.rag_status === 'green' ? 'border-green-200 bg-green-50' :
                          kpi.rag_status === 'amber' ? 'border-amber-200 bg-amber-50' :
                          kpi.rag_status === 'red' ? 'border-red-200 bg-red-50' :
                          'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-slate-600">
                            {kpi.kpi_name || kpi.kpi_code}
                          </span>
                          {kpi.rag_status && (
                            <span className={`w-2 h-2 rounded-full ${
                              kpi.rag_status === 'green' ? 'bg-green-500' :
                              kpi.rag_status === 'amber' ? 'bg-amber-500' :
                              kpi.rag_status === 'red' ? 'bg-red-500' :
                              'bg-slate-400'
                            }`} />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {kpi.value?.toLocaleString() ?? '-'}
                        </div>
                        {kpi.previous_value !== undefined && kpi.previous_value !== null && (
                          <div className="text-sm text-slate-500 mt-1">
                            Previous: {kpi.previous_value.toLocaleString()}
                          </div>
                        )}
                        {kpi.auto_commentary && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {kpi.auto_commentary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No KPIs calculated yet</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Calculate KPIs
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('insights')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Write Insights →
              </button>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Insights</h2>
                <button
                  onClick={() => setShowInsightEditor(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Lightbulb className="h-4 w-4" />
                  Add Insight
                </button>
              </div>

              {insights.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 font-medium">No insights yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Add observations, warnings, and recommendations for this period
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map(insight => (
                    <div key={insight.id} className="relative group">
                      <InsightCard
                        insight={insight}
                        showRecommendation={tier !== 'bronze'}
                      />
                      <button
                        onClick={() => {
                          setEditingInsight(insight);
                          setShowInsightEditor(true);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setActiveTab('tuesday')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Answer Tuesday Question →
              </button>

              {showInsightEditor && (
                <InsightEditor
                  periodId={period.id}
                  engagementTier={tier}
                  insight={editingInsight}
                  onSave={handleInsightSave}
                  onCancel={() => {
                    setShowInsightEditor(false);
                    setEditingInsight(undefined);
                  }}
                />
              )}
            </div>
          )}

          {/* Tuesday Question Tab */}
          {activeTab === 'tuesday' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  Tuesday Question
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      The Question
                    </label>
                    <textarea
                      value={period.tuesday_question || ''}
                      onChange={(e) => saveTuesdayQuestion(e.target.value)}
                      placeholder="What's the one question this client asks every week?"
                      className="w-full border border-slate-300 rounded-lg p-3 min-h-[80px]"
                    />
                  </div>
                  
                  {period.tuesday_question && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Answer Format
                        </label>
                        <div className="flex gap-2">
                          {(['text', 'calculation', 'scenario'] as const).map(format => (
                            <button
                              key={format}
                              onClick={() => saveTuesdayAnswer(period.tuesday_answer || '', format)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                period.tuesday_answer_format === format
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {format === 'text' ? 'Text Answer' : 
                               format === 'calculation' ? 'Show Calculation' : 
                               'Scenario Model'}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          The Answer
                        </label>
                        <textarea
                          value={period.tuesday_answer || ''}
                          onChange={(e) => saveTuesdayAnswer(e.target.value, period.tuesday_answer_format || 'text')}
                          placeholder="Write the answer to their Tuesday question..."
                          className="w-full border border-slate-300 rounded-lg p-3 min-h-[150px]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  updatePeriodStatus('review');
                  setActiveTab('deliver');
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Ready for Review →
              </button>
            </div>
          )}

          {/* Deliver Tab */}
          {activeTab === 'deliver' && (
            <div className="space-y-6">
              <PeriodDeliveryChecklist
                periodId={period.id}
                engagementId={engagement.id}
                tier={tier}
                periodLabel={period.period_label || 'Report'}
                onComplete={() => {
                  loadPeriodData();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MAPeriodDetailPage;

