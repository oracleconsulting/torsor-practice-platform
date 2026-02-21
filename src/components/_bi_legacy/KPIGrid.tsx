/**
 * KPI Grid
 * Display KPIs with RAG status and trends
 * Responsive grid layout
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Edit2 } from 'lucide-react';
import type { BIKPIValue, RAGStatus, TrendDirection } from '../../types/business-intelligence';

interface KPIGridProps {
  kpiValues: BIKPIValue[];
  editable?: boolean;
  onEditKPI?: (kpiId: string) => void;
}

export function KPIGrid({ kpiValues, editable, onEditKPI }: KPIGridProps) {
  if (!kpiValues || kpiValues.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <p className="text-gray-500">No KPIs calculated yet.</p>
      </div>
    );
  }
  
  // Group KPIs by featured vs regular
  const featuredKPIs = kpiValues.filter(k => k.is_featured);
  const regularKPIs = kpiValues.filter(k => !k.is_featured);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
          <p className="text-sm text-gray-500">{kpiValues.length} KPIs tracked</p>
        </div>
      </div>
      
      {/* Featured KPIs - larger tiles */}
      {featuredKPIs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {featuredKPIs.map(kpi => (
            <KPITile 
              key={kpi.id} 
              kpi={kpi} 
              featured
              editable={editable}
              onEdit={() => onEditKPI?.(kpi.id)}
            />
          ))}
        </div>
      )}
      
      {/* Regular KPIs - compact grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {regularKPIs.map(kpi => (
          <KPITile 
            key={kpi.id} 
            kpi={kpi}
            editable={editable}
            onEdit={() => onEditKPI?.(kpi.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// KPI TILE COMPONENT
// ============================================

interface KPITileProps {
  kpi: BIKPIValue;
  featured?: boolean;
  editable?: boolean;
  onEdit?: () => void;
}

function KPITile({ kpi, featured, editable, onEdit }: KPITileProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const ragColors: Record<RAGStatus, { bg: string; border: string; text: string; dot: string }> = {
    red: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-700',
      dot: 'bg-red-500'
    },
    amber: { 
      bg: 'bg-amber-50', 
      border: 'border-amber-200', 
      text: 'text-amber-700',
      dot: 'bg-amber-500'
    },
    green: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-700',
      dot: 'bg-green-500'
    },
    neutral: { 
      bg: 'bg-gray-50', 
      border: 'border-gray-200', 
      text: 'text-gray-700',
      dot: 'bg-gray-400'
    },
    grey: { 
      bg: 'bg-slate-50', 
      border: 'border-slate-200', 
      text: 'text-slate-700',
      dot: 'bg-slate-400'
    }
  };
  
  const colors = ragColors[kpi.rag_status || 'neutral'];
  
  const TrendIcon = ({ direction }: { direction: TrendDirection | null }) => {
    if (!direction || direction === 'flat') {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
    if (direction === 'up') {
      return <TrendingUp className={`w-3 h-3 ${kpi.trend_is_positive ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return <TrendingDown className={`w-3 h-3 ${kpi.trend_is_positive ? 'text-green-500' : 'text-red-500'}`} />;
  };
  
  if (featured) {
    return (
      <div 
        className={`rounded-xl p-4 border-2 ${colors.bg} ${colors.border} relative group`}
      >
        {/* RAG indicator */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${colors.dot}`} />
        
        {/* Edit button */}
        {editable && (
          <button 
            onClick={onEdit}
            className="absolute top-3 right-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        
        {/* KPI Name */}
        <div className="text-sm text-gray-600 mb-2 font-medium">
          {kpi.definition?.name || 'Unknown KPI'}
        </div>
        
        {/* Value */}
        <div className={`text-2xl md:text-3xl font-bold ${colors.text}`}>
          {kpi.formatted_value || '-'}
        </div>
        
        {/* Trend */}
        {kpi.change_percentage !== null && kpi.change_percentage !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <TrendIcon direction={kpi.trend_direction} />
            <span>
              {kpi.change_percentage >= 0 ? '+' : ''}{kpi.change_percentage.toFixed(1)}%
            </span>
            <span className="text-gray-400">vs prior</span>
          </div>
        )}
      </div>
    );
  }
  
  // Compact tile
  return (
    <div 
      className={`rounded-lg p-3 border ${colors.bg} ${colors.border} relative group cursor-pointer`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* RAG dot */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.dot}`} />
      
      {/* KPI Name - truncated */}
      <div className="text-xs text-gray-500 mb-1 truncate pr-4">
        {kpi.definition?.name || 'Unknown'}
      </div>
      
      {/* Value */}
      <div className={`text-lg font-bold ${colors.text} truncate`}>
        {kpi.formatted_value || '-'}
      </div>
      
      {/* Micro trend */}
      {kpi.trend_direction && (
        <div className="mt-1">
          <TrendIcon direction={kpi.trend_direction} />
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-48">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <div className="font-semibold mb-1">{kpi.definition?.name}</div>
            <div className="text-gray-300 mb-2">{kpi.definition?.description}</div>
            {kpi.change_percentage !== null && kpi.change_percentage !== undefined && (
              <div className="text-gray-400">
                {kpi.change_percentage >= 0 ? '+' : ''}{kpi.change_percentage.toFixed(1)}% vs prior period
              </div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CATEGORY LABELS
// ============================================

export const KPI_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  cash_working_capital: { label: 'Cash & Working Capital', icon: '💰' },
  revenue_growth: { label: 'Revenue & Growth', icon: '📈' },
  profitability: { label: 'Profitability', icon: '💵' },
  efficiency: { label: 'Efficiency', icon: '⚡' },
  client_health: { label: 'Client Health', icon: '🤝' }
};

