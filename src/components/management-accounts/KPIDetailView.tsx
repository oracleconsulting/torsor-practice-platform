'use client';

import { useMemo } from 'react';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Calendar,
  BarChart3
} from 'lucide-react';

interface KPIHistoryPoint {
  period_end: string;
  value: number | null;
  target_value: number | null;
  benchmark_value: number | null;
  rag_status: 'green' | 'amber' | 'red' | null;
}

interface WatchListItem {
  name: string;
  value: number;
  days?: number;
  note?: string;
}

interface KPIDetailData {
  kpi_code: string;
  kpi_name: string;
  category: string;
  description: string;
  calculation_notes: string;
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'number';
  decimal_places: number;
  higher_is_better: boolean | null;
  
  // Current values
  current_value: number | null;
  previous_value: number | null;
  previous_year_value: number | null;
  target_value: number | null;
  benchmark_value: number | null;
  
  // Status
  rag_status: 'green' | 'amber' | 'red' | null;
  trend: 'improving' | 'stable' | 'declining' | null;
  
  // Changes
  change_vs_previous: number | null;
  change_vs_previous_pct: number | null;
  change_vs_previous_year: number | null;
  change_vs_previous_year_pct: number | null;
  
  // Commentary
  auto_commentary: string | null;
  human_commentary: string | null;
  
  // History for chart
  history: KPIHistoryPoint[];
  
  // Supporting data
  watch_list?: WatchListItem[];
  breakdown?: Array<{ label: string; value: number }>;
}

interface KPIDetailViewProps {
  data: KPIDetailData;
  engagementTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  onBack: () => void;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format value based on unit type
function formatValue(value: number | null, unit: string, decimals: number = 0): string {
  if (value === null || value === undefined) return '—';
  
  switch (unit) {
    case 'currency':
      if (Math.abs(value) >= 1000000) {
        return `£${(value / 1000000).toFixed(1)}m`;
      } else if (Math.abs(value) >= 1000) {
        return `£${(value / 1000).toFixed(0)}k`;
      }
      return `£${value.toLocaleString()}`;
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'days':
      return `${Math.round(value)} days`;
    case 'ratio':
      return `${value.toFixed(decimals)}:1`;
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
  }
}

// RAG status configuration
const RAG_CONFIG = {
  green: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    icon: CheckCircle,
    label: 'On Track',
  },
  amber: {
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: AlertCircle,
    label: 'Needs Attention',
  },
  red: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    icon: AlertCircle,
    label: 'Action Required',
  },
};

