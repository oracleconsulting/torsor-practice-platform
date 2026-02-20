'use client';

import { 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Play, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  ArrowRight,
  GripVertical,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { InsightVisualization } from './InsightVisualization';
import type { MADashboardInsight, InsightPriority } from '../../../types/ma-dashboard';

interface DashboardInsightCardProps {
  insight: MADashboardInsight;
  isExpanded: boolean;
  onToggle: () => void;
  onScenarioClick?: (scenarioId: string) => void;
  editMode?: boolean;
  onEdit?: (insight: MADashboardInsight) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function DashboardInsightCard({
  insight,
  isExpanded,
  onToggle,
  onScenarioClick,
  editMode,
  onEdit,
  isDragging,
  dragHandleProps,
}: DashboardInsightCardProps) {
  const priorityConfig: Record<InsightPriority, { 
    colors: string; 
    bgColor: string;
    icon: React.ReactNode;
    label: string;
  }> = {
    critical: {
      colors: 'border-l-red-500',
      bgColor: 'bg-red-50',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      label: 'Critical',
    },
    warning: {
      colors: 'border-l-amber-500',
      bgColor: 'bg-amber-50',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      label: 'Warning',
    },
    opportunity: {
      colors: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      label: 'Opportunity',
    },
    info: {
      colors: 'border-l-blue-500',
      bgColor: 'bg-blue-50',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      label: 'Info',
    },
  };

  const config = priorityConfig[insight.priority as InsightPriority] || priorityConfig.info;

  return (
    <div
      className={`border-l-4 rounded-r-xl bg-white shadow-sm transition-all ${config.colors} ${
        isDragging ? 'shadow-lg opacity-90' : ''
      }`}
    >
      {/* Header */}
      <div 
        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors rounded-tr-xl ${
          isExpanded ? '' : 'rounded-br-xl'
        }`}
        onClick={onToggle}
      >
        {/* Drag Handle (edit mode only) */}
        {editMode && (
          <div
            {...dragHandleProps}
            className="cursor-grab hover:bg-slate-100 rounded p-1 -ml-1 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        )}
        
        {/* Icon */}
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          {config.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-800">{insight.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${
              insight.priority === 'critical' ? 'text-red-700' :
              insight.priority === 'warning' ? 'text-amber-700' :
              insight.priority === 'opportunity' ? 'text-emerald-700' :
              'text-blue-700'
            }`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            {insight.description?.split('\n')[0] || ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {editMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(insight);
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <div className="p-1.5">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Full Description */}
          <div className="pt-4 prose prose-sm max-w-none text-slate-700">
            <div className="whitespace-pre-wrap">{insight.description}</div>
          </div>

          {/* Data Points */}
          {insight.data_points && insight.data_points.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insight.data_points.map((dp, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                >
                  {dp}
                </span>
              ))}
            </div>
          )}

          {/* Visualization */}
          {insight.visualization_type && insight.visualization_type !== 'none' && insight.visualization_config && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <InsightVisualization
                type={insight.visualization_type}
                config={insight.visualization_config}
              />
            </div>
          )}

          {/* Implications */}
          {insight.implications && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-slate-700">What this means: </span>
                  <span className="text-slate-600">{insight.implications}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {insight.recommendation && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-blue-900">Recommendation</h5>
                  <p className="text-sm text-blue-700 mt-1">{insight.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Scenario */}
          {insight.linked_scenario_id && insight.linked_scenario && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScenarioClick?.(insight.linked_scenario_id!);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              See "{insight.linked_scenario.short_label || insight.linked_scenario.name}" scenario
            </button>
          )}
        </div>
      )}
    </div>
  );
}

