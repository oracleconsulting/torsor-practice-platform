'use client';

import { useState } from 'react';
import { 
  Sparkles,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  EyeOff,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InsightEditor } from './InsightEditor';
import type { MAInsight, MAFinancialData, MAKPIValue, TierType, InsightStatus, InsightPriority } from '../../types/ma';

interface InsightsReviewPanelProps {
  periodId: string;
  engagementId: string;
  tier: TierType;
  clientName: string;
  financialData: MAFinancialData | null;
  kpis: MAKPIValue[];
  tuesdayQuestion?: string;
  insights: MAInsight[];
  onInsightsUpdate: (insights: MAInsight[]) => void;
  onContinue: () => void;
}

const INSIGHT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  observation: { icon: <Info className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-100' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-100' },
  opportunity: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  recommendation: { icon: <Lightbulb className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-100' },
  action_required: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-100' },
};

const PRIORITY_CONFIG: Record<InsightPriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' },
  high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { label: 'Medium', color: 'text-blue-700', bg: 'bg-blue-100' },
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-100' },
};

const STATUS_CONFIG: Record<InsightStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
  edited: { label: 'Edited', color: 'text-blue-700', bg: 'bg-blue-100' },
};

export function InsightsReviewPanel({
  periodId,
  engagementId,
  tier,
  clientName,
  financialData,
  kpis,
  tuesdayQuestion,
  insights,
  onInsightsUpdate,
  onContinue,
}: InsightsReviewPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingInsight, setEditingInsight] = useState<MAInsight | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<InsightStatus | 'all'>('all');

  const generateAIInsights = async () => {
    setGenerating(true);
    try {
      // Prepare KPI data for the API
      const kpiData = kpis.map(k => ({
        kpi_code: k.kpi_code,
        value: k.value,
        target_value: k.target_value,
        previous_value: k.previous_value,
        rag_status: k.rag_status,
      }));

      const requestBody = {
        engagementId,
        periodId,
        tier,
        clientName,
        financialData,
        kpis: kpiData,
        tuesdayQuestion,
      };
      
      console.log('[InsightsReviewPanel] Sending request:', requestBody);

      const response = await supabase.functions.invoke('generate-ma-insights', {
        body: requestBody,
      });

      console.log('[InsightsReviewPanel] Response:', response);

      if (response.error) {
        console.error('[InsightsReviewPanel] Edge function error:', response.error);
        throw new Error(response.error.message);
      }

      console.log('[InsightsReviewPanel] Response data:', response.data);

      if (response.data?.success) {
        console.log('[InsightsReviewPanel] Generation complete, refetching all insights');
        
        // Refetch ALL insights from database to get correct state
        // (old AI drafts were deleted by the edge function, new ones inserted)
        const { data: freshInsights, error: fetchError } = await supabase
          .from('ma_insights')
          .select('*')
          .eq('period_id', periodId)
          .order('display_order', { ascending: true });
        
        if (fetchError) {
          console.error('[InsightsReviewPanel] Error fetching insights:', fetchError);
          throw new Error('Generated insights but failed to load them');
        }
        
        console.log('[InsightsReviewPanel] Loaded', freshInsights?.length || 0, 'total insights');
        onInsightsUpdate(freshInsights || []);
      } else if (response.data?.error) {
        throw new Error(response.data.error);
      } else {
        console.warn('[InsightsReviewPanel] Unexpected response:', response.data);
        alert('Unexpected response from AI. Please try again.');
      }
    } catch (error: any) {
      console.error('[InsightsReviewPanel] Error generating insights:', error);
      alert('Failed to generate insights: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateInsightStatus = async (insightId: string, status: InsightStatus) => {
    try {
      const updateData: Record<string, unknown> = { status };
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ma_insights')
        .update(updateData)
        .eq('id', insightId);

      if (error) throw error;

      onInsightsUpdate(
        insights.map(i => i.id === insightId ? { ...i, status, ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}) } : i)
      );
    } catch (error: any) {
      console.error('[InsightsReviewPanel] Error updating status:', error);
      alert('Failed to update: ' + error.message);
    }
  };

  const toggleShowToClient = async (insightId: string, show: boolean) => {
    try {
      const { error } = await supabase
        .from('ma_insights')
        .update({ show_to_client: show })
        .eq('id', insightId);

      if (error) throw error;

      onInsightsUpdate(
        insights.map(i => i.id === insightId ? { ...i, show_to_client: show } : i)
      );
    } catch (error: any) {
      console.error('[InsightsReviewPanel] Error toggling visibility:', error);
    }
  };

  const deleteInsight = async (insightId: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;

    try {
      const { error } = await supabase
        .from('ma_insights')
        .delete()
        .eq('id', insightId);

      if (error) throw error;

      onInsightsUpdate(insights.filter(i => i.id !== insightId));
    } catch (error: any) {
      console.error('[InsightsReviewPanel] Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  };

  const resetAllInsights = async () => {
    if (!confirm(`⚠️ DELETE ALL ${insights.length} INSIGHTS for this period?\n\nThis will remove:\n- ${approvedCount} approved insights\n- ${draftCount} pending drafts\n- All manual additions\n\nThis cannot be undone. Continue?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ma_insights')
        .delete()
        .eq('period_id', periodId);

      if (error) throw error;

      onInsightsUpdate([]);
      console.log(`[InsightsReviewPanel] Reset all ${insights.length} insights`);
    } catch (error: any) {
      console.error('[InsightsReviewPanel] Error resetting:', error);
      alert('Failed to reset: ' + error.message);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredInsights = insights.filter(i => 
    statusFilter === 'all' || i.status === statusFilter
  );

  const draftCount = insights.filter(i => i.status === 'draft').length;
  const approvedCount = insights.filter(i => i.status === 'approved').length;

  // canContinue logic moved to parent component for delivery gating

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Insights & Analysis</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate AI insights or add your own. Review and approve before delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingInsight(null);
              setShowEditor(true);
            }}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Manual
          </button>
          <button 
            onClick={generateAIInsights}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Summary */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{insights.length}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
                <div className="text-xs text-amber-600">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-xs text-green-600">Approved</div>
              </div>
            </div>
            
            {/* Filter & Actions */}
            <div className="flex items-center gap-3">
              {insights.length > 7 && (
                <button
                  onClick={resetAllInsights}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1"
                  title="Delete ALL insights and start fresh"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset All ({insights.length})
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filter:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InsightStatus | 'all')}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="draft">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights List */}
      {filteredInsights.length > 0 ? (
        <div className="space-y-4">
          {filteredInsights.map(insight => {
            const typeConfig = INSIGHT_TYPE_CONFIG[insight.insight_type] || INSIGHT_TYPE_CONFIG.observation;
            const priorityConfig = PRIORITY_CONFIG[insight.priority as InsightPriority] || PRIORITY_CONFIG.medium;
            const statusConfig = STATUS_CONFIG[insight.status as InsightStatus] || STATUS_CONFIG.draft;
            const isExpanded = expandedInsights.has(insight.id);

            return (
              <div 
                key={insight.id}
                className={`bg-white rounded-xl border ${
                  insight.status === 'draft' ? 'border-amber-200 bg-amber-50/30' :
                  insight.status === 'approved' ? 'border-green-200' :
                  insight.status === 'rejected' ? 'border-red-200 bg-red-50/30' :
                  'border-slate-200'
                } overflow-hidden`}
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                        <span className={typeConfig.color}>{typeConfig.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                            {priorityConfig.label} Priority
                          </span>
                          {insight.is_auto_generated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleShowToClient(insight.id, !insight.show_to_client)}
                        className={`p-2 rounded-lg transition-colors ${
                          insight.show_to_client 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                        title={insight.show_to_client ? 'Visible to client' : 'Hidden from client'}
                      >
                        {insight.show_to_client ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => toggleExpanded(insight.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsed preview */}
                  {!isExpanded && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{insight.description}</p>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <p className="text-sm text-slate-700">{insight.description}</p>
                    
                    {insight.data_points && insight.data_points.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {insight.data_points.map((dp, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                            {dp}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {insight.implications && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-slate-500 mb-1">Business Impact</div>
                        <p className="text-sm text-slate-700">{insight.implications}</p>
                      </div>
                    )}
                    
                    {insight.recommendation && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-blue-600 mb-1">Recommended Action</div>
                        <p className="text-sm text-blue-800">{insight.recommendation}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {insight.status === 'draft' && (
                          <>
                            <button
                              onClick={() => updateInsightStatus(insight.id, 'approved')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => updateInsightStatus(insight.id, 'rejected')}
                              className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-1.5"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setEditingInsight(insight);
                            setShowEditor(true);
                          }}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => deleteInsight(insight.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">Generate AI-Powered Insights</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Click "Generate AI Insights" to analyze the financial data and KPIs, producing in-depth, actionable insights for your client.
          </p>
          <button 
            onClick={generateAIInsights}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Financial Data...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate AI Insights
              </>
            )}
          </button>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <InsightEditor
              periodId={periodId}
              engagementTier={tier}
              insight={editingInsight ?? undefined}
              onSave={(newInsight) => {
                if (editingInsight) {
                  onInsightsUpdate(insights.map(i => i.id === newInsight.id ? newInsight : i));
                } else {
                  onInsightsUpdate([...insights, newInsight]);
                }
                setShowEditor(false);
                setEditingInsight(null);
              }}
              onCancel={() => {
                setShowEditor(false);
                setEditingInsight(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Continue button with warning */}
      <div className="space-y-3">
        {draftCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {draftCount} insight{draftCount > 1 ? 's' : ''} pending review
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Review and approve insights before delivering to the client.
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={onContinue}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to Tuesday Question →
        </button>
      </div>
    </div>
  );
}

export default InsightsReviewPanel;