// Simple sparkline chart component
function SparklineChart({ 
  history, 
  unit, 
  target,
  benchmark,
  showTarget = true,
  showBenchmark = false,
}: { 
  history: KPIHistoryPoint[];
  unit: string;
  target: number | null;
  benchmark: number | null;
  showTarget?: boolean;
  showBenchmark?: boolean;
}) {
  // Calculate min/max for scaling
  const values = history.map(h => h.value).filter((v): v is number => v !== null);
  if (values.length === 0) return <div className="text-slate-400 text-center py-8">No data available</div>;
  
  const allValues = [...values];
  if (showTarget && target !== null) allValues.push(target);
  if (showBenchmark && benchmark !== null) allValues.push(benchmark);
  
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.1;
  const range = max - min;
  
  const chartHeight = 200;
  
  // Generate points for the line
  const points = history.map((point, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = point.value !== null 
      ? chartHeight - ((point.value - min) / range) * chartHeight
      : chartHeight / 2;
    return `${x},${y}`;
  }).join(' ');
  
  // Target line Y position
  const targetY = target !== null 
    ? chartHeight - ((target - min) / range) * chartHeight 
    : null;
  
  // Benchmark line Y position
  const benchmarkY = benchmark !== null 
    ? chartHeight - ((benchmark - min) / range) * chartHeight 
    : null;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500 pr-2">
        <span>{formatValue(max, unit)}</span>
        <span>{formatValue((max + min) / 2, unit)}</span>
        <span>{formatValue(min, unit)}</span>
      </div>
      
      {/* Chart area */}
      <div className="ml-16">
        <svg 
          viewBox={`0 0 100 ${chartHeight}`} 
          className="w-full h-48"
          preserveAspectRatio="none"
        >
          {/* Target line */}
          {showTarget && targetY !== null && (
            <line
              x1="0"
              y1={targetY}
              x2="100"
              y2={targetY}
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.7"
            />
          )}
          
          {/* Benchmark line */}
          {showBenchmark && benchmarkY !== null && (
            <line
              x1="0"
              y1={benchmarkY}
              x2="100"
              y2={benchmarkY}
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.7"
            />
          )}
          
          {/* Main line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {history.map((point, i) => {
            if (point.value === null) return null;
            const x = (i / (history.length - 1)) * 100;
            const y = chartHeight - ((point.value - min) / range) * chartHeight;
            const rag = point.rag_status;
            const fill = rag === 'green' ? '#10b981' : rag === 'amber' ? '#f59e0b' : rag === 'red' ? '#ef4444' : '#3b82f6';
            
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={fill}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          {history.filter((_, i) => i % Math.ceil(history.length / 6) === 0 || i === history.length - 1).map((point, i) => (
            <span key={i}>
              {new Date(point.period_end).toLocaleDateString('en-GB', { month: 'short' })}
            </span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-slate-600">Actual</span>
        </div>
        {showTarget && target !== null && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500 border-dashed" style={{ borderStyle: 'dashed' }} />
            <span className="text-slate-600">Target</span>
          </div>
        )}
        {showBenchmark && benchmark !== null && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-slate-600">Benchmark</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function KPIDetailView({
  data,
  engagementTier,
  onBack,
}: KPIDetailViewProps) {
  const rag = data.rag_status ? RAG_CONFIG[data.rag_status] : null;
  const showBenchmark = engagementTier === 'gold' || engagementTier === 'platinum';
  const showRecommendation = engagementTier !== 'bronze';
  
  // Determine if change is good
  const changeIsGood = useMemo(() => {
    if (data.change_vs_previous === null || data.higher_is_better === null) return null;
    return (data.change_vs_previous >= 0) === data.higher_is_better;
  }, [data.change_vs_previous, data.higher_is_better]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Dashboard</span>
      </button>
      
      {/* Header */}
      <div className={cn(
        "rounded-xl p-6 border-2",
        rag ? `${rag.bg} ${rag.border}` : "bg-white border-slate-200"
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">{data.category}</p>
            <h1 className="text-2xl font-bold text-slate-800">{data.kpi_name}</h1>
            <p className="text-slate-600 mt-1">{data.description}</p>
          </div>
          
          {rag && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              rag.bg,
              rag.text
            )}>
              <rag.icon className="h-5 w-5" />
              <span className="font-semibold">{rag.label}</span>
            </div>
          )}
        </div>
        
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-slate-500">Current</p>
            <p className={cn("text-2xl font-bold", rag?.text || "text-slate-800")}>
              {formatValue(data.current_value, data.unit, data.decimal_places)}
            </p>
          </div>
          
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-slate-500">Target</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatValue(data.target_value, data.unit, data.decimal_places)}
            </p>
          </div>
          
          {showBenchmark && data.benchmark_value !== null && (
            <div className="bg-white/60 rounded-lg p-4">
              <p className="text-sm text-slate-500">Industry Benchmark</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatValue(data.benchmark_value, data.unit, data.decimal_places)}
              </p>
            </div>
          )}
          
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-slate-500">vs Last Month</p>
            <div className="flex items-center gap-2">
              {changeIsGood !== null && (
                changeIsGood ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )
              )}
              <p className={cn(
                "text-2xl font-bold",
                changeIsGood === true && "text-green-600",
                changeIsGood === false && "text-red-600",
                changeIsGood === null && "text-slate-800"
              )}>
                {data.change_vs_previous !== null 
                  ? `${data.change_vs_previous >= 0 ? '+' : ''}${data.change_vs_previous_pct?.toFixed(1)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 12-Month Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">12-Month Trend</h2>
        </div>
        
        <SparklineChart
          history={data.history}
          unit={data.unit}
          target={data.target_value}
          benchmark={data.benchmark_value}
          showTarget={true}
          showBenchmark={showBenchmark}
        />
      </div>
      
      {/* What This Means / Commentary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800">What This Means</h2>
        </div>
        
        {data.human_commentary && (
          <p className="text-slate-700 leading-relaxed mb-4">{data.human_commentary}</p>
        )}
        
        {data.auto_commentary && !data.human_commentary && (
          <p className="text-slate-700 leading-relaxed mb-4">{data.auto_commentary}</p>
        )}
        
        {!data.human_commentary && !data.auto_commentary && (
          <p className="text-slate-500 italic">
            Commentary will be added with your next monthly report.
          </p>
        )}
      </div>
      
      {/* Watch List (if applicable) */}
      {data.watch_list && data.watch_list.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-800">Watch List</h2>
          </div>
          
          <div className="space-y-3">
            {data.watch_list.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  {item.note && <p className="text-sm text-slate-500">{item.note}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700">{formatValue(item.value, data.unit)}</p>
                  {item.days !== undefined && (
                    <p className="text-sm text-slate-500">{item.days} days</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendation (Silver+ only) */}
      {showRecommendation && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-800">Recommendation</h2>
          </div>
          
          {data.human_commentary ? (
            <p className="text-green-800">
              Based on your current performance, we recommend reviewing this metric in your next monthly call.
            </p>
          ) : (
            <p className="text-green-700 italic">
              Specific recommendations will be included in your monthly report.
            </p>
          )}
        </div>
      )}
      
      {/* How It's Calculated */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">How It's Calculated</h2>
        </div>
        
        <p className="text-slate-600 font-mono text-sm bg-white p-4 rounded-lg border border-slate-200">
          {data.calculation_notes}
        </p>
        
        {data.higher_is_better !== null && (
          <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {data.higher_is_better 
              ? 'Higher values are better for this metric'
              : 'Lower values are better for this metric'}
          </p>
        )}
      </div>
    </div>
  );
}

export default KPIDetailView;

