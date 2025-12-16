// ============================================================================
// MA INSIGHT REVIEW COMPONENT
// ============================================================================
// Practice team reviews and approves AI-generated insights before sharing
// Philosophy: Every insight must connect to the client's life goal, not just metrics
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { 
  MAMonthlyInsightsRow, 
  MAInsight, 
  MADecision, 
  MAWatchItem,
  MAHeadlineSentiment,
  MAInsightUrgency
} from '@/types/management-accounts';
import {
  CheckCircle,
  XCircle,
  Edit3,
  Send,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface MAInsightReviewProps {
  insightId: string;
  onClose?: () => void;
  onStatusChange?: () => void;
}

const SENTIMENT_CONFIG: Record<MAHeadlineSentiment, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: TrendingUp },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Minus },
  warning: { bg: 'bg-amber-50', text: 'text-amber-800', icon: AlertTriangle },
  critical: { bg: 'bg-red-50', text: 'text-red-800', icon: AlertTriangle },
};

const URGENCY_CONFIG: Record<MAInsightUrgency, { bg: string; text: string; label: string }> = {
  info: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Info' },
  consider: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Consider' },
  action_needed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Action Needed' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  generating: { bg: 'bg-blue-100', text: 'text-blue-700' },
  generated: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  shared: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export function MAInsightReview({ insightId, onClose, onStatusChange }: MAInsightReviewProps) {
  const [insight, setInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    decisions: true,
    watchList: true,
    northStar: true,
  });

  useEffect(() => {
    fetchInsight();
  }, [insightId]);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('ma_monthly_insights')
        .select(`
          *,
          ma_financial_snapshots (
            *,
            ma_engagements (
              *,
              practice_members!ma_engagements_client_id_fkey (
                name,
                client_company
              )
            )
          )
        `)
        .eq('id', insightId)
        .single();

      if (fetchError) throw fetchError;
      setInsight(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!insight) return;
    
    setRegenerating(true);
    try {
      const { error: invokeError } = await supabase.functions.invoke('generate-ma-insights', {
        body: { snapshotId: insight.snapshot_id, regenerate: true }
      });

      if (invokeError) throw invokeError;
      await fetchInsight();
      onStatusChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('ma_monthly_insights')
        .update({
          status: 'approved',
          approved_by: userData.user?.id,
          approved_at: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', insightId);

      if (updateError) throw updateError;
      
      setShowApproveModal(false);
      setReviewNotes('');
      await fetchInsight();
      onStatusChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('ma_monthly_insights')
        .update({
          status: 'shared',
          shared_with_client: true,
          shared_at: new Date().toISOString(),
          shared_by: userData.user?.id
        })
        .eq('id', insightId);

      if (updateError) throw updateError;
      
      setShowShareModal(false);
      await fetchInsight();
      onStatusChange?.();
      
      // TODO: Trigger email notification to client
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSharing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-slate-600 mt-4">Loading insight...</p>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">Failed to load insight</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchInsight}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const client = insight.ma_financial_snapshots?.ma_engagements?.practice_members;
  const snapshot = insight.ma_financial_snapshots;
  const sentimentConfig = SENTIMENT_CONFIG[insight.headline_sentiment as MAHeadlineSentiment];
  const SentimentIcon = sentimentConfig?.icon || Minus;
  const statusConfig = STATUS_CONFIG[insight.status] || STATUS_CONFIG.generated;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {client?.client_company || 'Client'} — {format(new Date(insight.period_end_date), 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {insight.status.charAt(0).toUpperCase() + insight.status.slice(1)}
            </span>
            {insight.llm_cost && (
              <span className="text-xs text-slate-500">
                Generated in {(insight.generation_time_ms / 1000).toFixed(1)}s • £{insight.llm_cost.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          {insight.status === 'generated' && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve
            </button>
          )}

          {insight.status === 'approved' && (
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Send className="h-4 w-4 mr-1.5" />
              Share with Client
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* The Headline */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SentimentIcon className={`h-5 w-5 ${sentimentConfig?.text || 'text-slate-600'}`} />
            <h3 className="font-semibold text-slate-900">The Headline</h3>
          </div>
        </div>
        <div className={`p-5 ${sentimentConfig?.bg || 'bg-slate-50'}`}>
          <p className={`text-lg font-medium italic ${sentimentConfig?.text || 'text-slate-700'}`}>
            "{insight.headline_text}"
          </p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('insights')}
          className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Key Insights</h3>
            <span className="text-sm text-slate-500">({(insight.insights as MAInsight[])?.length || 0})</span>
          </div>
          {expandedSections.insights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.insights && (
          <div className="p-4 space-y-4">
            {(insight.insights as MAInsight[])?.map((item, idx) => {
              const urgencyConfig = URGENCY_CONFIG[item.urgency as MAInsightUrgency];
              return (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      {item.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${urgencyConfig?.bg} ${urgencyConfig?.text}`}>
                      {urgencyConfig?.label}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900 mb-1">{item.finding}</p>
                  <p className="text-sm text-slate-600 mb-2">{item.implication}</p>
                  {item.action && (
                    <div className="bg-sky-50 border border-sky-100 rounded p-2">
                      <p className="text-sm text-sky-800">
                        <strong>Action:</strong> {item.action}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {(!insight.insights || insight.insights.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-4">No insights generated</p>
            )}
          </div>
        )}
      </div>

      {/* Decisions Enabled */}
      {(insight.decisions_enabled as MADecision[])?.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('decisions')}
            className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Decisions You Can Now Make</h3>
            </div>
            {expandedSections.decisions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.decisions && (
            <div className="p-4 space-y-4">
              {(insight.decisions_enabled as MADecision[]).map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <p className="font-medium text-slate-900 mb-2">{item.decision}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.supportingData.map((data, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {data}
                      </span>
                    ))}
                  </div>
                  {item.consideration && (
                    <div className="bg-amber-50 border border-amber-100 rounded p-2">
                      <p className="text-sm text-amber-800">
                        <strong>Consider:</strong> {item.consideration}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watch List */}
      {(insight.watch_list as MAWatchItem[])?.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('watchList')}
            className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Watch List</h3>
            </div>
            {expandedSections.watchList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.watchList && (
            <div className="p-4">
              <div className="space-y-2">
                {(insight.watch_list as MAWatchItem[]).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.metric}</p>
                      <p className="text-sm text-slate-500">
                        Currently: {item.currentValue} • Alert if: {item.threshold}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      Check: {item.checkDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* North Star Connection */}
      {insight.north_star_connection && (
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden">
          <button
            onClick={() => toggleSection('northStar')}
            className="w-full px-4 py-3 bg-purple-100/50 border-b border-purple-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Connection to Your North Star</h3>
            </div>
            {expandedSections.northStar ? <ChevronUp className="h-4 w-4 text-purple-600" /> : <ChevronDown className="h-4 w-4 text-purple-600" />}
          </button>
          
          {expandedSections.northStar && (
            <div className="p-5">
              <p className="text-purple-900">{insight.north_star_connection}</p>
              {insight.north_star_sentiment && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    insight.north_star_sentiment === 'closer' 
                      ? 'bg-green-100 text-green-700' 
                      : insight.north_star_sentiment === 'further'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {insight.north_star_sentiment === 'closer' && '↑ Moving Closer'}
                    {insight.north_star_sentiment === 'further' && '↓ Moving Further'}
                    {insight.north_star_sentiment === 'stable' && '→ Stable'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Approve Insight</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Any notes about this review..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Share with Client</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will make the insight visible to the client in their portal and send them an email notification.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-slate-700 mb-1">Headline Preview:</p>
              <p className="text-sm italic text-slate-600">"{insight.headline_text}"</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="inline-flex items-center px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {sharing ? 'Sharing...' : 'Share Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

