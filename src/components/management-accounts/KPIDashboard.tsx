'use client';

import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react';

// Types matching the database schema
interface KPIData {
  kpi_code: string;
  kpi_name: string;
  category: string;
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'number';
  decimal_places: number;
  higher_is_better: boolean | null;
  display_order: number;
  is_mandatory: boolean;
  target_value: number | null;
  current_value: number | null;
  previous_value: number | null;
  previous_year_value: number | null;
  rag_status: 'green' | 'amber' | 'red' | null;
  trend: 'improving' | 'stable' | 'declining' | null;
  change_vs_previous: number | null;
  change_vs_previous_pct: number | null;
  as_of_date: string | null;
  auto_commentary: string | null;
  human_commentary: string | null;
  industry_benchmarks: Record<string, number>;
}

interface KPIDashboardProps {
  kpis: KPIData[];
  asOfDate: string;
  engagementTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  industryType?: string;
  onKPIClick?: (kpiCode: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format value based on unit type
function formatValue(value: number | null, unit: string, decimals: number = 0): string {
  if (value === null || value === undefined) return '—';
  
  switch (unit) {
    case 'currency':
      if (value >= 1000000) {
        return `£${(value / 1000000).toFixed(1)}m`;
      } else if (value >= 1000) {
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

// Format change value
function formatChange(change: number | null, changePct: number | null, unit: string): string {
  if (change === null) return '';
  
  const sign = change >= 0 ? '+' : '';
  
  if (unit === 'percentage' || unit === 'ratio') {
    return `${sign}${change.toFixed(1)} pts`;
  }
  
  if (changePct !== null) {
    return `${sign}${changePct.toFixed(1)}%`;
  }
  
  return formatValue(change, unit);
}

// RAG status colors and icons
const RAG_CONFIG = {
  green: {
    bg: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: CheckCircle,
    dot: 'bg-green-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: AlertCircle,
    dot: 'bg-amber-500',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
    dot: 'bg-red-500',
  },
};

// Trend icons
function TrendIcon({ trend }: { trend: string | null }) {
  if (!trend || trend === 'stable') {
    return <Minus className="h-4 w-4 text-slate-400" />;
  }
  
  if (trend === 'improving') {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

// Single KPI Tile Component
function KPITile({ 
  kpi, 
  onClick,
  showBenchmark,
  industryType,
}: { 
  kpi: KPIData;
  onClick?: () => void;
  showBenchmark: boolean;
  industryType?: string;
}) {
  const rag = kpi.rag_status ? RAG_CONFIG[kpi.rag_status] : null;
  const benchmark = industryType && kpi.industry_benchmarks?.[industryType];
  
  const changeIsPositive = kpi.change_vs_previous !== null && kpi.change_vs_previous >= 0;
  const changeIsGood = kpi.higher_is_better !== null 
    ? (changeIsPositive === kpi.higher_is_better)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all hover:shadow-md",
        rag ? `${rag.bg} ${rag.border}` : "bg-white border-slate-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            {kpi.kpi_name}
          </span>
          {kpi.is_mandatory && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
              Core
            </span>
          )}
        </div>
        {rag && (
          <div className={cn("w-3 h-3 rounded-full", rag.dot)} title={`Status: ${kpi.rag_status}`} />
        )}
      </div>
      
      {/* Main Value */}
      <div className="mb-2">
        <span className={cn(
          "text-3xl font-bold",
          rag ? rag.text : "text-slate-800"
        )}>
          {formatValue(kpi.current_value, kpi.unit, kpi.decimal_places)}
        </span>
      </div>
      
      {/* Change and Trend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {kpi.change_vs_previous !== null && (
            <>
              {changeIsGood !== null && (
                changeIsGood ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )
              )}
              <span className={cn(
                "text-sm font-medium",
                changeIsGood === true && "text-green-600",
                changeIsGood === false && "text-red-600",
                changeIsGood === null && "text-slate-600"
              )}>
                {formatChange(kpi.change_vs_previous, kpi.change_vs_previous_pct, kpi.unit)}
              </span>
            </>
          )}
        </div>
        
        <TrendIcon trend={kpi.trend} />
      </div>
      
      {/* Target comparison */}
      {kpi.target_value !== null && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Target</span>
            <span className="font-medium text-slate-700">
              {formatValue(kpi.target_value, kpi.unit, kpi.decimal_places)}
            </span>
          </div>
        </div>
      )}
      
      {/* Benchmark comparison (Gold+ only) */}
      {showBenchmark && benchmark && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Industry avg</span>
            <span className="font-medium text-purple-600">
              {formatValue(benchmark, kpi.unit, kpi.decimal_places)}
            </span>
          </div>
        </div>
      )}
      
      {/* View details indicator */}
      <div className="flex items-center justify-end mt-3 text-slate-400">
        <span className="text-xs">View details</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}

// True Cash Hero Component (special display for the mandatory KPI)
function TrueCashHero({ 
  kpi, 
  onClick,
}: { 
  kpi: KPIData;
  onClick?: () => void;
}) {
  const rag = kpi.rag_status ? RAG_CONFIG[kpi.rag_status] : null;
  
  // Calculate runway if we have burn rate data
  // (This would need additional data in a real implementation)
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg",
        rag ? `${rag.bg} ${rag.border}` : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">True Cash Position</h3>
          <p className="text-sm text-slate-600">Available cash after all commitments</p>
        </div>
        {rag && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full",
            rag.bg,
            rag.text
          )}>
            <div className={cn("w-2 h-2 rounded-full", rag.dot)} />
            <span className="text-sm font-medium capitalize">{kpi.rag_status}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className={cn(
            "text-5xl font-bold",
            rag ? rag.text : "text-blue-700"
          )}>
            {formatValue(kpi.current_value, 'currency', 0)}
          </span>
          
          {kpi.change_vs_previous !== null && (
            <div className="flex items-center gap-2 mt-2">
              {kpi.change_vs_previous >= 0 ? (
                <ArrowUp className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDown className="h-5 w-5 text-red-500" />
              )}
              <span className={cn(
                "text-lg font-medium",
                kpi.change_vs_previous >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatChange(kpi.change_vs_previous, kpi.change_vs_previous_pct, 'currency')} vs last month
              </span>
            </div>
          )}
        </div>
        
        {/* Runway indicator */}
        <div className="text-right">
          <div className="text-sm text-slate-500">Runway</div>
          <div className="text-2xl font-bold text-slate-700">
            {/* This would be calculated from actual data */}
            2.1 months
          </div>
        </div>
      </div>
      
      {/* Progress bar showing True Cash vs Bank Balance */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">True Cash</span>
          <span className="text-slate-400">Bank Balance: £95,430</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              rag?.dot || "bg-blue-500"
            )}
            style={{ width: '49%' }} // Would be calculated
          />
        </div>
      </div>
      
      {/* View details */}
      <div className="flex items-center justify-end mt-4 text-slate-500">
        <span className="text-sm">See breakdown</span>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}

export function KPIDashboard({
  kpis,
  asOfDate,
  engagementTier,
  industryType,
  onKPIClick,
  onRefresh,
  onExport,
  onSettings,
  isLoading,
}: KPIDashboardProps) {
  
  // Sort KPIs by display order
  const sortedKPIs = useMemo(() => 
    [...kpis].sort((a, b) => a.display_order - b.display_order),
    [kpis]
  );
  
  // Separate True Cash from other KPIs
  const trueCashKPI = sortedKPIs.find(k => k.kpi_code === 'true_cash');
  const otherKPIs = sortedKPIs.filter(k => k.kpi_code !== 'true_cash');
  
  // Show benchmarks for Gold+ tiers
  const showBenchmarks = engagementTier === 'gold' || engagementTier === 'platinum';
  
  // Count RAG statuses
  const ragCounts = useMemo(() => {
    return kpis.reduce((acc, kpi) => {
      if (kpi.rag_status) {
        acc[kpi.rag_status] = (acc[kpi.rag_status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Financial Dashboard</h1>
          <p className="text-slate-600 flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            As of {new Date(asOfDate).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* RAG Summary */}
          <div className="flex items-center gap-2 mr-4">
            {ragCounts.green && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-600">{ragCounts.green}</span>
              </div>
            )}
            {ragCounts.amber && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">{ragCounts.amber}</span>
              </div>
            )}
            {ragCounts.red && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-600">{ragCounts.red}</span>
              </div>
            )}
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="h-5 w-5" />
            </button>
          )}
          
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dashboard settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* True Cash Hero (always first) */}
      {trueCashKPI && (
        <TrueCashHero 
          kpi={trueCashKPI} 
          onClick={() => onKPIClick?.('true_cash')}
        />
      )}
      
      {/* Other KPIs Grid */}
      {otherKPIs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherKPIs.map(kpi => (
            <KPITile
              key={kpi.kpi_code}
              kpi={kpi}
              onClick={() => onKPIClick?.(kpi.kpi_code)}
              showBenchmark={showBenchmarks}
              industryType={industryType}
            />
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {kpis.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No KPIs Configured</h3>
          <p className="text-slate-500 mt-2">
            Select your KPIs to start tracking your financial health.
          </p>
          {onSettings && (
            <button
              onClick={onSettings}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Configure KPIs
            </button>
          )}
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default KPIDashboard;

