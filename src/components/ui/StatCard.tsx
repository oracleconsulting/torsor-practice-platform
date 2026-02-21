import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Accent = 'blue' | 'teal' | 'orange' | 'red';
type Trend = 'up' | 'down' | 'flat';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: Accent;
  trend?: Trend;
  trendValue?: string;
  icon?: ReactNode;
  subtitle?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  flat: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' },
};

export function StatCard({ label, value, accent = 'blue', trend, trendValue, icon, subtitle }: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="flex items-start justify-between">
        <div className="pl-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-display">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      {trend && trendValue && TrendIcon && (
        <div className={`inline-flex items-center gap-1 mt-2 ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${trendConfig[trend].bg} ${trendConfig[trend].color}`}>
          <TrendIcon className="w-3 h-3" />
          {trendValue}
        </div>
      )}
    </div>
  );
}
