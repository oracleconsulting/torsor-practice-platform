/**
 * KPI Trend Chart Component
 * Displays KPI trends with sparklines and change indicators
 */

'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Target,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import type { KPITrend } from '../../hooks/useKPITrends';

// ============================================================================
// TYPES
// ============================================================================

interface KPITrendChartProps {
  trends: KPITrend[];
  onKPIClick?: (kpiCode: string) => void;
  maxDisplay?: number;
  showTargets?: boolean;
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showArea?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatValue = (value: number, format: KPITrend['format'], _unit: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: value >= 1000000 ? 'compact' : 'standard'
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'days':
      return `${Math.round(value)} days`;
    default:
      return value >= 1000 
        ? new Intl.NumberFormat('en-GB', { notation: 'compact' }).format(value)
        : value.toFixed(1);
  }
};

const getRAGColor = (status: string | undefined): string => {
  switch (status) {
    case 'green': return 'text-emerald-600';
    case 'amber': return 'text-amber-600';
    case 'red': return 'text-red-600';
    default: return 'text-slate-600';
  }
};

const getRAGBg = (status: string | undefined): string => {
  switch (status) {
    case 'green': return 'bg-emerald-50 border-emerald-200';
    case 'amber': return 'bg-amber-50 border-amber-200';
    case 'red': return 'bg-red-50 border-red-200';
    default: return 'bg-slate-50 border-slate-200';
  }
};

// ============================================================================
// SPARKLINE COMPONENT
// ============================================================================

function Sparkline({ 
  data, 
  width = 100, 
  height = 32, 
  strokeColor = '#3B82F6',
  fillColor = '#3B82F6',
  showArea = true 
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-slate-300" 
        style={{ width, height }}
      >
        <Activity className="w-4 h-4" />
      </div>
    );
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Generate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });
  
  // Generate SVG path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Area path (for fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;
  
  // Determine trend color
  const isUp = data[data.length - 1] > data[0];
  const actualStroke = strokeColor === '#3B82F6' 
    ? (isUp ? '#10B981' : '#EF4444') 
    : strokeColor;
  const actualFill = fillColor === '#3B82F6'
    ? (isUp ? '#10B98120' : '#EF444420')
    : fillColor + '20';
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path
          d={areaPath}
          fill={actualFill}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={actualStroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={actualStroke}
      />
    </svg>
  );
}

// ============================================================================
// TREND ICON
// ============================================================================

function TrendIcon({ direction, isImprovement }: { direction: 'up' | 'down' | 'flat'; isImprovement: boolean }) {
  const colorClass = isImprovement ? 'text-emerald-600' : direction === 'flat' ? 'text-slate-400' : 'text-red-600';
  
  switch (direction) {
    case 'up':
      return <TrendingUp className={`w-4 h-4 ${colorClass}`} />;
    case 'down':
      return <TrendingDown className={`w-4 h-4 ${colorClass}`} />;
    default:
      return <Minus className={`w-4 h-4 ${colorClass}`} />;
  }
}

// ============================================================================
// KPI CARD
// ============================================================================

function KPITrendCard({ trend, onClick, showTarget }: { 
  trend: KPITrend; 
  onClick?: () => void;
  showTarget?: boolean;
}) {
  const currentRAG = trend.data_points[trend.data_points.length - 1]?.rag_status;
  const sparklineData = trend.data_points.map(dp => dp.value);
  const currentTarget = trend.data_points[trend.data_points.length - 1]?.target;
  
  return (
    <div 
      className={`
        p-4 rounded-lg border-2 transition-all cursor-pointer
        ${getRAGBg(currentRAG)}
        hover:shadow-md hover:scale-[1.02]
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-slate-700 leading-tight">
            {trend.kpi_name}
          </h4>
          {trend.unit && (
            <span className="text-xs text-slate-400">{trend.unit}</span>
          )}
        </div>
        <TrendIcon direction={trend.trend_direction} isImprovement={trend.is_improvement} />
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-2xl font-bold ${getRAGColor(currentRAG)}`}>
            {formatValue(trend.current_value, trend.format, trend.unit)}
          </div>
          {trend.change_pct !== undefined && (
            <div className={`text-xs font-medium ${trend.is_improvement ? 'text-emerald-600' : trend.trend_direction === 'flat' ? 'text-slate-400' : 'text-red-600'}`}>
              {trend.change_pct >= 0 ? '+' : ''}{trend.change_pct.toFixed(1)}% vs prior
            </div>
          )}
        </div>
        <Sparkline data={sparklineData} width={80} height={28} />
      </div>
      
      {showTarget && currentTarget && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center gap-2 text-xs text-slate-500">
          <Target className="w-3 h-3" />
          Target: {formatValue(currentTarget, trend.format, trend.unit)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KPITrendChart({ 
  trends, 
  onKPIClick, 
  maxDisplay = 8,
  showTargets = true 
}: KPITrendChartProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedTrends = showAll ? trends : trends.slice(0, maxDisplay);
  const hasMore = trends.length > maxDisplay;
  
  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No KPI trend data available</p>
        <p className="text-sm text-slate-400 mt-1">Complete more periods to see trends</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              KPI Trends
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {trends.length} metrics tracked across {trends[0]?.data_points.length || 0} periods
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500">On Track</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-500">Attention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-500">Critical</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedTrends.map(trend => (
            <KPITrendCard
              key={trend.kpi_code}
              trend={trend}
              onClick={() => onKPIClick?.(trend.kpi_code)}
              showTarget={showTargets}
            />
          ))}
        </div>
        
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1"
          >
            Show {trends.length - maxDisplay} more KPIs
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export function KPITrendCompact({ trends, maxDisplay = 4 }: { trends: KPITrend[]; maxDisplay?: number }) {
  const displayedTrends = trends.slice(0, maxDisplay);
  
  return (
    <div className="space-y-3">
      {displayedTrends.map(trend => {
        const currentRAG = trend.data_points[trend.data_points.length - 1]?.rag_status;
        const sparklineData = trend.data_points.map(dp => dp.value);
        
        return (
          <div key={trend.kpi_code} className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{trend.kpi_name}</div>
              <div className={`text-lg font-bold ${getRAGColor(currentRAG)}`}>
                {formatValue(trend.current_value, trend.format, trend.unit)}
              </div>
            </div>
            <Sparkline data={sparklineData} width={60} height={24} />
            <TrendIcon direction={trend.trend_direction} isImprovement={trend.is_improvement} />
          </div>
        );
      })}
    </div>
  );
}

export default KPITrendChart;

