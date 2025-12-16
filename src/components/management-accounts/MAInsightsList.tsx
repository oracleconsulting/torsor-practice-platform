// ============================================================================
// MA INSIGHTS LIST COMPONENT
// ============================================================================
// Shows list of generated insights for review/approval
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { MAHeadlineSentiment } from '@/types/management-accounts';
import {
  Eye,
  CheckCircle,
  Clock,
  Send,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2
} from 'lucide-react';

interface MAInsightsListProps {
  practiceId: string;
  statusFilter?: string;
  onSelectInsight: (insightId: string) => void;
  refreshTrigger?: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  generating: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  generated: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Eye },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  shared: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Send },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
};

const SENTIMENT_ICONS: Record<MAHeadlineSentiment, React.ComponentType<any>> = {
  positive: TrendingUp,
  neutral: Minus,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

const SENTIMENT_COLORS: Record<MAHeadlineSentiment, string> = {
  positive: 'text-emerald-600',
  neutral: 'text-slate-500',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

export function MAInsightsList({ 
  practiceId, 
  statusFilter, 
  onSelectInsight,
  refreshTrigger 
}: MAInsightsListProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [practiceId, statusFilter, refreshTrigger]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ma_monthly_insights')
        .select(`
          id,
          period_end_date,
          headline_text,
          headline_sentiment,
          status,
          created_at,
          approved_at,
          shared_at,
          ma_engagements!inner (
            client_id,
            practice_id,
            practice_members!ma_engagements_client_id_fkey (
              name,
              client_company
            )
          )
        `)
        .eq('ma_engagements.practice_id', practiceId)
        .order('period_end_date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;
      setInsights(data || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-slate-600">Loading insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">Failed to load insights</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchInsights}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div className="text-center py-12">
        <Eye className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No insights found</p>
        <p className="text-slate-500 text-sm mt-1">
          Generate insights from a financial snapshot to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Client</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Period</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Headline</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {insights.map((insight) => {
            const client = insight.ma_engagements?.practice_members;
            const statusConfig = STATUS_CONFIG[insight.status] || STATUS_CONFIG.generated;
            const StatusIcon = statusConfig.icon;
            const SentimentIcon = SENTIMENT_ICONS[insight.headline_sentiment as MAHeadlineSentiment] || Minus;
            const sentimentColor = SENTIMENT_COLORS[insight.headline_sentiment as MAHeadlineSentiment] || 'text-slate-500';

            return (
              <tr key={insight.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-slate-900">{client?.client_company || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{client?.name}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-700">
                    {format(new Date(insight.period_end_date), 'MMM yyyy')}
                  </span>
                </td>
                <td className="py-4 px-4 max-w-md">
                  <div className="flex items-start gap-2">
                    <SentimentIcon className={`h-4 w-4 mt-1 flex-shrink-0 ${sentimentColor}`} />
                    <p className="text-sm text-slate-700 line-clamp-2">{insight.headline_text}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {insight.status.charAt(0).toUpperCase() + insight.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => onSelectInsight(insight.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

