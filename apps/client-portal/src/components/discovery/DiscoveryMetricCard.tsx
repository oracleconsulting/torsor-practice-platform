// DiscoveryMetricCard.tsx
// Professional metric display cards for Discovery Assessment
// Matches the visual quality of Business Intelligence reports

import { TrendingUp, TrendingDown, Clock, Target, Zap, DollarSign } from 'lucide-react';

export type MetricType = 'investment' | 'return' | 'payback' | 'roi' | 'savings' | 'default';
export type MetricStatus = 'positive' | 'negative' | 'warning' | 'neutral';

interface DiscoveryMetricCardProps {
  label: string;
  value: string;
  context?: string;
  type?: MetricType;
  status?: MetricStatus;
  highlight?: boolean;
}

const iconMap: Record<MetricType, typeof TrendingUp> = {
  investment: DollarSign,
  return: TrendingUp,
  payback: Clock,
  roi: Target,
  savings: Zap,
  default: TrendingUp,
};

const statusColors: Record<MetricStatus, { bg: string; text: string; accent: string }> = {
  positive: {
    bg: 'from-emerald-50 to-emerald-100',
    text: 'text-emerald-600',
    accent: 'from-emerald-500 to-emerald-600',
  },
  negative: {
    bg: 'from-red-50 to-red-100',
    text: 'text-red-600',
    accent: 'from-red-500 to-red-600',
  },
  warning: {
    bg: 'from-amber-50 to-amber-100',
    text: 'text-amber-600',
    accent: 'from-amber-500 to-amber-600',
  },
  neutral: {
    bg: 'from-slate-50 to-slate-100',
    text: 'text-slate-600',
    accent: 'from-slate-400 to-slate-500',
  },
};

export function DiscoveryMetricCard({
  label,
  value,
  context,
  type = 'default',
  status = 'neutral',
  highlight = false,
}: DiscoveryMetricCardProps) {
  const Icon = iconMap[type];
  const colors = statusColors[status];
  
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5 md:p-6 
        bg-gradient-to-br ${highlight ? 'from-emerald-50 to-teal-100 border-emerald-200' : colors.bg}
        border ${highlight ? 'border-2' : 'border'}
        shadow-sm hover:shadow-md transition-shadow duration-200
      `}
    >
      {/* Top accent bar */}
      <div 
        className={`
          absolute top-0 left-0 right-0 h-1 
          bg-gradient-to-r ${highlight ? 'from-emerald-500 to-teal-500' : colors.accent}
        `}
      />
      
      {/* Icon background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 opacity-5">
        <Icon className="w-full h-full" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${highlight ? 'text-emerald-600' : colors.text}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-emerald-600' : 'text-slate-500'}`}>
            {label}
          </span>
        </div>
        
        <div className={`text-2xl md:text-3xl font-bold ${highlight ? 'text-emerald-700' : colors.text} leading-tight`}>
          {value}
        </div>
        
        {context && (
          <div className="text-sm text-slate-500 mt-2">
            {context}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid wrapper for metric cards
interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function MetricGrid({ children, columns = 3 }: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={`grid ${gridCols[columns]} gap-4 md:gap-5`}>
      {children}
    </div>
  );
}

// Specialized metric card for ROI summary
interface ROISummaryCardProps {
  totalInvestment: string;
  projectedReturn: string;
  paybackPeriod: string;
  investmentAsPercent?: string;
}

export function ROISummaryCard({
  totalInvestment,
  projectedReturn,
  paybackPeriod,
  investmentAsPercent,
}: ROISummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Investment Overview
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Investment</div>
            <div className="text-xl md:text-2xl font-bold text-white">{totalInvestment}</div>
            {investmentAsPercent && (
              <div className="text-xs text-slate-400 mt-1">{investmentAsPercent}</div>
            )}
          </div>
          
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Projected Return</div>
            <div className="text-xl md:text-2xl font-bold text-emerald-400">{projectedReturn}</div>
          </div>
          
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Payback</div>
            <div className="text-xl md:text-2xl font-bold text-amber-400">{paybackPeriod}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

