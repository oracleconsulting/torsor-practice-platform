'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Info, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink
} from 'lucide-react';
import type { MAInsight, MAInsightType } from '../../types/ma';

interface InsightCardProps {
  insight: MAInsight;
  showRecommendation?: boolean;
  onAcknowledge?: (id: string) => void;
  onActionTaken?: (id: string, action: string) => void;
  compact?: boolean;
}

const INSIGHT_ICONS: Record<MAInsightType, React.ReactNode> = {
  observation: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  opportunity: <TrendingUp className="h-5 w-5" />,
  recommendation: <Lightbulb className="h-5 w-5" />,
  action_required: <AlertCircle className="h-5 w-5" />,
};

const INSIGHT_STYLES: Record<MAInsightType, { bg: string; border: string; icon: string; badge: string }> = {
  observation: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  opportunity: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  recommendation: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  action_required: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
  },
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-700',
};

export function InsightCard({ 
  insight, 
  showRecommendation = true,
  onAcknowledge,
  onActionTaken,
  compact = false
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [actionInput, setActionInput] = useState('');
  const [showActionInput, setShowActionInput] = useState(false);

  const styles = INSIGHT_STYLES[insight.insight_type];
  const icon = INSIGHT_ICONS[insight.insight_type];

  const handleAcknowledge = () => {
    onAcknowledge?.(insight.id);
  };

  const handleSubmitAction = () => {
    if (actionInput.trim()) {
      onActionTaken?.(insight.id, actionInput.trim());
      setActionInput('');
      setShowActionInput(false);
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${styles.bg} ${styles.border}`}>
      {/* Header */}
      <div 
        className={`px-4 py-3 flex items-start gap-3 ${compact ? 'cursor-pointer' : ''}`}
        onClick={compact ? () => setExpanded(!expanded) : undefined}
      >
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-800 text-sm">
              {insight.title}
            </h4>
            
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
              {insight.insight_type.replace('_', ' ')}
            </span>
            
            {insight.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {insight.category}
              </span>
            )}
            
            {insight.recommendation_priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[insight.recommendation_priority]}`}>
                {insight.recommendation_priority} priority
              </span>
            )}
          </div>
          
          {!compact && (
            <p className="text-sm text-slate-600 mt-1">
              {insight.description}
            </p>
          )}
        </div>
        
        {compact && (
          <button className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
        
        {insight.client_acknowledged_at && (
          <div className="flex-shrink-0">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Expanded content */}
      {(expanded || !compact) && (
        <div className="px-4 pb-4 space-y-3">
          {compact && (
            <p className="text-sm text-slate-600">
              {insight.description}
            </p>
          )}
          
          {/* Metric display */}
          {insight.metric_value !== undefined && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">Current:</span>
              <span className="font-semibold text-slate-800">
                {insight.metric_unit === 'currency' 
                  ? `£${insight.metric_value.toLocaleString()}`
                  : insight.metric_unit === 'percentage'
                    ? `${insight.metric_value.toFixed(1)}%`
                    : insight.metric_value
                }
              </span>
              {insight.metric_comparison !== undefined && (
                <>
                  <span className="text-slate-500">Target:</span>
                  <span className="font-medium text-slate-700">
                    {insight.metric_unit === 'currency' 
                      ? `£${insight.metric_comparison.toLocaleString()}`
                      : insight.metric_unit === 'percentage'
                        ? `${insight.metric_comparison.toFixed(1)}%`
                        : insight.metric_comparison
                    }
                  </span>
                </>
              )}
            </div>
          )}
          
          {/* Recommendation (Foresight+ only) */}
          {showRecommendation && insight.recommendation && (
            <div className="bg-white/60 rounded-lg p-3 border border-slate-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 uppercase">Recommendation</span>
              </div>
              <p className="text-sm text-slate-700">{insight.recommendation}</p>
              {insight.recommendation_timing && (
                <p className="text-xs text-slate-500 mt-1">
                  Timing: {insight.recommendation_timing}
                </p>
              )}
            </div>
          )}
          
          {/* Related KPI link */}
          {insight.related_kpi_code && (
            <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              View {insight.related_kpi_code} KPI
            </button>
          )}
          
          {/* Action section */}
          {insight.insight_type === 'action_required' && !insight.action_completed_at && (
            <div className="pt-2 border-t border-slate-200/50 space-y-2">
              {!showActionInput ? (
                <div className="flex gap-2">
                  {onAcknowledge && !insight.client_acknowledged_at && (
                    <button
                      onClick={handleAcknowledge}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {onActionTaken && (
                    <button
                      onClick={() => setShowActionInput(true)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark Action Taken
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Describe the action taken..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitAction}
                      disabled={!actionInput.trim()}
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowActionInput(false)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Action completed */}
          {insight.action_taken && (
            <div className="pt-2 border-t border-slate-200/50">
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                <Check className="h-3 w-3" />
                Action completed
              </div>
              <p className="text-xs text-slate-600 mt-1">{insight.action_taken}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InsightCard;

