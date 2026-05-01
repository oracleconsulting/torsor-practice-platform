/**
 * Business Intelligence Insight Card
 * Theme-based insights with client voice
 * "Use their exact words"
 */

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  AlertTriangle, 
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Quote,
  Edit2,
  BarChart3,
  TrendingUp,
  Info
} from 'lucide-react';
import type { BIInsight, InsightPriority, InsightTheme, VisualizationType } from '../../types/business-intelligence';

interface InsightCardProps {
  insight: BIInsight;
  showRecommendations?: boolean;
  onRunScenario?: (scenarioId: string) => void;
  editable?: boolean;
  onEdit?: () => void;
}

export function InsightCard({
  insight,
  showRecommendations = true,
  onRunScenario,
  editable,
  onEdit
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Priority styling
  const priorityStyles: Record<InsightPriority, { 
    bg: string; 
    border: string; 
    icon: React.ElementType;
    iconColor: string;
    badge: string;
  }> = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-l-red-500',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      badge: 'bg-red-100 text-red-700'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-l-4 border-l-amber-500',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700'
    },
    opportunity: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-l-blue-500',
      icon: Lightbulb,
      iconColor: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700'
    },
    positive: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-l-green-500',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      badge: 'bg-green-100 text-green-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-l-blue-500',
      icon: Info,
      iconColor: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700'
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-l-4 border-l-orange-500',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      badge: 'bg-orange-100 text-orange-700'
    },
    medium: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-l-blue-500',
      icon: Info,
      iconColor: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700'
    },
    low: {
      bg: 'bg-slate-50',
      border: 'border-l-4 border-l-slate-400',
      icon: Info,
      iconColor: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-700'
    }
  };
  
  const styles = priorityStyles[insight.priority];
  const PriorityIcon = styles.icon;
  
  // Theme labels
  const themeLabels: Record<InsightTheme, string> = {
    tuesday_question: 'Your Question',
    cash_runway: 'Cash Position',
    debtor_opportunity: 'Collections',
    cost_structure: 'Costs',
    tax_obligations: 'Tax',
    profitability: 'Profitability',
    client_health: 'Clients',
    pricing_power: 'Pricing'
  };
  
  const hasMoreContent = insight.detail || insight.recommendation || insight.client_quote;
  
  return (
    <div 
      className={`rounded-lg ${styles.bg} ${styles.border} p-4 transition-all duration-200 ${
        expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${styles.badge}`}>
          <PriorityIcon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Theme badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {themeLabels[insight.theme]}
            </span>
            {insight.is_tuesday_answer && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                Tuesday Question
              </span>
            )}
          </div>
          
          {/* Title */}
          <h4 className="text-lg font-semibold text-gray-900 leading-tight">
            {insight.title}
          </h4>
          
          {/* Summary */}
          <p className="mt-2 text-gray-700 leading-relaxed">
            {insight.summary}
          </p>
          
          {/* Client quote teaser */}
          {insight.client_quote && !expanded && (
            <div className="mt-3 flex items-start gap-2 text-sm text-gray-500 italic">
              <Quote className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">"{insight.client_quote}"</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {editable && (
            <button 
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {hasMoreContent && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-4">
          {/* Detail */}
          {insight.detail && (
            <div>
              <p className="text-gray-600 leading-relaxed">{insight.detail}</p>
            </div>
          )}
          
          {/* Client Quote - full */}
          {insight.client_quote && (
            <div className="bg-white/50 rounded-lg p-3 border border-gray-200/50">
              <div className="flex items-start gap-2">
                <Quote className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="italic text-gray-600">"{insight.client_quote}"</p>
                  {insight.emotional_anchor && (
                    <p className="mt-1 text-sm text-gray-500">— {insight.emotional_anchor}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Recommendation - Foresight+ only */}
          {showRecommendations && insight.recommendation && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-700">What to do:</span>
                  <p className="text-gray-600">{insight.recommendation}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Scenario Teaser */}
          {showRecommendations && insight.scenario_teaser && insight.linked_scenario_id && (
            <button
              onClick={() => onRunScenario?.(insight.linked_scenario_id!)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">{insight.scenario_teaser}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
          
          {/* Visualization placeholder */}
          {insight.visualization_type !== 'none' && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <InsightVisualization 
                type={insight.visualization_type}
                data={insight.visualization_data}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// INSIGHT VISUALIZATION
// ============================================

interface InsightVisualizationProps {
  type: VisualizationType;
  data?: Record<string, unknown> | null;
}

function InsightVisualization({ type, data }: InsightVisualizationProps) {
  if (!data) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400">
        <BarChart3 className="w-8 h-8" />
      </div>
    );
  }
  
  switch (type) {
    case 'comparison':
      return <ComparisonViz data={data} />;
    case 'progress':
      return <ProgressViz data={data} />;
    case 'waterfall':
      return <WaterfallViz data={data} />;
    default:
      return (
        <div className="h-32 flex items-center justify-center text-gray-400">
          Visualization: {type}
        </div>
      );
  }
}

function ComparisonViz({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ label: string; value: number; color?: string }>) || [];
  const max = Math.max(...items.map(i => Math.abs(i.value)));
  
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${item.color || 'bg-blue-500'}`}
              style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressViz({ data }: { data: Record<string, unknown> }) {
  const current = (data.current as number) || 0;
  const target = (data.target as number) || 100;
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Progress</span>
        <span className="font-medium">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{current.toLocaleString()}</span>
        <span>{target.toLocaleString()}</span>
      </div>
    </div>
  );
}

function WaterfallViz({ data }: { data: Record<string, unknown> }) {
  const steps = (data.steps as Array<{ label: string; value: number; type: 'positive' | 'negative' | 'total' }>) || [];
  
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 truncate">{step.label}</span>
          <div className="flex-1 h-6 flex items-center">
            <div 
              className={`h-full rounded ${
                step.type === 'positive' ? 'bg-green-500' :
                step.type === 'negative' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(Math.abs(step.value) / 1000, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium w-16 text-right ${
            step.type === 'positive' ? 'text-green-600' :
            step.type === 'negative' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {step.type === 'negative' ? '-' : ''}{Math.abs(step.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

