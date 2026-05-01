/**
 * Insight List
 * Container for displaying theme-based insights
 * Maximum 7 insights, Tuesday Question always first
 */

import { Sparkles, RefreshCw } from 'lucide-react';
import { InsightCard } from './InsightCard';
import type { BIInsight, InsightTheme } from '../../types/business-intelligence';

interface InsightListProps {
  insights: BIInsight[];
  showRecommendations?: boolean;
  onRunScenario?: (scenarioId: string) => void;
  editable?: boolean;
  onEditInsight?: (insightId: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function InsightList({
  insights,
  showRecommendations = true,
  onRunScenario,
  editable,
  onEditInsight,
  onRegenerate,
  isRegenerating
}: InsightListProps) {
  // Sort insights: Tuesday Question first, then by display_order
  const sortedInsights = [...insights].sort((a, b) => {
    // Tuesday Question always first
    if (a.theme === 'tuesday_question') return -1;
    if (b.theme === 'tuesday_question') return 1;
    // Then by display order
    return (a.display_order || 99) - (b.display_order || 99);
  });
  
  // Filter to only active insights
  const activeInsights = sortedInsights.filter(i => i.is_active);
  
  // Group by priority for summary
  const critical = activeInsights.filter(i => i.priority === 'critical').length;
  const warning = activeInsights.filter(i => i.priority === 'warning').length;
  const opportunity = activeInsights.filter(i => i.priority === 'opportunity').length;
  const positive = activeInsights.filter(i => i.priority === 'positive').length;
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            AI-generated analysis tailored to your business
          </p>
        </div>
        
        {editable && onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Generating...' : 'Regenerate'}
          </button>
        )}
      </div>
      
      {/* Summary badges */}
      {activeInsights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {critical > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {critical} Critical
            </span>
          )}
          {warning > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {warning} Warning
            </span>
          )}
          {opportunity > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {opportunity} Opportunity
            </span>
          )}
          {positive > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {positive} Positive
            </span>
          )}
        </div>
      )}
      
      {/* Insights */}
      {activeInsights.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No insights generated yet</p>
          {editable && onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Insights
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showRecommendations={showRecommendations}
              onRunScenario={onRunScenario}
              editable={editable}
              onEdit={() => onEditInsight?.(insight.id)}
            />
          ))}
        </div>
      )}
      
      {/* Maximum insights note */}
      {activeInsights.length >= 7 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Showing all {activeInsights.length} insights (maximum 7)
        </p>
      )}
    </div>
  );
}

// ============================================
// THEME ICONS AND LABELS
// ============================================

export const THEME_CONFIG: Record<InsightTheme, { label: string; icon: string; color: string }> = {
  tuesday_question: { label: 'Your Question', icon: '❓', color: 'blue' },
  cash_runway: { label: 'Cash Position', icon: '💰', color: 'emerald' },
  debtor_opportunity: { label: 'Collections', icon: '📥', color: 'cyan' },
  cost_structure: { label: 'Cost Structure', icon: '📊', color: 'purple' },
  tax_obligations: { label: 'Tax Obligations', icon: '🏛️', color: 'orange' },
  profitability: { label: 'Profitability', icon: '📈', color: 'green' },
  client_health: { label: 'Client Health', icon: '🤝', color: 'pink' },
  pricing_power: { label: 'Pricing Power', icon: '💵', color: 'amber' }
};

